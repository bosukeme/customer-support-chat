"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ChatWindow from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";
import { chatApi } from "@/services/api";

interface Conversation {
    id: string;
    customer_username: string;
    agent_username: string | null;
    status: "OPEN" | "ASSIGNED" | "CLOSED";
}

interface Message {
    timestamp?: string;
    sender: string;
    content?: string;
    type?: string;
    user?: string;
    status: string;
}

interface OnlineUser {
    username: string;
    role: string;
}

export default function SupervisorDashboard() {
    const router = useRouter();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [joined, setJoined] = useState(false);
    const [loading, setLoading] = useState(true);

    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isTypingRef = useRef(false);

    // --- Fetch Supervisor Conversations ---
    const fetchConversations = async () => {
        try {
            const data = await chatApi.getSupervisorConversations();
            setConversations(data);
        } catch (err: any) {
            if (err.response?.status === 403) {
                console.warn("Access denied — redirecting to login.");
                router.push("/login");
            } else {
                console.error("Failed to fetch conversations:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    // --- Fetch Messages for a Conversation ---
    const fetchMessages = async (conversationId: string) => {
        try {
            const data = await chatApi.getMessages(conversationId);
            setMessages(data);
        } catch (err) {
            console.error("Failed to fetch messages:", err);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    // --- Chat WebSocket Connection ---
    useEffect(() => {
        if (!selectedConversation) return;

        if (socket) socket.close();
        fetchMessages(selectedConversation.id);

        const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
        const socketUrl = `${wsScheme}://localhost:8000/ws/chat/${selectedConversation.id}/`;
        const chatSocket = new WebSocket(socketUrl);

        chatSocket.onopen = () => console.log("Supervisor connected to chat WebSocket");

        chatSocket.onmessage = (e) => {
            const data = JSON.parse(e.data);

            if (data.type === "typing.start") {
                setTypingUser(data.user);
            } else if (data.type === "typing.stop") {
                setTypingUser(null);
            } else if (data.type === "message" || data.content) {
                setMessages((prev) => [...prev, data]);
            }
        };

        chatSocket.onclose = () => console.log("Chat WebSocket disconnected");

        setSocket(chatSocket);
        return () => chatSocket.close();
    }, [selectedConversation]);

    // --- Presence WebSocket Connection ---
    useEffect(() => {
        const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
        const presenceSocket = new WebSocket(`${wsScheme}://localhost:8000/ws/supervisor/`);

        presenceSocket.onopen = () => console.log("Connected to presence WebSocket");

        presenceSocket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "presence.snapshot") {
                setOnlineUsers(data.users);
            } else if (data.type === "presence.online") {
                setOnlineUsers((prev) => [
                    ...prev.filter((u) => u.username !== data.user),
                    { username: data.user, role: data.role },
                ]);
            } else if (data.type === "presence.offline") {
                setOnlineUsers((prev) => prev.filter((u) => u.username !== data.user));
            }
        };

        presenceSocket.onclose = () => console.log("Presence WebSocket disconnected");

        return () => presenceSocket.close();
    }, []);

    // --- Send Chat Message ---
    const sendMessage = (msg: string) => {
        if (!socket || !joined) return;
        const payload = { type: "message", message: msg };
        socket.send(JSON.stringify(payload));
    };

    // --- Handle Typing Events ---
    const handleTyping = () => {
        if (!socket || !joined) return;

        if (!isTypingRef.current) {
            isTypingRef.current = true;
            socket.send(JSON.stringify({ type: "typing.start" }));
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            socket.send(JSON.stringify({ type: "typing.stop" }));
        }, 2000);
    };

    const handleJoinChat = () => setJoined(true);

    if (loading) return <p className="text-center mt-10">Loading supervisor dashboard...</p>;

    return (
        <div className="flex flex-col min-h-screen bg-blue-100">
            <div className="flex flex-1">
                {/* Sidebar */}
                <div className="w-1/4 bg-white border-r border-blue-200 p-4 overflow-y-auto">
                    {/* Online Users */}
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-green-700 mb-2">Online Users</h2>
                        {onlineUsers.length === 0 ? (
                            <p className="text-gray-500 text-sm">No users online</p>
                        ) : (
                            <ul className="space-y-1">
                                {onlineUsers.map((user) => (
                                    <li
                                        key={user.username}
                                        className="flex items-center gap-2 text-sm text-gray-700"
                                    >
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        {user.username}{" "}
                                        <span className="text-xs text-gray-400">({user.role})</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Active Conversations */}
                    <h2 className="text-xl font-bold text-blue-700 mb-3">Active Conversations</h2>
                    <ul className="space-y-2">
                        {conversations.map((conv) => (
                            <li
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv)}
                                className={`cursor-pointer p-3 rounded-lg ${selectedConversation?.id === conv.id
                                        ? "bg-blue-200"
                                        : "hover:bg-blue-50"
                                    }`}
                            >
                                <p className="font-semibold text-gray-800">
                                    Customer: {conv.customer_username}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Agent: {conv.agent_username || "Unassigned"}
                                </p>
                                <p className="text-xs text-gray-400">{conv.status}</p>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Main Chat View */}
                <main className="flex-1 p-4">
                    {selectedConversation ? (
                        <div className="flex flex-col h-[80vh]">
                            <div className="flex justify-between items-center mb-4">
                                <h1 className="text-2xl font-bold text-blue-700">
                                    Monitoring chat: {selectedConversation.customer_username}
                                </h1>
                                {!joined && (
                                    <button
                                        onClick={handleJoinChat}
                                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                    >
                                        Join Chat
                                    </button>
                                )}
                            </div>

                            <ChatWindow messages={messages} typingUser={typingUser} />

                            {joined && (
                                <ChatInput
                                    onSend={sendMessage}
                                    onTyping={handleTyping}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="flex justify-center items-center h-full text-gray-500">
                            Select a conversation to monitor
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

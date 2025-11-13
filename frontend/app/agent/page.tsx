"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";
import { chatApi } from "@/services/api";

interface Message {
    timestamp?: string;
    sender: string;
    content?: string;
    type?: string;   // message | typing.start | typing.stop
    user?: string;
}

interface Conversation {
    id: string;
    customer_username: string;
    agent_username: string | null;
    status: "OPEN" | "ASSIGNED" | "CLOSED";
}

export default function AgentPage() {
    const router = useRouter();

    const [activeTab, setActiveTab] = useState("active");
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Refs for typing events
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isTypingRef = useRef(false);

    /** 🟦 Fetch agent's conversations */
    const fetchConversations = async () => {
        try {
            const data = await chatApi.getAgentConversations();
            setConversations(data);

            const assigned = data.find((c: Conversation) => c.status === "ASSIGNED");
            if (assigned && !selectedConversation) {
                setSelectedConversation(assigned);
            }
        } catch {
            router.push("/login");
        }
    };

    /** 🟩 Fetch messages for selected conversation */
    const fetchMessages = async (conversationId: string) => {
        try {
            const data = await chatApi.getMessages(conversationId);
            setMessages(data);
        } catch (err) {
            console.error("Failed to fetch messages:", err);
        }
    };

    /** 🧠 Load conversations once */
    useEffect(() => {
        fetchConversations();
    }, []);

    /** 💬 Setup WebSocket when conversation changes */
    useEffect(() => {
        if (!selectedConversation) return;

        // Close any previous socket
        if (socket) socket.close();

        fetchMessages(selectedConversation.id);

        const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
        const socketUrl = `${wsScheme}://localhost:8000/ws/chat/${selectedConversation.id}/`;
        const chatSocket = new WebSocket(socketUrl);

        chatSocket.onopen = () => {
            console.log("✅ WebSocket connected");
            setLoading(false);
        };

        chatSocket.onmessage = (e) => {
            const data = JSON.parse(e.data);

            // Handle typing events
            if (data.type === "typing.start") {
                setTypingUser(data.user);
            } else if (data.type === "typing.stop") {
                setTypingUser(null);
            } else if (data.type === "message" || data.content) {
                setMessages((prev) => [...prev, data]);
            }
        };

        chatSocket.onclose = () => console.log("❌ WebSocket disconnected");

        setSocket(chatSocket);
        return () => chatSocket.close();
    }, [selectedConversation]);

    /** ✉️ Send message */
    const sendMessage = (msg: string) => {
        if (!socket) return;
        const payload = { type: "message", message: msg };

        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(payload));
        } else {
            socket.addEventListener(
                "open",
                () => socket.send(JSON.stringify(payload)),
                { once: true }
            );
        }
    };

    /** ⌨️ Handle typing events */
    const handleTyping = (value: string) => {
        if (!socket) return;

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

    /** 🧩 Accept conversation */
    const handleAcceptConversation = async (convId: string) => {
        try {
            await chatApi.acceptConversation(convId);
            await fetchConversations();
            const updated = conversations.find((c) => c.id === convId);
            if (updated) setSelectedConversation(updated);
        } catch (err) {
            console.error(err);
        }
    };

    /** 🔴 Close conversation */
    const handleCloseConversation = async (convId: string) => {
        try {
            await chatApi.closeConversation(convId);
            await fetchConversations();
            setSelectedConversation(null);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <p className="text-center mt-10">Connecting...</p>;

    return (
        <div className="flex flex-col min-h-screen bg-blue-100">
            <Navbar />
            <div className="flex flex-1">
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    conversations={conversations}
                    selectedConversation={selectedConversation}
                    onSelectConversation={setSelectedConversation}
                    onAcceptConversation={handleAcceptConversation}
                />

                <main className="flex-1 p-4">
                    {activeTab === "active" && selectedConversation && (
                        <div className="flex flex-col h-[80vh]">
                            <div className="flex justify-between items-center mb-4">
                                <h1 className="text-3xl font-bold text-blue-700">
                                    Chat with {selectedConversation.customer_username}
                                </h1>
                                {selectedConversation.status === "ASSIGNED" && (
                                    <button
                                        onClick={() => handleCloseConversation(selectedConversation.id)}
                                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                                    >
                                        Close
                                    </button>
                                )}
                            </div>

                            <ChatWindow messages={messages} typingUser={typingUser} />

                            <ChatInput
                                onSend={sendMessage}
                                onTyping={handleTyping}
                            />
                        </div>
                    )}

                    {activeTab === "closed" && (
                        <div className="text-center text-blue-700 text-xl mt-10">
                            Closed chats will appear here
                        </div>
                    )}

                    {activeTab === "profile" && (
                        <div className="text-center text-blue-700 text-xl mt-10">
                            User profile settings
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

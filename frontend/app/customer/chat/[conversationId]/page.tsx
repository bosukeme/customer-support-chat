'use client'

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

import ChatWindow from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";
import Navbar from "@/components/Navbar";

import { chatApi } from "@/services/api";

interface Message {
    timestamp?: string;
    sender: string;
    content?: string;
    type?: string;   // For typing events
    user?: string;
}

export default function CustomerChatPage() {
    const { conversationId } = useParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [loading, setLoading] = useState(true);
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isTypingRef = useRef(false);

    const fetchMessages = async (conversationId: string) => {
        try {
            const data = await chatApi.getMessages(conversationId);
            setMessages(data);
        } catch (err) {
            console.error("Failed to fetch messages:", err);
        }
    };

    useEffect(() => {
        if (!conversationId) return;

        fetchMessages(conversationId as string);

        const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
        const socketUrl = `${wsScheme}://localhost:8000/ws/chat/${conversationId}/`;
        const chatSocket = new WebSocket(socketUrl);

        chatSocket.onopen = () => console.log("WebSocket connected");

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

        chatSocket.onclose = () => console.log("WebSocket disconnected");

        setSocket(chatSocket);
        setLoading(false);

        return () => chatSocket.close();
    }, [conversationId]);

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

    // Handle typing events
    const handleTyping = (value: string) => {
        if (!socket) return;

        // Send typing.start once
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            socket.send(JSON.stringify({ type: "typing.start" }));
        }

        // Reset typing.stop timer
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            socket.send(JSON.stringify({ type: "typing.stop" }));
        }, 2000);
    };

    if (loading) return <p className="text-center mt-10">Connecting...</p>;

    return (
        <div className="min-h-screen flex flex-col bg-blue-100">
            <Navbar />
            <main className="flex flex-col items-center justify-center flex-1 p-4">
                <div className="w-full max-w-2xl flex flex-col h-[80vh]">
                    <h1 className="text-3xl font-bold text-blue-700 text-center mb-4">
                        Chat Session
                    </h1>

                    <ChatWindow messages={messages} typingUser={typingUser} />

                    <ChatInput
                        onSend={sendMessage}
                        onTyping={handleTyping}
                    />
                </div>
            </main>
        </div>
    );
}

'use client'

import { useEffect, useState } from "react";
import ChatWindow from "../../components/ChatWindow";
import ChatInput from "../../components/ChatInput";
import Navbar from "../../components/Navbar";

interface Message {
    timestamp: string;
    sender: string;
    message: string;
}

export default function CustomerPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [loading, setLoading] = useState(true);

    const conversationId = "178774fa-6d82-4185-85c7-f5f18b30df36";

    useEffect(() => {

        const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
        const socketUrl = `${wsScheme}://localhost:8000/ws/chat/${conversationId}/`;

        const chatSocket = new WebSocket(socketUrl);
        console.log(chatSocket);


        chatSocket.onopen = () => console.log("WebSocket connected");


        chatSocket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            console.log(data);

            setMessages((prev) => [...prev, data]);
        };

        chatSocket.onclose = () => console.log("WebSocket disconnected");

        setSocket(chatSocket);
        setLoading(false);

        return () => chatSocket.close();
    }, [conversationId]);

    const sendMessage = (msg: string) => {
        if (!socket) return;

        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ message: msg }));
        } else {
            console.log("Socket not open yet. Queuing message...");
            socket.addEventListener("open", () => {
                socket.send(JSON.stringify({ message: msg }));
            }, { once: true });
        }
    };

    if (loading) return <p className="text-center mt-10">Connecting...</p>;

    return (
        <div className="min-h-screen flex flex-col bg-blue-100">
            <Navbar />
            <main className="flex flex-col items-center justify-center flex-1 p-4">
                <div className="w-full max-w-2xl flex flex-col h-[80vh]">
                    <h1 className="text-3xl font-bold text-blue-700 text-center mb-4">
                        Customer Chat
                    </h1>
                    <ChatWindow messages={messages} />
                    <ChatInput onSend={sendMessage} />
                </div>
            </main>
        </div>
    );
}

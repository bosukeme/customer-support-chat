'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, chatApi } from "@/services/api"; // axios instance with credentials
import Navbar from "@/components/Navbar";

interface Conversation {
    id: string;
    status: string;
    agent?: string | null;
    created_at: string;
}

export default function CustomerHomePage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchConversations = async () => {
        try {
            const data = await chatApi.getConversations()
            setConversations(data);
        } catch (err) {
            console.error("Error fetching conversations:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    const handleStartConversation = async () => {
        try {
            const res = await api.post("/api/chat/conversations/", {});
            router.push(`/customer/chat/${res.data.id}`);
        } catch (err) {
            console.error("Error creating conversation:", err);
        }
    };

    if (loading) return <p className="text-center mt-10">Loading conversations...</p>;

    return (
        <div className="min-h-screen flex flex-col bg-blue-100">
            <Navbar />

            <main className="flex flex-col items-center flex-1 p-6">
                <h1 className="text-3xl font-bold text-blue-700 mb-6">
                    Your Conversations
                </h1>

                <button
                    onClick={handleStartConversation}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 mb-6"
                >
                    Start New Conversation
                </button>

                <div className="w-full max-w-2xl bg-white rounded-xl shadow p-4">
                    {conversations.length === 0 ? (
                        <p className="text-gray-500 text-center">No conversations yet.</p>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {conversations.map((conv) => (
                                <li
                                    key={conv.id}
                                    className="p-3 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                                    onClick={() => router.push(`/customer/chat/${conv.id}`)}
                                >
                                    <div>
                                        <p className="font-medium text-gray-800">
                                            Conversation ID: {conv.id.slice(0, 8)}...
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Status: {conv.status}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {new Date(conv.created_at).toLocaleString()}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </main>
        </div>
    );
}

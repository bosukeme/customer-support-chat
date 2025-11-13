'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { chatApi } from "@/services/api";
import Navbar from "@/components/Navbar";


export default function CustomerHomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStartConversation = async () => {
    setLoading(true);
    setError("");
    try {
      const conversationId = chatApi.startConversation
      router.push(`/customer/chat/${conversationId}`);
    } catch (err: any) {
      console.error(err);
      setError("Failed to start conversation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-blue-100">
      
      <Navbar />
      <main className="flex flex-col items-center justify-center flex-1 p-4">
        <div className="w-full max-w-2xl flex flex-col h-[80vh]">

          <h1 className="text-4xl font-bold text-blue-700 mb-8">
            Welcome to Customer Support
          </h1>

          <button
            onClick={handleStartConversation}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600  transition-colors"
          >
            {loading ? "Starting..." : "Start Conversation"}
          </button>
          {error && <p className="text-red-500 mt-4">{error}</p>}

        </div>
      </main>

    </div>
  );
}

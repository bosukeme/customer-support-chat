"use client";

import { useEffect, useRef } from "react";

interface Message {
    timestamp?: string;
    sender: string;
    content?: string;
    type?: string;   // For typing events
    user?: string;
}

interface ChatWindowProps {
    messages: Message[];
    typingUser?: string | null;
}

export default function ChatWindow({ messages, typingUser }: ChatWindowProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typingUser]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-blue-50 rounded-lg border border-blue-200">
            {messages.map((msg, index) => (
                <div key={index} className="flex flex-col">
                    <span className="text-sm text-gray-500">{msg.sender}</span>
                    <div className="bg-white p-2 rounded shadow-sm max-w-xs break-words">
                        {msg.content}
                    </div>
                </div>
            ))}

            {typingUser && (
                <div className="text-sm italic text-gray-500 px-4 py-1">
                    {typingUser} is typing...
                </div>
            )}

            <div ref={bottomRef}></div>
        </div>
    );
}

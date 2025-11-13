"use client";

import { useState } from "react";

interface ChatInputProps {
    onSend: (content: string) => void;
    onTyping?: (value: string) => void;
}

export default function ChatInput({ onSend, onTyping }: ChatInputProps) {
    const [input, setInput] = useState("");

    const handleSend = () => {
        if (!input.trim()) return;
        onSend(input.trim());
        setInput("");
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setInput(value);
        onTyping?.(value); // Notify typing
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex items-center space-x-2 mt-3">
            <textarea
                value={input}
                onChange={handleChange}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 border border-blue-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                rows={2}
            />
            <button
                onClick={handleSend}
                className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-semibold transition-all"
            >
                Send
            </button>
        </div>
    );
}

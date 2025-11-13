"use client";

interface Conversation {
    id: string;
    customer_username: string;
    agent_username: string | null;
    status: "OPEN" | "ASSIGNED" | "CLOSED";
}

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    conversations: Conversation[];
    selectedConversation: Conversation | null;
    onSelectConversation: (conv: Conversation) => void;
    onAcceptConversation?: (convId: string) => void;
}

export default function Sidebar({
    activeTab,
    setActiveTab,
    conversations,
    selectedConversation,
    onSelectConversation,
    onAcceptConversation
}: SidebarProps) {
    return (
        <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
            <h2 className="text-xl font-bold mb-4">Active Chats</h2>

            <ul className="flex-1 overflow-y-auto">
                {conversations.map((conv) => (
                    <li
                        key={conv.id}
                        className={`p-2 mb-2 rounded cursor-pointer ${selectedConversation?.id === conv.id ? "bg-blue-200" : "hover:bg-gray-100"
                            }`}
                        onClick={() => onSelectConversation(conv)}
                    >
                        <div className="flex justify-between items-center">
                            <span>{conv.customer_username}</span>
                            {conv.status === "OPEN" && onAcceptConversation && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // prevent selecting
                                        onAcceptConversation(conv.id);
                                    }}
                                    className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                                >
                                    Accept
                                </button>
                            )}
                        </div>
                        <div className="text-xs text-gray-500">{conv.status}</div>
                    </li>
                ))}
            </ul>
        </aside>
    );
}

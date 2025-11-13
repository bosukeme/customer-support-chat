'use client';

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import Cookies from "js-cookie";

export default function Navbar() {
    const router = useRouter();
    const { username, role, refreshAuth, isAuthenticated } = useAuth();

    const handleLogout = async () => {
        try {
            await api.post("/api/accounts/logout/");
        } catch (err) {
            console.error("Logout failed:", err);
        } finally {
            Cookies.remove("username");
            Cookies.remove("role");
            refreshAuth(); // 👈 immediately updates navbar
            router.push("/login");
        }
    };

    return (
        <nav className="bg-blue-500 text-white px-6 py-3 flex items-center justify-between shadow-md">
            <div
                className="text-xl font-semibold cursor-pointer"
                onClick={() => router.push("/")}
            >
                Support<span className="font-light">Chat</span>
            </div>

            <div className="flex items-center space-x-4">
                <span className="text-sm bg-blue-600 px-3 py-1 rounded-full">
                    {role || "GUEST"}
                </span>
                <span className="text-sm">{username || "Guest"}</span>
                <button
                    onClick={handleLogout}
                    disabled={!isAuthenticated}
                    className={`font-semibold px-3 py-1 rounded transition ${isAuthenticated
                            ? "bg-white text-blue-500 hover:bg-blue-100"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}

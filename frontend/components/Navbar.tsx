'use client'

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { api } from "@/services/api";

export default function Navbar() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cookieUsername = Cookies.get("username");
        const cookieRole = Cookies.get("role");

        if (!cookieUsername || !cookieRole) {
            router.push("/login");
            return;
        }

        setUsername(cookieUsername);
        setRole(cookieRole);
        setLoading(false);
    }, [router]);

    const handleLogout = async () => {
        try {
            await api.post("/api/accounts/logout/");
        } catch (err) {
            console.error("Logout failed:", err);
        } finally {
            Cookies.remove("username");
            Cookies.remove("role");
            router.push("/login");
        }
    };

    if (loading) return null;

    return (
        <nav className="bg-blue-500 text-white px-6 py-3 flex items-center justify-between shadow-md">
            <div className="text-xl font-semibold cursor-pointer" onClick={() => router.push("/")}>
                Support<span className="font-light">Chat</span>
            </div>

            <div className="flex items-center space-x-4">
                <span className="text-sm bg-blue-600 px-3 py-1 rounded-full">{role || "USER"}</span>
                <span className="text-sm">{username || "User"}</span>
                <button
                    onClick={handleLogout}
                    className="bg-white text-blue-500 font-semibold px-3 py-1 rounded hover:bg-blue-100 transition"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}

'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { api } from "@/services/api";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const response = await api.post("/api/accounts/login/",
                { username, password },
                {
                    withCredentials: true,
                    
                }
            );
            const { user } = response.data;
            console.log(user);
            console.log(user.role);
            

            // Save username & role for UI
            Cookies.set("username", user.username, { sameSite: "Lax" });
            Cookies.set("role", user.role, { sameSite: "Lax" });

            // Redirect based on role
            if (user.role === "CUSTOMER") router.push("/");
            else if (user.role === "AGENT") router.push("/agent");
            else if (user.role === "SUPERVISOR") router.push("/supervisor");
            else router.push("/");

        } catch {
            setError("Invalid username or password");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-100 via-white to-blue-200">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">Login</h1>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                    />
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white font-semibold p-3 rounded-lg hover:bg-blue-600 transition-all duration-200"
                    >
                        Login
                    </button>
                </form>
                {error && <p className="text-red-500 mt-3 text-center">{error}</p>}
                <p className="text-sm text-gray-500 mt-4 text-center">
                    Don't have an account?{" "}
                    <button
                        onClick={() => router.push("/register")}
                        className="text-blue-500 hover:underline font-medium"
                    >
                        Register
                    </button>
                </p>
            </div>
        </div>
    );
}

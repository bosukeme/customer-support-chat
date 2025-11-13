"use client";

import { useState } from "react";
import { api } from "../../services/api";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("CUSTOMER");
    const [error, setError] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            await api.post("/api/accounts/register/", { username, email, password, role });
            router.push("/login");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Registration failed");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-100 via-white to-blue-200">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">Create Account</h1>
                <form onSubmit={handleRegister} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="CUSTOMER">Customer</option>
                        <option value="AGENT">Agent</option>
                        <option value="SUPERVISOR">Supervisor</option>
                    </select>
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white font-semibold p-3 rounded-lg hover:bg-blue-600 transition-all duration-200"
                    >
                        Register
                    </button>
                </form>
                {error && <p className="text-red-500 mt-3 text-center">{error}</p>}
                <p className="text-sm text-gray-500 mt-4 text-center">
                    Already have an account?{" "}
                    <button
                        onClick={() => router.push("/login")}
                        className="text-blue-500 hover:underline font-medium"
                    >
                        Login
                    </button>
                </p>
            </div>
        </div>
    );
}

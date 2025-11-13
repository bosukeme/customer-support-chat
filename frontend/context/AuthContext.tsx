'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';

interface AuthContextType {
    username: string | null;
    role: string | null;
    refreshAuth: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
    username: null,
    role: null,
    refreshAuth: () => { },
    isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [username, setUsername] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);

    const refreshAuth = () => {
        const cookieUsername = Cookies.get('username') || null;
        const cookieRole = Cookies.get('role') || null;
        setUsername(cookieUsername);
        setRole(cookieRole);
    };

    useEffect(() => {
        refreshAuth(); // Load from cookies when the app starts
    }, []);

    const isAuthenticated = !!username && !!role;

    return (
        <AuthContext.Provider value={{ username, role, refreshAuth, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

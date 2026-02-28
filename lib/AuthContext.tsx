"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

interface UserProfile {
    _id: string;
    name: string;
    email: string;
    language: "en" | "hi";
}

interface AuthContextType {
    user: UserProfile | null;
    token: string | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (name: string, email: string, password: string, language: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Restore session on mount
    useEffect(() => {
        const savedToken = localStorage.getItem("kisandb_token");
        if (savedToken) {
            setToken(savedToken);
            axios.get("/api/auth/me", {
                headers: { Authorization: `Bearer ${savedToken}` }
            })
                .then(res => {
                    setUser(res.data.user);
                })
                .catch(() => {
                    localStorage.removeItem("kisandb_token");
                    setToken(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const res = await axios.post("/api/auth/login", { email, password });
            const { token: newToken, user: newUser } = res.data;
            localStorage.setItem("kisandb_token", newToken);
            setToken(newToken);
            setUser(newUser);
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.response?.data?.error || "Login failed" };
        }
    };

    const signup = async (name: string, email: string, password: string, language: string) => {
        try {
            const res = await axios.post("/api/auth/signup", { name, email, password, language });
            const { token: newToken, user: newUser } = res.data;
            localStorage.setItem("kisandb_token", newToken);
            setToken(newToken);
            setUser(newUser);
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.response?.data?.error || "Signup failed" };
        }
    };

    const logout = () => {
        localStorage.removeItem("kisandb_token");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            isAuthenticated: !!user,
            login,
            signup,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

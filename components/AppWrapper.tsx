"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import SplashScreen from "./SplashScreen";
import { useAuth } from "@/lib/AuthContext";
import { usePathname } from "next/navigation";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
    const [showSplash, setShowSplash] = useState(true);
    const { isAuthenticated, loading } = useAuth();
    const pathname = usePathname();

    const handleStart = () => {
        setShowSplash(false);
    };

    // Auth pages (signup/login) should bypass the auth check
    const isAuthPage = pathname === "/signup" || pathname === "/login";

    // Show splash first
    if (showSplash) {
        return (
            <AnimatePresence mode="wait">
                <SplashScreen key="splash" onStart={handleStart} />
            </AnimatePresence>
        );
    }

    // Show loading while checking auth
    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-[#14532D] border-t-transparent rounded-full" />
            </div>
        );
    }

    // If on auth page, show the page (no header/nav needed)
    if (isAuthPage) {
        return <>{children}</>;
    }

    // If not authenticated and not on auth page, show children (the layout will redirect)
    // We handle this by redirecting in the page components themselves
    if (!isAuthenticated && !isAuthPage) {
        // Redirect to signup
        if (typeof window !== "undefined") {
            window.location.href = "/signup";
        }
        return (
            <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-[#14532D] border-t-transparent rounded-full" />
            </div>
        );
    }

    // Authenticated — show normal app
    return <>{children}</>;
}

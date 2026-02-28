"use client";

import { Bell, Search, User, LogOut } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import AlertBell from "@/components/AlertBell";

export default function Header() {
    const { language, setLanguage, t } = useLanguage();
    const { user, logout } = useAuth();

    return (
        <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50 flex items-center justify-between px-6 md:px-12 shadow-sm transition-all">
            {/* Brand */}
            <div className="flex items-center gap-2 min-w-fit">
                <span className="text-2xl">🌾</span>
                <span className="font-extrabold text-[#14532D] text-2xl tracking-tight hidden md:block">KisanDB</span>
            </div>

            {/* Search Bar - Premium Rounded */}
            <div className="flex-1 max-w-xl mx-8 relative hidden lg:block">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={20} />
                </div>
                <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    className="w-full bg-[#F8FAFC] border border-gray-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#14532D]/5 focus:border-[#14532D] transition-all placeholder:text-gray-400"
                />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6">
                {/* Modern Pill Language Toggle */}
                <div className="bg-gray-100 p-1 rounded-xl flex items-center">
                    <button
                        onClick={() => setLanguage("en")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'en' ? 'bg-white text-[#14532D] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        EN
                    </button>
                    <button
                        onClick={() => setLanguage("hi")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'hi' ? 'bg-white text-[#14532D] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        हिंदी
                    </button>
                </div>

                <AlertBell farmerId={user?._id || ""} />

                <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-bold text-gray-900 leading-tight">
                            {user?.name || "Farmer"}
                        </div>
                        <div className="text-[10px] text-[#22C55E] font-extrabold uppercase tracking-widest leading-none mt-1">
                            <span className="bg-[#22C55E]/10 px-1.5 py-0.5 rounded-md">{t.premiumFarmer}</span>
                        </div>
                    </div>
                    <div className="w-11 h-11 bg-[#14532D]/10 rounded-2xl flex items-center justify-center text-[#14532D] border border-[#14532D]/10 hover:bg-[#14532D]/20 transition-colors cursor-pointer">
                        <User size={22} strokeWidth={2.5} />
                    </div>
                    <button
                        onClick={logout}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
}

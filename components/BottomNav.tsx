"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Mic, Package, BarChart3, Sun, LayoutGrid } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useLanguage } from "@/lib/LanguageContext";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function BottomNav() {
    const pathname = usePathname();
    const { language } = useLanguage();

    const navItems = [
        { href: "/", label: language === "en" ? "Dashboard" : "डैशबोर्ड", icon: Home },
        { href: "/query", label: language === "en" ? "Ask AI" : "सवाल", icon: Mic },
        { href: "/weather", label: language === "en" ? "Weather" : "मौसम", icon: Sun },
        { href: "/inventory", label: language === "en" ? "Stock" : "स्टॉक", icon: Package },
        { href: "/sales", label: language === "en" ? "Sales" : "बिक्री", icon: BarChart3 },
        { href: "/features", label: language === "en" ? "More" : "और", icon: LayoutGrid },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-primary text-white p-3 pb-6 rounded-t-3xl shadow-2xl flex justify-around items-center z-50">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center gap-1 transition-all",
                            isActive ? "text-accent scale-110" : "text-white/60"
                        )}
                    >
                        <Icon size={24} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

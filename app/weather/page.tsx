"use client";

import { useState } from "react";
import {
    Cloud,
    Sun,
    CloudRain,
    Snowflake,
    Calendar,
    TrendingUp,
    MessageSquare,
    ArrowLeft,
    User,
    Info,
    X,
    AlertTriangle
} from "lucide-react";
import Link from "next/link";
import WeatherFarm3D from "@/components/WeatherFarm3D";
import { useWeatherData } from "@/hooks/useWeatherData";

// ── DATA ──────────────────────────────────────────
const SEASONS = {
    kharif: {
        name: "Kharif (Jun–Oct)",
        hindi: "खरीफ",
        emoji: "🌧️",
        weather: "rain",
        crops: ["Rice", "Maize", "Cotton"],
        advice: "Kharif mausam mein baarish zyada hogi. Dhan aur Makka ki bowaai ke liye yeh sabse accha waqt hai! 🌾",
        tags: ["High Rainfall", "Sowing Season", "Drainage Prep"]
    },
    rabi: {
        name: "Rabi (Nov–Mar)",
        hindi: "रबी",
        emoji: "❄️",
        weather: "sunny",
        crops: ["Wheat", "Mustard", "Gram"],
        advice: "Rabi mausam mein thand badhegi. Gehu aur Sarson ke liye thandi hawa acchi hai. Sinchai ka dhyan rakhein. ❄️",
        tags: ["Winter Crops", "Irrigation", "Gold Crop"]
    },
    zaid: {
        name: "Zaid (Mar–Jun)",
        hindi: "जायद",
        emoji: "☀️",
        weather: "sunny",
        crops: ["Watermelon", "Cucumber", "Vegetables"],
        advice: "Garmi mausam mein sinchai ki zyada zaroorat hogi. Dopahar mein paani na dein, sirf subah ya shaam. ☀️",
        tags: ["Summer Crops", "High Water", "Vegetables"]
    },
    winter: {
        name: "Sardi (Winter)",
        hindi: "सर्दी",
        emoji: "🌨️",
        weather: "snow",
        crops: ["Wheat", "Peas", "Carrots"],
        advice: "Sardi mein pala padne ka khatra ho sakta hai. Gehu ki fasal ko thandi hawa se bachana zaroori hai. 🏔️",
        tags: ["Frost Care", "Winter Wheat", "Root Crops"]
    }
};

const MONTHS = [
    { name: "Jan", emoji: "❄️", crop: "Wheat", season: "winter" },
    { name: "Feb", emoji: "🌱", crop: "Mustard", season: "rabi" },
    { name: "Mar", emoji: "☀️", crop: "Vegetables", season: "zaid" },
    { name: "Apr", emoji: "🍉", crop: "Watermelon", season: "zaid" },
    { name: "May", emoji: "🌽", crop: "Maize", season: "zaid" },
    { name: "Jun", emoji: "🌧️", crop: "Rice", season: "kharif" },
    { name: "Jul", emoji: "🌾", crop: "Cotton", season: "kharif" },
    { name: "Aug", emoji: "🍃", crop: "Bajara", season: "kharif" },
    { name: "Sep", emoji: "🚜", crop: "Moong", season: "kharif" },
    { name: "Oct", emoji: "🍂", crop: "Til", season: "kharif" },
    { name: "Nov", emoji: "🌨️", crop: "Gram", season: "rabi" },
    { name: "Dec", emoji: "❄️", crop: "Peas", season: "winter" }
];

export default function WeatherAdvisorPage() {
    const [season, setSeason] = useState<any>('kharif');
    const [weather, setWeather] = useState<any>('rain');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const { advisories, current, loading, error } = useWeatherData(
        "Lucknow",
        ["Gehu", "Sarson"],
        season
    );

    const selectedSeasonData = SEASONS[season as keyof typeof SEASONS];
    const dangerAlerts = advisories.filter((a: any) => a.type === 'danger');

    return (
        <div className="min-h-screen bg-[#F5F0E8] text-[#1A3C2E] font-poppins pb-32">
            {/* ── HEADER ─────────────────────────────── */}
            <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-[#1A3C2E]/10 rounded-xl transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black tracking-tight leading-none text-[#1A3C2E]">Mausam Advisor</h1>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mt-1">3D Crop Simulation</p>
                    </div>
                </div>

                {/* 🤖 Advisory Button & Profile Section */}
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setIsDrawerOpen(true)}
                        className="relative bg-[#1A3C2E] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#1A3C2E]/90 transition-all active:scale-95 shadow-lg shadow-[#1A3C2E]/20"
                    >
                        <span>🤖 Advisory</span>
                        {dangerAlerts.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-[#FF4444] text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white animate-pulse">
                                {dangerAlerts.length}
                            </span>
                        )}
                    </button>

                    <div className="flex items-center gap-3 bg-[#1A3C2E]/5 px-4 py-2 rounded-2xl border border-[#1A3C2E]/10">
                        <div className="text-right">
                            <p className="text-xs font-bold leading-none">Nilesh Sahoo</p>
                            <p className="text-[9px] font-extrabold text-[#22C55E] uppercase tracking-tighter mt-1">Premium Farmer</p>
                        </div>
                        <div className="w-10 h-10 bg-[#1A3C2E] rounded-xl flex items-center justify-center text-white shadow-lg">
                            <User size={20} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>
            </header>

            {/* ── DRAWER OVERLAY ─────────────────────────── */}
            {isDrawerOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300"
                    onClick={() => setIsDrawerOpen(false)}
                />
            )}

            {/* ── ADVISORY DRAWER ────────────────────────── */}
            <div className={`fixed top-0 right-0 h-full w-full md:w-[450px] bg-[#F5F0E8] z-[101] shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 border-b border-gray-200 bg-white/50 backdrop-blur flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-[#1A3C2E] flex items-center gap-2">
                            <span className="text-2xl">🤖</span> AI Mausam Salah
                        </h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Weather Advisory</p>
                    </div>
                    <button
                        onClick={() => setIsDrawerOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-900"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    <AdvisorySection advisories={advisories} loading={loading} error={error} />
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 pt-24 space-y-8">

                {/* ── SEASON TABS ─────────────────────────── */}
                <section className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {Object.entries(SEASONS).map(([key, data]) => (
                        <button
                            key={key}
                            onClick={() => { setSeason(key); setWeather(data.weather); }}
                            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all whitespace-nowrap border-2 shadow-sm ${season === key
                                ? "bg-[#1A3C2E] text-white border-[#1A3C2E] scale-105 shadow-[#1A3C2E]/20"
                                : "bg-white text-gray-400 border-gray-100 hover:border-[#1A3C2E]/20"
                                }`}
                        >
                            <span>{data.emoji}</span>
                            <span>{data.name}</span>
                        </button>
                    ))}
                </section>

                {/* ── 3D FARM CANVAS ──────────────────────── */}
                <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3 space-y-6">
                        <div className="relative h-[550px] bg-white rounded-3xl p-2 shadow-2xl shadow-[#1A3C2E]/10 border border-white">
                            <WeatherFarm3D season={season} weather={weather} />

                            {/* Overlay Badges */}
                            <div className="absolute top-8 left-8 space-y-4">
                                <div className="bg-white/90 backdrop-blur shadow-xl border border-[#1A3C2E]/10 rounded-2xl p-5 flex items-center gap-4 animate-in fade-in slide-in-from-left duration-700">
                                    <div className="w-14 h-14 bg-[#1A3C2E]/5 rounded-xl flex items-center justify-center text-4xl">
                                        {weather === 'rain' ? '🌧️' : weather === 'sunny' ? '☀️' : weather === 'cloudy' ? '⛅' : '❄️'}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black leading-none">{current?.main?.temp ? Math.round(current.main.temp) : 24}°C</h2>
                                        <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{selectedSeasonData.hindi} Season</p>
                                    </div>
                                </div>
                            </div>

                            {/* Weather Selection Overlay */}
                            <div className="absolute bottom-8 right-8 flex gap-3">
                                <WeatherBtn active={weather === 'rain'} icon={<CloudRain size={20} />} label="Rain" onClick={() => setWeather('rain')} />
                                <WeatherBtn active={weather === 'sunny'} icon={<Sun size={20} />} label="Sunny" onClick={() => setWeather('sunny')} />
                                <WeatherBtn active={weather === 'cloudy'} icon={<Cloud size={20} />} label="Cloudy" onClick={() => setWeather('cloudy')} />
                                <WeatherBtn active={weather === 'snow'} icon={<Snowflake size={20} />} label="Snow" onClick={() => setWeather('snow')} />
                            </div>

                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md text-white/90 text-[10px] font-bold px-6 py-2 rounded-full tracking-widest uppercase border border-white/20">
                                Rotate → Click & Drag | Zoom → Scroll
                            </div>
                        </div>

                        {/* AI Advisory Section (Inline) */}
                        <AdvisorySection advisories={advisories} loading={loading} error={error} />

                        {/* AI Advice Box */}
                        <div className="bg-[#1A3C2E] rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-1000" />
                            <div className="relative z-10 flex items-start gap-6">
                                <div className="bg-accent/20 p-4 rounded-2xl">
                                    <MessageSquare size={32} className="text-[#D4A017]" />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black uppercase tracking-[0.3em] text-[#D4A017]">AI Advisor</span>
                                        <div className="h-[1px] flex-1 bg-white/10" />
                                    </div>
                                    <p className="text-2xl font-bold leading-relaxed">
                                        {selectedSeasonData.advice}
                                    </p>
                                    <div className="flex gap-3">
                                        {selectedSeasonData.tags.map(tag => (
                                            <span key={tag} className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full border border-white/5">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT PANEL: CALENDAR & FORECAST ── */}
                    <div className="space-y-8">

                        {/* Forecast Panel */}
                        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-50 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-black text-sm uppercase tracking-widest text-[#1A3C2E] flex items-center gap-3">
                                    <TrendingUp size={18} /> 7-Day Forecast
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                    <div key={i} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                                        <span className="text-xs font-bold text-gray-400">Day {i}</span>
                                        <Sun size={16} className={`${i === 3 ? 'text-[#D4A017]' : 'text-gray-200'}`} />
                                        <div className="w-24 h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#1A3C2E]/40" style={{ width: `${Math.random() * 60 + 20}%` }} />
                                        </div>
                                        <span className="text-xs font-black">{24 + i}°C</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Month Calendar Grid */}
                        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-50 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-black text-sm uppercase tracking-widest text-[#1A3C2E] flex items-center gap-3">
                                    <Calendar size={18} /> Crop Calendar
                                </h3>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {MONTHS.map(m => (
                                    <button
                                        key={m.name}
                                        onClick={() => { setSeason(m.season); setWeather(SEASONS[m.season as keyof typeof SEASONS].weather); }}
                                        className={`p-3 rounded-2xl border transition-all text-center flex flex-col items-center gap-1 group ${season === m.season
                                            ? 'bg-[#1A3C2E]/5 border-[#1A3C2E]/20'
                                            : 'bg-gray-50 border-transparent hover:border-gray-200'
                                            }`}
                                    >
                                        <span className={`text-[9px] font-black uppercase tracking-tighter ${season === m.season ? 'text-[#1A3C2E]' : 'text-gray-400'}`}>
                                            {m.name}
                                        </span>
                                        <span className="text-xl group-hover:scale-125 transition-transform">{m.emoji}</span>
                                        <span className="text-[8px] font-bold text-gray-400 leading-none">{m.crop}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quick Info */}
                        <div className="bg-[#D4A017]/10 rounded-3xl p-6 border border-[#D4A017]/20 flex items-start gap-4">
                            <div className="bg-[#D4A017] p-2 rounded-xl text-white">
                                <Info size={16} />
                            </div>
                            <div className="text-[11px] font-bold leading-relaxed text-[#1A3C2E]/70 underline decoration-[#D4A017]/30 underline-offset-4">
                                Did you know? Rotating crops helps maintain soil health and increases yield by 15-20%.
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function WeatherBtn({ active, icon, label, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`px-5 py-3 rounded-2xl flex items-center gap-3 font-bold transition-all shadow-xl active:scale-95 ${active
                ? "bg-[#1A3C2E] text-white shadow-[#1A3C2E]/20"
                : "bg-white/80 backdrop-blur-md text-[#1A3C2E] hover:bg-white"
                }`}
        >
            {icon}
            <span className="text-xs uppercase tracking-widest">{label}</span>
        </button>
    );
}

// ── ADVISORY COMPONENTS ──────────────────────────

const ALERT_COLORS = {
    danger: {
        bg: "#FFF0F0", border: "#FF4444",
        badge: "#FF4444", badgeText: "Khatre Ki Baat"
    },
    warning: {
        bg: "#FFFBEB", border: "#F59E0B",
        badge: "#F59E0B", badgeText: "Dhyan Dein"
    },
    good: {
        bg: "#F0FFF4", border: "#22C55E",
        badge: "#22C55E", badgeText: "Acchi Khabar"
    },
};

function AdvisorySection({ advisories, loading, error }: any) {
    const [lang, setLang] = useState<"en" | "hi">("hi");

    if (loading) return (
        <div className="text-center py-12 text-[#1A3C2E] font-bold animate-pulse">
            🔄 Advisory load ho rahi hai...
        </div>
    );

    if (error) return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-600 font-bold flex items-center gap-4">
            <AlertTriangle /> {error}
        </div>
    );

    const dangerousAlerts = advisories.filter((a: any) => a.type === "danger");

    return (
        <div className="space-y-6">
            {/* Language Toggle */}
            <div className="flex justify-end">
                <div className="flex gap-1 bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                    {(["hi", "en"] as const).map(l => (
                        <button
                            key={l}
                            onClick={() => setLang(l)}
                            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${lang === l ? "bg-[#1A3C2E] text-white" : "text-gray-400 hover:text-gray-900"
                                }`}
                        >
                            {l === "hi" ? "हिं" : "EN"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Critical Banner */}
            {dangerousAlerts.length > 0 && (
                <div className="bg-[#FF4444] text-white rounded-[2rem] p-6 shadow-2xl shadow-red-200 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-110 transition-transform" />
                    <div className="flex gap-5 items-center relative z-10">
                        <div className="text-4xl animate-bounce">🚨</div>
                        <div>
                            <h4 className="font-black text-lg leading-tight">
                                {lang === "hi" ? "Khatre Ki Chetavni!" : "Critical Alert!"}
                            </h4>
                            <p className="text-xs opacity-90 mt-1 font-bold">
                                {lang === "hi"
                                    ? "Bhari baarish ya pala ka khatra hai. Savdhan rahein."
                                    : "Extreme weather predicted. Action required."}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Advisory Cards */}
            <div className="space-y-4">
                {advisories.map((alert: any, i: number) => {
                    const style = ALERT_COLORS[alert.type as keyof typeof ALERT_COLORS];
                    return (
                        <div key={i} className="bg-white rounded-3xl p-6 border-2 shadow-sm transition-all hover:shadow-md" style={{ borderColor: style.border, backgroundColor: style.bg }}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-4 items-center">
                                    <span className="text-4xl">{alert.emoji}</span>
                                    <div>
                                        <h5 className="font-black text-[#1A3C2E] leading-tight">
                                            {lang === "hi" ? alert.title_hi : alert.title_en}
                                        </h5>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">
                                            🌾 {alert.crop}
                                        </p>
                                    </div>
                                </div>
                                <span className="bg-[#1A3C2E] text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap" style={{ backgroundColor: style.badge }}>
                                    {style.badgeText}
                                </span>
                            </div>

                            <p className="text-sm font-medium text-gray-700 leading-relaxed mb-5">
                                {lang === "hi" ? alert.message_hi : alert.message_en}
                            </p>

                            <div className="bg-white/60 rounded-2xl p-4 border border-black/5 flex items-start gap-3">
                                <span className="text-xl">💡</span>
                                <p className="text-xs font-bold text-[#1A3C2E] leading-relaxed">
                                    {lang === "hi" ? alert.action_hi : alert.action_en}
                                </p>
                            </div>
                        </div>
                    );
                })}

                {advisories.length === 0 && (
                    <div className="text-center py-20 bg-white/50 rounded-[3rem] border-2 border-dashed border-gray-200">
                        <span className="text-5xl block mb-4">✅</span>
                        <p className="font-black text-gray-400 uppercase tracking-widest">No Alerts Today</p>
                        <p className="text-xs font-bold text-gray-400 italic mt-1">Mausam bilkul sahi hai!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

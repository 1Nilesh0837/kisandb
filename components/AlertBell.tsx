"use client";
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const STYLES = {
    urgent: {
        bg: "#FFF0F0", border: "#FF4444",
        badge: "#FF4444", icon: "🚨",
        label: "Urgent"
    },
    warning: {
        bg: "#FFFBEB", border: "#F59E0B",
        badge: "#F59E0B", icon: "⚠️",
        label: "Warning"
    },
    info: {
        bg: "#F0FFF4", border: "#22C55E",
        badge: "#1A3C2E", icon: "✅",
        label: "Info"
    },
};

export default function AlertBell({
    farmerId
}: {
    farmerId: string
}) {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    const unread = alerts.filter(a => !a.isRead).length;

    useEffect(() => {
        if (!token || !farmerId) return;
        runCheck();
        // Re-check every 30 minutes
        const t = setInterval(runCheck, 1800000);
        return () => clearInterval(t);
    }, [farmerId, token]);

    async function runCheck() {
        if (!token) return;
        setLoading(true);
        try {
            // Real-time check
            await fetch("/api/alerts/check", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ farmerId }),
            });
            // Fetch results
            const res = await fetch(`/api/alerts?farmerId=${farmerId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            setAlerts(data.alerts || []);
        } catch (e) {
            console.error("Alert fetch failed", e);
        } finally {
            setLoading(false);
        }
    }

    async function handleRead(alertId: string) {
        if (!token) return;
        try {
            await fetch("/api/alerts", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ alertId }),
            });
            setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
        } catch (e) {
            console.error("Mark read failed", e);
        }
    }

    return (
        <>
            <style>{`
        @keyframes bellShake {
          0%,100%{transform:rotate(0)}
          20%{transform:rotate(-15deg)}
          40%{transform:rotate(15deg)}
          60%{transform:rotate(-10deg)}
          80%{transform:rotate(10deg)}
        }
        @keyframes badgePulse {
          0%,100%{transform:scale(1)}
          50%{transform:scale(1.25)}
        }
        .bell-item-hover:hover {
          transform: translateX(3px);
          background-color: rgba(0,0,0,0.02) !important;
        }
      `}</style>

            <div className="relative">
                {/* Bell Button - Styled to match existing Header.tsx bell exactly */}
                <button
                    onClick={() => setOpen(!open)}
                    className={`p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-all relative ${open ? "bg-gray-100" : ""}`}
                    style={{
                        animation: unread > 0 ? "bellShake 3s ease infinite" : "none",
                    }}
                >
                    <Bell size={22} />
                    {unread > 0 && (
                        <span
                            className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#FF4444] rounded-full border-2 border-white"
                            style={{ animation: "badgePulse 2s infinite" }}
                        />
                    )}
                </button>

                {/* Dropdown Panel */}
                {open && (
                    <>
                        {/* Click-away overlay */}
                        <div
                            className="fixed inset-0 z-[998]"
                            onClick={() => setOpen(false)}
                        />

                        {/* Alert Panel */}
                        <div className="absolute top-14 right-0 w-80 md:w-[360px] bg-white rounded-3xl shadow-2xl z-[999] overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">

                            {/* Header */}
                            <div className="bg-[#14532D] p-5 flex justify-between items-center">
                                <div>
                                    <h3 className="text-white font-bold text-base flex items-center gap-2">
                                        🔔 Stock Alerts
                                        {unread > 0 && (
                                            <span className="bg-[#FF4444] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                {unread} New
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-[#A8D5BB] text-[11px] mt-0.5 font-medium">
                                        {loading ? "Checking fresh alerts..." : `${alerts.length} alerts found`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="bg-white/10 text-white w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Alert List */}
                            <div className="max-h-[420px] overflow-y-auto p-3 bg-gray-50/50">
                                {loading && alerts.length === 0 && (
                                    <div className="py-12 text-center text-gray-400">
                                        <div className="text-3xl mb-2 animate-bounce">🔄</div>
                                        <p className="text-xs font-bold uppercase tracking-widest">Updating alerts...</p>
                                    </div>
                                )}

                                {!loading && alerts.length === 0 && (
                                    <div className="py-12 text-center">
                                        <div className="text-4xl mb-3">✅</div>
                                        <p className="text-[#14532D] font-bold text-sm">All Clear!</p>
                                        <p className="text-gray-400 text-[11px] uppercase tracking-widest mt-1">No alerts found today 🌾</p>
                                    </div>
                                )}

                                {alerts.map((alert: any) => {
                                    const s = STYLES[alert.severity as keyof typeof STYLES] || STYLES.info;
                                    return (
                                        <div
                                            key={alert.id}
                                            onClick={() => handleRead(alert.id)}
                                            className={`bell-item-hover mb-2 p-3.5 rounded-2xl border transition-all cursor-pointer ${alert.isRead ? "bg-white opacity-60 border-gray-100" : "bg-white border-transparent shadow-sm"}`}
                                            style={{
                                                backgroundColor: alert.isRead ? "#fff" : s.bg,
                                                borderColor: alert.isRead ? "#f3f4f6" : s.border
                                            }}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{s.icon}</span>
                                                    <span className="font-bold text-gray-900 text-[13px]">{alert.cropHindi}</span>
                                                </div>
                                                <span
                                                    className="text-[9px] font-black uppercase tracking-widest text-white px-2.5 py-1 rounded-full"
                                                    style={{ backgroundColor: s.badge }}
                                                >
                                                    {alert.severity}
                                                </span>
                                            </div>

                                            <p className="text-gray-600 text-xs leading-relaxed mb-3 font-medium">
                                                {alert.message_hi}
                                            </p>

                                            <div className="bg-black/5 rounded-xl p-2.5 flex gap-2 items-start">
                                                <span className="text-sm">💡</span>
                                                <p className="text-[11px] font-bold text-[#14532D] leading-tight">
                                                    {alert.action_hi}
                                                </p>
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-end">
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                    📦 {alert.quantity} Quintal
                                                </div>
                                                <div className="text-[9px] font-bold text-gray-300">
                                                    {alert.isRead ? "Padh liya ✓" : "Click to mark as read"}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer Actions */}
                            {alerts.length > 0 && (
                                <div className="p-3 bg-white border-t border-gray-50 flex gap-2">
                                    <button
                                        onClick={runCheck}
                                        className="flex-1 bg-[#14532D] text-white text-[11px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-[#14532D]/90 transition-all shadow-lg shadow-[#14532D]/10"
                                    >
                                        Refresh 🔄
                                    </button>
                                    <button
                                        onClick={async () => {
                                            for (const a of alerts) if (!a.isRead) await handleRead(a.id);
                                        }}
                                        className="flex-1 bg-gray-100 text-[#14532D] text-[11px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-gray-200 transition-all"
                                    >
                                        Read All ✓
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

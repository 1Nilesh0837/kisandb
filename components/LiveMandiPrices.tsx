"use client";
import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/lib/LanguageContext";

// Real crop list for selector
const CROPS = [
    { value: "Wheat", label: "🌾 Wheat (गेहूं)" },
    { value: "Rice", label: "🌾 Rice (धान)" },
    { value: "Maize", label: "🌽 Maize (मक्का)" },
    { value: "Mustard", label: "🌻 Mustard (सरसों)" },
    { value: "Onion", label: "🧅 Onion (प्याज)" },
    { value: "Tomato", label: "🍅 Tomato (टमाटर)" },
    { value: "Soybean", label: "🫘 Soybean (सोयाबीन)" },
    { value: "Potato", label: "🥔 Potato (आलू)" },
    { value: "Cotton", label: "🤍 Cotton (कपास)" },
    { value: "Gram", label: "🫘 Gram (चना)" },
    { value: "Groundnut", label: "🥜 Groundnut (मूंगफली)" },
    { value: "Bajra", label: "🌾 Bajra (बाजरा)" },
];

const STATES = [
    "Madhya Pradesh", "Uttar Pradesh",
    "Maharashtra", "Punjab", "Rajasthan",
    "Gujarat", "Haryana", "Bihar",
    "Andhra Pradesh", "Karnataka",
];

interface MandiRecord {
    mandi: string;
    district: string;
    state: string;
    commodity: string;
    variety: string;
    min_price: number;
    max_price: number;
    modal_price: number;
    date: string;
}

export default function LiveMandiPrices({
    farmerProfile,
    onClose,
}: {
    farmerProfile: any;
    onClose: () => void;
}) {
    const defaultState =
        farmerProfile?.state || "Madhya Pradesh";

    const [state, setState] = useState(defaultState);
    const [crop, setCrop] = useState("Wheat");
    const [records, setRecords] = useState<MandiRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const { language: lang } = useLanguage();

    // ESC to close
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", h);
        return () =>
            window.removeEventListener("keydown", h);
    }, [onClose]);

    // Auto-fetch on mount and when 
    // state or crop changes
    const fetchPrices = useCallback(
        async () => {
            setLoading(true);
            setError("");

            try {
                const params = new URLSearchParams({
                    state,
                    commodity: crop,
                    limit: "100",
                });

                const res = await fetch(
                    `/api/mandi?${params}`
                );
                const data = await res.json();

                if (data.success && data.records.length > 0) {
                    setRecords(data.records);
                    setLastUpdated(new Date());
                } else {
                    setError(
                        lang === "hi"
                            ? `${state} mein ${crop} ka data abhi nahi mila. Doosra state ya fasal chunein.`
                            : `No data found for ${crop} in ${state}. Try another state or crop.`
                    );
                    setRecords([]);
                }
            } catch (err) {
                setError(
                    lang === "hi"
                        ? "Internet connection check karein. Data load nahi ho pa raha."
                        : "Check internet connection. Data could not load."
                );
                setRecords([]);
            } finally {
                setLoading(false);
            }
        }, [state, crop, lang]
    );

    useEffect(() => {
        fetchPrices();
    }, [fetchPrices]);

    // Computed values
    const bestMandi = records[0];
    const worstMandi = records[records.length - 1];
    const avgPrice = records.length > 0
        ? Math.round(
            records.reduce(
                (s, r) => s + r.modal_price, 0
            ) / records.length
        )
        : 0;

    function priceDiff(price: number) {
        if (!avgPrice) return { diff: 0, pct: "0", color: "#888", sign: "" };
        const diff = price - avgPrice;
        return {
            diff,
            pct: Math.abs((diff / avgPrice) * 100)
                .toFixed(1),
            color: diff >= 0 ? "#22C55E" : "#EF4444",
            sign: diff >= 0 ? "+" : "-",
        };
    }

    return (
        <div
            onClick={e => {
                if (e.target === e.currentTarget)
                    onClose();
            }}
            style={{
                position: "fixed", inset: 0, zIndex: 1000,
                background: "rgba(0,0,0,0.5)",
                display: "flex", alignItems: "flex-start",
                justifyContent: "center",
                overflowY: "auto", padding: "20px",
            }}
        >
            <div style={{
                background: "white", borderRadius: "20px",
                width: "100%", maxWidth: "720px",
                overflow: "hidden",
                boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
                margin: "auto",
            }}>

                {/* HEADER */}
                <div style={{
                    background: "linear-gradient(135deg,#1A3C2E,#2D6A4F)",
                    padding: "20px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}>
                    <div>
                        <h2 style={{
                            color: "white", fontSize: "20px",
                            fontWeight: 800, margin: 0,
                            display: "flex", alignItems: "center",
                            gap: "8px",
                        }}>
                            🏛️ Live Mandi Prices
                            {/* LIVE BADGE */}
                            <span style={{
                                background: "#EF4444",
                                color: "white",
                                fontSize: "9px", fontWeight: 800,
                                padding: "3px 8px",
                                borderRadius: "20px",
                                animation: "pulse 2s infinite",
                            }}>
                                ● LIVE
                            </span>
                        </h2>
                        <p style={{
                            color: "#A8D5BB", fontSize: "12px",
                            margin: "4px 0 0",
                        }}>
                            {lastUpdated
                                ? (lang === "hi"
                                    ? `Aakhri update: ${lastUpdated.toLocaleTimeString("hi-IN")}`
                                    : `Updated: ${lastUpdated.toLocaleTimeString()}`)
                                : (lang === "hi"
                                    ? "Data load ho raha hai..."
                                    : "Loading data...")}
                            {" • "}
                            <span style={{ color: "#52B788" }}>
                                Source: data.gov.in (Agmarknet)
                            </span>
                        </p>
                    </div>

                    <div style={{
                        display: "flex", gap: "8px",
                        alignItems: "center"
                    }}>
                        <button
                            onClick={fetchPrices}
                            disabled={loading}
                            style={{
                                background: "rgba(255,255,255,0.15)",
                                border: "none", color: "white",
                                borderRadius: "10px",
                                padding: "8px 14px", cursor: "pointer",
                                fontSize: "12px", fontWeight: 700,
                            }}
                        >
                            {loading ? "🔄..." : "🔄 Refresh"}
                        </button>
                        {/* Global Language Setting applies */}
                        <button onClick={onClose} style={{
                            background: "rgba(255,255,255,0.15)",
                            border: "none", color: "white",
                            borderRadius: "10px",
                            padding: "8px 12px",
                            cursor: "pointer", fontSize: "16px",
                        }}>✕</button>
                    </div>
                </div>

                {/* FILTERS */}
                <div style={{
                    background: "#F5F0E8",
                    padding: "14px 24px",
                    borderBottom: "1px solid #E8E0D0",
                    display: "flex", gap: "12px",
                    flexWrap: "wrap", alignItems: "flex-end",
                }}>
                    <div>
                        <label style={{
                            fontSize: "11px", color: "#888",
                            fontWeight: 700, display: "block",
                            marginBottom: "4px",
                            textTransform: "uppercase",
                        }}>
                            {lang === "hi" ? "Rajya" : "State"}
                        </label>
                        <select
                            value={state}
                            onChange={e => setState(e.target.value)}
                            style={{
                                padding: "8px 12px",
                                borderRadius: "10px",
                                border: "1.5px solid #E8E0D0",
                                background: "white", fontSize: "13px",
                                fontWeight: 700, color: "#1A3C2E",
                                outline: "none", cursor: "pointer",
                            }}
                        >
                            {STATES.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{
                            fontSize: "11px", color: "#888",
                            fontWeight: 700, display: "block",
                            marginBottom: "4px",
                            textTransform: "uppercase",
                        }}>
                            {lang === "hi" ? "Fasal" : "Crop"}
                        </label>
                        <select
                            value={crop}
                            onChange={e => setCrop(e.target.value)}
                            style={{
                                padding: "8px 12px",
                                borderRadius: "10px",
                                border: "1.5px solid #E8E0D0",
                                background: "white", fontSize: "13px",
                                fontWeight: 700, color: "#1A3C2E",
                                outline: "none", cursor: "pointer",
                            }}
                        >
                            {CROPS.map(c => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Record count badge */}
                    {records.length > 0 && (
                        <div style={{
                            background: "#1A3C2E",
                            color: "white",
                            borderRadius: "10px",
                            padding: "8px 14px",
                            fontSize: "12px", fontWeight: 700,
                        }}>
                            📊 {records.length} mandis mila
                        </div>
                    )}
                </div>

                <div style={{ padding: "20px 24px" }}>

                    {/* LOADING STATE */}
                    {loading && (
                        <div style={{
                            textAlign: "center",
                            padding: "50px 20px",
                        }}>
                            <div style={{
                                fontSize: "40px",
                                marginBottom: "12px",
                                animation: "spin 1s linear infinite",
                            }}>
                                🌾
                            </div>
                            <div style={{
                                fontSize: "14px", color: "#888",
                                fontWeight: 700,
                            }}>
                                {lang === "hi"
                                    ? "data.gov.in se real prices fetch ho rahi hain..."
                                    : "Fetching real prices from data.gov.in..."}
                            </div>
                            <div style={{
                                fontSize: "11px", color: "#AAA",
                                marginTop: "6px",
                            }}>
                                {lang === "hi"
                                    ? "Ye government ka official data hai"
                                    : "This is official government data"}
                            </div>
                        </div>
                    )}

                    {/* ERROR STATE */}
                    {!loading && error && (
                        <div style={{
                            background: "#FFF0F0",
                            border: "1.5px solid #EF4444",
                            borderRadius: "14px",
                            padding: "20px", textAlign: "center",
                        }}>
                            <div style={{
                                fontSize: "32px",
                                marginBottom: "8px"
                            }}>
                                😔
                            </div>
                            <div style={{
                                fontSize: "13px", color: "#DC2626",
                                fontWeight: 600, marginBottom: "12px",
                            }}>
                                {error}
                            </div>
                            <div style={{
                                display: "flex", gap: "8px",
                                justifyContent: "center",
                                flexWrap: "wrap",
                            }}>
                                <button
                                    onClick={fetchPrices}
                                    style={{
                                        background: "#1A3C2E",
                                        color: "white", border: "none",
                                        borderRadius: "10px",
                                        padding: "9px 18px",
                                        cursor: "pointer",
                                        fontSize: "12px", fontWeight: 700,
                                    }}
                                >
                                    🔄 {lang === "hi"
                                        ? "Dobara Try Karein"
                                        : "Try Again"}
                                </button>
                                {/* Quick crop switcher */}
                                {["Wheat", "Rice", "Mustard"].map(c => (
                                    <button key={c}
                                        onClick={() => setCrop(c)}
                                        style={{
                                            background: "#F5F0E8",
                                            color: "#1A3C2E",
                                            border: "1.5px solid #E8E0D0",
                                            borderRadius: "10px",
                                            padding: "9px 14px",
                                            cursor: "pointer",
                                            fontSize: "12px", fontWeight: 700,
                                        }}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SUCCESS STATE */}
                    {!loading && !error &&
                        records.length > 0 && (
                            <>
                                {/* STAT CARDS */}
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3,1fr)",
                                    gap: "12px", marginBottom: "20px",
                                }}>
                                    {[
                                        {
                                            icon: "🏆",
                                            label: lang === "hi"
                                                ? "Sabse Zyada Daam"
                                                : "Highest Price",
                                            value: `₹${bestMandi?.modal_price?.toLocaleString()}`,
                                            sub: bestMandi?.mandi || "",
                                            color: "#D4A017",
                                        },
                                        {
                                            icon: "📊",
                                            label: lang === "hi"
                                                ? "Average Daam"
                                                : "Average Price",
                                            value: `₹${avgPrice.toLocaleString()}`,
                                            sub: `${records.length} mandis`,
                                            color: "#1A3C2E",
                                        },
                                        {
                                            icon: "📉",
                                            label: lang === "hi"
                                                ? "Sabse Kam Daam"
                                                : "Lowest Price",
                                            value: `₹${worstMandi?.modal_price?.toLocaleString()}`,
                                            sub: worstMandi?.mandi || "",
                                            color: "#EF4444",
                                        },
                                    ].map((card, i) => (
                                        <div key={i} style={{
                                            background: "white",
                                            border: `1.5px solid ${card.color}22`,
                                            borderTop: `4px solid ${card.color}`,
                                            borderRadius: "14px",
                                            padding: "14px", textAlign: "center",
                                        }}>
                                            <div style={{ fontSize: "22px" }}>
                                                {card.icon}
                                            </div>
                                            <div style={{
                                                fontSize: "10px", color: "#888",
                                                fontWeight: 700,
                                                textTransform: "uppercase",
                                                margin: "6px 0 4px",
                                            }}>
                                                {card.label}
                                            </div>
                                            <div style={{
                                                fontSize: "20px", fontWeight: 800,
                                                color: card.color,
                                            }}>
                                                {card.value}
                                            </div>
                                            <div style={{
                                                fontSize: "10px", color: "#888",
                                                marginTop: "2px",
                                            }}>
                                                /quintal • {card.sub}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* DATA SOURCE BADGE */}
                                <div style={{
                                    background: "#F0FFF4",
                                    border: "1px solid #22C55E33",
                                    borderRadius: "10px",
                                    padding: "8px 14px",
                                    marginBottom: "14px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    fontSize: "11px",
                                    color: "#16A34A",
                                    fontWeight: 700,
                                }}>
                                    <span>✅</span>
                                    <span>
                                        {lang === "hi"
                                            ? `Ye data REAL hai — data.gov.in Agmarknet se aaya hai। Date: ${records[0]?.date}`
                                            : `REAL DATA from data.gov.in Agmarknet. Date: ${records[0]?.date}`}
                                    </span>
                                </div>

                                {/* MANDI TABLE */}
                                <div style={{
                                    fontSize: "13px", fontWeight: 700,
                                    color: "#1A3C2E", marginBottom: "10px",
                                }}>
                                    📍 {lang === "hi"
                                        ? `${state} — ${crop} Mandis`
                                        : `${state} — ${crop} Markets`}
                                    {" "}({records.length} results)
                                </div>

                                <div style={{
                                    borderRadius: "14px",
                                    overflow: "hidden",
                                    border: "1px solid #E8E0D0",
                                    maxHeight: "360px",
                                    overflowY: "auto",
                                }}>
                                    {/* Table header */}
                                    <div style={{
                                        display: "grid",
                                        gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr",
                                        background: "#1A3C2E",
                                        padding: "10px 16px",
                                        color: "white",
                                        fontSize: "11px", fontWeight: 700,
                                        textTransform: "uppercase",
                                        position: "sticky", top: 0, zIndex: 1,
                                    }}>
                                        <span>Mandi</span>
                                        <span>District</span>
                                        <span>Modal</span>
                                        <span>Min-Max</span>
                                        <span>vs Avg</span>
                                    </div>

                                    {records.map((r, i) => {
                                        const d = priceDiff(r.modal_price);
                                        const isBest = i === 0;

                                        return (
                                            <div key={i} style={{
                                                display: "grid",
                                                gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr",
                                                padding: "11px 16px",
                                                alignItems: "center",
                                                background: isBest
                                                    ? "#FFFBEB" : "white",
                                                borderBottom: "1px solid #F0EBE0",
                                            }}>
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                }}>
                                                    {isBest && (
                                                        <span style={{
                                                            background: "#D4A017",
                                                            color: "white",
                                                            borderRadius: "20px",
                                                            padding: "2px 7px",
                                                            fontSize: "8px",
                                                            fontWeight: 800,
                                                        }}>
                                                            BEST
                                                        </span>
                                                    )}
                                                    <span style={{
                                                        fontWeight: isBest ? 800 : 600,
                                                        color: "#1A3C2E",
                                                        fontSize: "12px",
                                                    }}>
                                                        {r.mandi}
                                                    </span>
                                                </div>
                                                <span style={{
                                                    fontSize: "11px", color: "#666",
                                                }}>
                                                    {r.district}
                                                </span>
                                                <span style={{
                                                    fontWeight: 800, fontSize: "13px",
                                                    color: isBest ? "#D4A017" : "#1A3C2E",
                                                }}>
                                                    ₹{r.modal_price.toLocaleString()}
                                                </span>
                                                <span style={{
                                                    fontSize: "10px", color: "#888",
                                                }}>
                                                    {r.min_price.toLocaleString()}
                                                    –
                                                    {r.max_price.toLocaleString()}
                                                </span>
                                                <span style={{
                                                    fontSize: "11px",
                                                    fontWeight: 700,
                                                    color: d.color,
                                                }}>
                                                    {d.sign}{d.pct}%
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* AI ADVICE */}
                                {bestMandi && (
                                    <div style={{
                                        marginTop: "16px",
                                        background: "linear-gradient(135deg,#1A3C2E,#2D6A4F)",
                                        borderRadius: "14px",
                                        padding: "14px 18px",
                                        display: "flex",
                                        gap: "12px",
                                        alignItems: "flex-start",
                                    }}>
                                        <span style={{ fontSize: "24px" }}>🤖</span>
                                        <div style={{
                                            color: "white",
                                            fontSize: "13px",
                                            lineHeight: 1.6,
                                        }}>
                                            {lang === "hi"
                                                ? `${crop} ke liye aaj ${bestMandi.mandi} (${bestMandi.district}) sabse accha mandi hai — ₹${bestMandi.modal_price.toLocaleString()}/quintal! Average se ₹${Math.abs(bestMandi.modal_price - avgPrice).toLocaleString()} zyada milega. Wahan jaake becho! 🏆`
                                                : `Best market for ${crop} today is ${bestMandi.mandi} (${bestMandi.district}) at ₹${bestMandi.modal_price.toLocaleString()}/quintal — ₹${Math.abs(bestMandi.modal_price - avgPrice).toLocaleString()} above average! 🏆`}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                </div>

                <style>{`
          @keyframes pulse {
            0%,100%{opacity:1}
            50%{opacity:0.5}
          }
          @keyframes spin {
            to{transform:rotate(360deg)}
          }
        `}</style>
            </div>
        </div>
    );
}

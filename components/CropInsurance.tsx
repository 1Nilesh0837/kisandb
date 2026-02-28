"use client";
import { useState, useEffect } from "react";

// PMFBY Premium rates (% of sum insured)
// Source: pmfby.gov.in official rates
const PREMIUM_RATES: Record<string, {
    farmer_share: number;
    max_coverage: number;
    season: string;
    season_hi: string;
    risk: "low" | "medium" | "high";
    risk_factors: string[];
}> = {
    "Wheat": { farmer_share: 1.5, max_coverage: 50000, season: "Rabi", season_hi: "रबी", risk: "low", risk_factors: ["Frost", "Hail", "Unseasonal rain"] },
    "Rice": { farmer_share: 2.0, max_coverage: 60000, season: "Kharif", season_hi: "खरीफ", risk: "medium", risk_factors: ["Flood", "Drought", "Pest attack"] },
    "Maize": { farmer_share: 2.0, max_coverage: 40000, season: "Kharif", season_hi: "खरीफ", risk: "medium", risk_factors: ["Drought", "Wind damage", "Pest"] },
    "Mustard": { farmer_share: 1.5, max_coverage: 45000, season: "Rabi", season_hi: "रबी", risk: "low", risk_factors: ["Frost", "Aphid attack", "Rain"] },
    "Cotton": { farmer_share: 5.0, max_coverage: 80000, season: "Kharif", season_hi: "खरीफ", risk: "high", risk_factors: ["Pink bollworm", "Drought", "Flood"] },
    "Soybean": { farmer_share: 2.0, max_coverage: 55000, season: "Kharif", season_hi: "खरीफ", risk: "medium", risk_factors: ["Drought", "Yellow mosaic", "Flood"] },
    "Gram": { farmer_share: 1.5, max_coverage: 38000, season: "Rabi", season_hi: "रबी", risk: "low", risk_factors: ["Pod borer", "Frost", "Wilt"] },
    "Onion": { farmer_share: 5.0, max_coverage: 70000, season: "Rabi", season_hi: "रबी", risk: "high", risk_factors: ["Thrips", "Purple blotch", "Rain"] },
    "Tomato": { farmer_share: 5.0, max_coverage: 90000, season: "Zaid", season_hi: "जायद", risk: "high", risk_factors: ["Blight", "Whitefly", "Frost"] },
    "Potato": { farmer_share: 5.0, max_coverage: 85000, season: "Rabi", season_hi: "रबी", risk: "high", risk_factors: ["Late blight", "Frost", "Waterlogging"] },
    "Groundnut": { farmer_share: 2.0, max_coverage: 48000, season: "Kharif", season_hi: "खरीफ", risk: "medium", risk_factors: ["Drought", "Tikka disease", "Stem rot"] },
    "Sugarcane": { farmer_share: 2.5, max_coverage: 100000, season: "Annual", season_hi: "वार्षिक", risk: "medium", risk_factors: ["Drought", "Flood", "Red rot"] },
};

const WEATHER_RISKS: Record<string, {
    risk_score: number;
    main_risk: string;
    main_risk_hi: string;
    advice: string;
    advice_hi: string;
}> = {
    "Madhya Pradesh": { risk_score: 65, main_risk: "Drought + Unseasonal Rain", main_risk_hi: "सूखा + बेमौसम बारिश", advice: "Insurance highly recommended for Soybean and Wheat", advice_hi: "सोयाबीन और गेहूं के लिए बीमा जरूरी है" },
    "Uttar Pradesh": { risk_score: 60, main_risk: "Flood + Frost", main_risk_hi: "बाढ़ + पाला", advice: "Rice and Mustard face highest risk in UP", advice_hi: "धान और सरसों को सबसे ज्यादा खतरा" },
    "Maharashtra": { risk_score: 75, main_risk: "Drought + Hailstorm", main_risk_hi: "सूखा + ओलावृष्टि", advice: "Cotton and Onion growers must insure", advice_hi: "कपास और प्याज उगाने वालों के लिए जरूरी" },
    "Punjab": { risk_score: 45, main_risk: "Waterlogging", main_risk_hi: "जलभराव", advice: "Low risk state — basic insurance sufficient", advice_hi: "कम जोखिम — बेसिक बीमा काफी है" },
    "Rajasthan": { risk_score: 80, main_risk: "Drought + Hot Winds", main_risk_hi: "सूखा + गर्म हवाएं", advice: "Mustard and Bajra face extreme drought risk", advice_hi: "सरसों और बाजरा को सूखे का बड़ा खतरा" },
    "Gujarat": { risk_score: 70, main_risk: "Drought + Cyclone", main_risk_hi: "सूखा + चक्रवात", advice: "Groundnut and Cotton need comprehensive cover", advice_hi: "मूंगफली और कपास को पूरा बीमा चाहिए" },
    "Haryana": { risk_score: 50, main_risk: "Hail + Unseasonal Rain", main_risk_hi: "ओलावृष्टि + बेमौसम बारिश", advice: "Wheat growers should insure before March", advice_hi: "गेहूं किसान मार्च से पहले बीमा करें" },
};

const DEADLINES = [
    { season: "Rabi 2025-26", crop_type: "Rabi crops", deadline: "March 31, 2026", deadline_hi: "31 मार्च 2026", days_left: 35, urgent: true },
    { season: "Kharif 2026", crop_type: "Kharif crops", deadline: "July 31, 2026", deadline_hi: "31 जुलाई 2026", days_left: 157, urgent: false },
    { season: "Zaid 2026", crop_type: "Zaid crops", deadline: "April 30, 2026", deadline_hi: "30 अप्रैल 2026", days_left: 65, urgent: false },
];

export default function CropInsurance({
    farmerProfile,
    onClose,
}: {
    farmerProfile: any;
    onClose: () => void;
}) {
    const defaultCrop =
        farmerProfile?.crops?.[0]?.cropName ||
        farmerProfile?.crops?.[0] ||
        "Wheat";
    const defaultState =
        farmerProfile?.state || "Madhya Pradesh";
    const defaultLand =
        farmerProfile?.landSize ||
        farmerProfile?.land_acres || 2;

    const [crop, setCrop] = useState(defaultCrop);
    const [state, setState] = useState(defaultState);
    const [landAcres, setLandAcres] = useState(defaultLand);
    const [lang, setLang] = useState<"hi" | "en">("hi");
    // @ts-ignore
    const [calculated, setCalculated] = useState(false);

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", h);
        return () =>
            window.removeEventListener("keydown", h);
    }, [onClose]);

    // Auto calculate on mount
    useEffect(() => { setCalculated(true); }, []);

    const cropData = PREMIUM_RATES[crop] || PREMIUM_RATES["Wheat"];
    const weatherData = WEATHER_RISKS[state] || WEATHER_RISKS["Madhya Pradesh"];

    // Calculate premium
    const sumInsured = cropData.max_coverage * landAcres;
    const farmerPremium = Math.round(sumInsured * (cropData.farmer_share / 100));
    const govtSubsidy = Math.round(sumInsured * 0.10);
    // @ts-ignore
    const totalPremium = farmerPremium + govtSubsidy;
    const dailyCost = Math.round(farmerPremium / 365);

    const RISK_COLOR = {
        low: { bg: "#F0FFF4", border: "#22C55E", text: "#16A34A", label: "Low Risk", label_hi: "कम जोखिम" },
        medium: { bg: "#FFFBEB", border: "#F59E0B", text: "#D97706", label: "Medium Risk", label_hi: "मध्यम जोखिम" },
        high: { bg: "#FFF0F0", border: "#EF4444", text: "#DC2626", label: "High Risk", label_hi: "ज्यादा जोखिम" },
    };
    const rc = RISK_COLOR[cropData.risk];

    return (
        <div
            onClick={e => {
                if (e.target === e.currentTarget) onClose();
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
                width: "100%", maxWidth: "680px",
                overflow: "hidden",
                boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
                margin: "auto",
            }}>

                {/* HEADER */}
                <div style={{
                    background: "linear-gradient(135deg,#1A3C2E,#2D6A4F)",
                    padding: "20px 24px",
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center",
                }}>
                    <div>
                        <h2 style={{
                            color: "white", fontSize: "20px",
                            fontWeight: 800, margin: 0,
                        }}>
                            🛡️ Crop Insurance Calculator
                        </h2>
                        <p style={{
                            color: "#A8D5BB", fontSize: "12px",
                            margin: "4px 0 0",
                        }}>
                            {lang === "hi"
                                ? "PM Fasal Bima Yojana — Apni Fasal Surakshit Karein"
                                : "PM Fasal Bima Yojana — Protect Your Harvest"}
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <div style={{
                            display: "flex",
                            background: "rgba(255,255,255,0.1)",
                            borderRadius: "20px", padding: "3px",
                        }}>
                            {(["hi", "en"] as const).map(l => (
                                <button key={l}
                                    onClick={() => setLang(l)}
                                    style={{
                                        padding: "4px 12px",
                                        borderRadius: "20px", border: "none",
                                        cursor: "pointer", fontSize: "11px",
                                        fontWeight: 700,
                                        background: lang === l
                                            ? "white" : "transparent",
                                        color: lang === l
                                            ? "#1A3C2E"
                                            : "rgba(255,255,255,0.7)",
                                    }}
                                >
                                    {l === "hi" ? "हिं" : "EN"}
                                </button>
                            ))}
                        </div>
                        <button onClick={onClose} style={{
                            background: "rgba(255,255,255,0.15)",
                            border: "none", color: "white",
                            borderRadius: "10px", padding: "8px 12px",
                            cursor: "pointer", fontSize: "16px",
                        }}>✕</button>
                    </div>
                </div>

                <div style={{ padding: "20px 24px" }}>

                    {/* DEADLINE ALERT */}
                    {DEADLINES.filter(d => d.urgent).map(d => (
                        <div key={d.season} style={{
                            background: "linear-gradient(135deg,#FF4444,#CC0000)",
                            borderRadius: "14px", padding: "14px 18px",
                            marginBottom: "16px", display: "flex",
                            gap: "12px", alignItems: "center",
                            color: "white",
                        }}>
                            <span style={{ fontSize: "28px" }}>⏰</span>
                            <div>
                                <div style={{
                                    fontWeight: 800, fontSize: "14px"
                                }}>
                                    {lang === "hi"
                                        ? `JALDI KAREIN: ${d.season} Bima Ki Deadline!`
                                        : `URGENT: ${d.season} Insurance Deadline!`}
                                </div>
                                <div style={{
                                    fontSize: "12px", opacity: 0.9,
                                    marginTop: "3px",
                                }}>
                                    {lang === "hi"
                                        ? `${d.deadline_hi} — sirf ${d.days_left} din baaki!`
                                        : `${d.deadline} — only ${d.days_left} days left!`}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* INPUTS */}
                    <div style={{
                        background: "#F5F0E8", borderRadius: "14px",
                        padding: "16px", marginBottom: "20px",
                    }}>
                        <div style={{
                            fontSize: "12px", fontWeight: 700,
                            color: "#1A3C2E", textTransform: "uppercase",
                            letterSpacing: "1px", marginBottom: "12px",
                        }}>
                            🌾 {lang === "hi"
                                ? "Apni Fasal Ki Jaankari Bharein"
                                : "Enter Your Crop Details"}
                        </div>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: "12px",
                        }}>
                            {/* Crop */}
                            <div>
                                <label style={{
                                    fontSize: "11px", color: "#888",
                                    fontWeight: 700, display: "block",
                                    marginBottom: "4px",
                                }}>
                                    {lang === "hi" ? "Fasal" : "Crop"}
                                </label>
                                <select
                                    value={crop}
                                    onChange={e => setCrop(e.target.value)}
                                    style={{
                                        width: "100%", padding: "9px 10px",
                                        border: "1.5px solid #E8E0D0",
                                        borderRadius: "10px", background: "white",
                                        fontSize: "13px", fontWeight: 700,
                                        color: "#1A3C2E", outline: "none",
                                    }}
                                >
                                    {Object.keys(PREMIUM_RATES).map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            {/* State */}
                            <div>
                                <label style={{
                                    fontSize: "11px", color: "#888",
                                    fontWeight: 700, display: "block",
                                    marginBottom: "4px",
                                }}>
                                    {lang === "hi" ? "Rajya" : "State"}
                                </label>
                                <select
                                    value={state}
                                    onChange={e => setState(e.target.value)}
                                    style={{
                                        width: "100%", padding: "9px 10px",
                                        border: "1.5px solid #E8E0D0",
                                        borderRadius: "10px", background: "white",
                                        fontSize: "13px", fontWeight: 700,
                                        color: "#1A3C2E", outline: "none",
                                    }}
                                >
                                    {Object.keys(WEATHER_RISKS).map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Land */}
                            <div>
                                <label style={{
                                    fontSize: "11px", color: "#888",
                                    fontWeight: 700, display: "block",
                                    marginBottom: "4px",
                                }}>
                                    {lang === "hi" ? "Zameen (acres)" : "Land (acres)"}
                                </label>
                                <input
                                    type="number" min="0.1" step="0.5"
                                    value={landAcres}
                                    onChange={e =>
                                        setLandAcres(Number(e.target.value))
                                    }
                                    style={{
                                        width: "100%", padding: "9px 10px",
                                        border: "1.5px solid #E8E0D0",
                                        borderRadius: "10px", background: "white",
                                        fontSize: "13px", fontWeight: 700,
                                        color: "#1A3C2E", outline: "none",
                                        boxSizing: "border-box",
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* PREMIUM RESULT CARDS */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2,1fr)",
                        gap: "12px", marginBottom: "20px",
                    }}>
                        {[
                            {
                                icon: "💰",
                                label: lang === "hi"
                                    ? "Aapka Premium (Saal Ka)"
                                    : "Your Annual Premium",
                                value: `₹${farmerPremium.toLocaleString()}`,
                                sub: lang === "hi"
                                    ? `Rozana sirf ₹${dailyCost}`
                                    : `Just ₹${dailyCost}/day`,
                                color: "#1A3C2E",
                                highlight: true,
                            },
                            {
                                icon: "🏛️",
                                label: lang === "hi"
                                    ? "Sarkar Ki Subsidy"
                                    : "Govt Subsidy",
                                value: `₹${govtSubsidy.toLocaleString()}`,
                                sub: lang === "hi"
                                    ? "Sarkar bharegi"
                                    : "Paid by government",
                                color: "#22C55E",
                                highlight: false,
                            },
                            {
                                icon: "🛡️",
                                label: lang === "hi"
                                    ? "Bima Coverage"
                                    : "Insurance Coverage",
                                value: `₹${sumInsured.toLocaleString()}`,
                                sub: lang === "hi"
                                    ? `${landAcres} acres ke liye`
                                    : `For ${landAcres} acres`,
                                color: "#3B82F6",
                                highlight: false,
                            },
                            {
                                icon: "📊",
                                label: lang === "hi"
                                    ? "Premium Rate"
                                    : "Premium Rate",
                                value: `${cropData.farmer_share}%`,
                                sub: lang === "hi"
                                    ? "Beema rashi ka"
                                    : "Of sum insured",
                                color: "#F59E0B",
                                highlight: false,
                            },
                        ].map((card, i) => (
                            <div key={i} style={{
                                background: card.highlight
                                    ? "linear-gradient(135deg,#1A3C2E,#2D6A4F)"
                                    : "white",
                                border: `1.5px solid ${card.color}33`,
                                borderTop: `4px solid ${card.color}`,
                                borderRadius: "14px",
                                padding: "16px",
                            }}>
                                <div style={{ fontSize: "22px" }}>
                                    {card.icon}
                                </div>
                                <div style={{
                                    fontSize: "10px",
                                    color: card.highlight ? "#A8D5BB" : "#888",
                                    fontWeight: 700, textTransform: "uppercase",
                                    margin: "8px 0 4px", letterSpacing: "0.5px",
                                }}>
                                    {card.label}
                                </div>
                                <div style={{
                                    fontSize: "24px", fontWeight: 800,
                                    color: card.highlight ? "white" : card.color,
                                }}>
                                    {card.value}
                                </div>
                                <div style={{
                                    fontSize: "11px",
                                    color: card.highlight ? "#A8D5BB" : "#888",
                                    marginTop: "4px",
                                }}>
                                    {card.sub}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* WEATHER RISK METER */}
                    <div style={{
                        background: rc.bg,
                        border: `1.5px solid ${rc.border}`,
                        borderRadius: "14px",
                        padding: "16px", marginBottom: "16px",
                    }}>
                        <div style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "center", marginBottom: "10px",
                        }}>
                            <div style={{
                                fontWeight: 700, fontSize: "13px",
                                color: rc.text,
                            }}>
                                ⚠️ {lang === "hi"
                                    ? `${state} — Mausam Jokhim`
                                    : `${state} — Weather Risk`}
                            </div>
                            <span style={{
                                background: rc.border, color: "white",
                                padding: "3px 12px", borderRadius: "20px",
                                fontSize: "11px", fontWeight: 800,
                            }}>
                                {lang === "hi"
                                    ? rc.label_hi
                                    : rc.label} — {weatherData.risk_score}/100
                            </span>
                        </div>

                        {/* Risk bar */}
                        <div style={{
                            height: "8px", background: "#E8E0D0",
                            borderRadius: "8px", overflow: "hidden",
                            marginBottom: "10px",
                        }}>
                            <div style={{
                                height: "100%",
                                width: `${weatherData.risk_score}%`,
                                background: weatherData.risk_score > 70
                                    ? "#EF4444"
                                    : weatherData.risk_score > 50
                                        ? "#F59E0B"
                                        : "#22C55E",
                                borderRadius: "8px",
                                transition: "width 0.8s ease",
                            }} />
                        </div>

                        <div style={{
                            fontSize: "12px", color: "#666",
                            marginBottom: "8px",
                        }}>
                            🌦️ {lang === "hi"
                                ? `Mukhya Jokhim: ${weatherData.main_risk_hi}`
                                : `Main Risk: ${weatherData.main_risk}`}
                        </div>
                        <div style={{
                            fontSize: "12px", fontWeight: 600,
                            color: rc.text,
                        }}>
                            💡 {lang === "hi"
                                ? weatherData.advice_hi
                                : weatherData.advice}
                        </div>
                    </div>

                    {/* ELIGIBLE CROPS LIST */}
                    <div style={{
                        background: "#F5F0E8", borderRadius: "14px",
                        padding: "14px 16px", marginBottom: "16px",
                    }}>
                        <div style={{
                            fontWeight: 700, fontSize: "13px",
                            color: "#1A3C2E", marginBottom: "10px",
                        }}>
                            ✅ {lang === "hi"
                                ? "PMFBY Mein Shamil Fasalein"
                                : "Crops Covered Under PMFBY"}
                        </div>
                        <div style={{
                            display: "flex", flexWrap: "wrap", gap: "6px",
                        }}>
                            {Object.keys(PREMIUM_RATES).map(c => (
                                <span key={c} style={{
                                    background: c === crop
                                        ? "#1A3C2E" : "white",
                                    color: c === crop
                                        ? "white" : "#1A3C2E",
                                    border: "1.5px solid #E8E0D0",
                                    borderRadius: "20px",
                                    padding: "4px 12px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                }}
                                    onClick={() => setCrop(c)}
                                >
                                    {c}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* APPLY BUTTON */}
                    <a
                        href="https://pmfby.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: "block",
                            background: "linear-gradient(135deg,#1A3C2E,#2D6A4F)",
                            color: "white", textAlign: "center",
                            padding: "14px", borderRadius: "12px",
                            textDecoration: "none", fontSize: "14px",
                            fontWeight: 800,
                        }}
                    >
                        🛡️ {lang === "hi"
                            ? "PMFBY Mein Apply Karein → pmfby.gov.in"
                            : "Apply for PMFBY → pmfby.gov.in"} 🔗
                    </a>
                </div>
            </div>
        </div>
    );
}

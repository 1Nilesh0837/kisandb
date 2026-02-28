"use client";
import { useState, useEffect } from "react";

const SOIL_DATABASE: Record<string,
    Record<string, {
        soil_type: string;
        soil_type_hi: string;
        ph: number;
        nitrogen: "Low" | "Medium" | "High";
        phosphorus: "Low" | "Medium" | "High";
        potassium: "Low" | "Medium" | "High";
        organic_matter: number;
        problems: string[];
        problems_hi: string[];
        best_crops: string[];
        best_crops_hi: string[];
        avoid_crops: string[];
        avoid_crops_hi: string[];
        fertilizers: string[];
        fertilizers_hi: string[];
    }>
> = {
    "Madhya Pradesh": {
        "Indore": { soil_type: "Black Cotton (Vertisol)", soil_type_hi: "काली मिट्टी (कपास)", ph: 7.8, nitrogen: "Low", phosphorus: "Medium", potassium: "High", organic_matter: 1.2, problems: ["Low nitrogen", "Waterlogging in rain", "Cracks in summer"], problems_hi: ["नाइट्रोजन की कमी", "बारिश में जलभराव", "गर्मी में दरारें"], best_crops: ["Soybean", "Cotton", "Wheat", "Gram"], best_crops_hi: ["सोयाबीन", "कपास", "गेहूं", "चना"], avoid_crops: ["Rice", "Groundnut"], avoid_crops_hi: ["धान", "मूंगफली"], fertilizers: ["Urea 50kg/acre", "DAP 25kg/acre", "Zinc Sulphate 10kg/acre"], fertilizers_hi: ["यूरिया 50 किग्रा/एकड़", "डीएपी 25 किग्रा/एकड़", "जिंक सल्फेट 10 किग्रा/एकड़"] },
        "Bhopal": { soil_type: "Black Cotton (Vertisol)", soil_type_hi: "काली मिट्टी", ph: 7.6, nitrogen: "Low", phosphorus: "Medium", potassium: "High", organic_matter: 1.1, problems: ["Nitrogen deficiency", "Poor drainage"], problems_hi: ["नाइट्रोजन की कमी", "जल निकासी खराब"], best_crops: ["Wheat", "Soybean", "Gram"], best_crops_hi: ["गेहूं", "सोयाबीन", "चना"], avoid_crops: ["Rice"], avoid_crops_hi: ["धान"], fertilizers: ["Urea 45kg/acre", "SSP 30kg/acre"], fertilizers_hi: ["यूरिया 45 किग्रा/एकड़", "एसएसपी 30 किग्रा/एकड़"] },
        "Gwalior": { soil_type: "Mixed Red-Black", soil_type_hi: "मिश्रित लाल-काली", ph: 7.2, nitrogen: "Medium", phosphorus: "Low", potassium: "Medium", organic_matter: 0.9, problems: ["Low phosphorus", "Erosion risk"], problems_hi: ["फॉस्फोरस कमी", "भूमि कटाव"], best_crops: ["Wheat", "Mustard", "Gram"], best_crops_hi: ["गेहूं", "सरसों", "चना"], avoid_crops: ["Cotton"], avoid_crops_hi: ["कपास"], fertilizers: ["Urea 40kg/acre", "DAP 35kg/acre"], fertilizers_hi: ["यूरिया 40 किग्रा/एकड़", "डीएपी 35 किग्रा/एकड़"] },
        "Indore (North)": { soil_type: "Black Cotton (Vertisol)", soil_type_hi: "काली मिट्टी (कपास)", ph: 7.8, nitrogen: "Low", phosphorus: "Medium", potassium: "High", organic_matter: 1.2, problems: ["Low nitrogen", "Waterlogging in rain", "Cracks in summer"], problems_hi: ["नाइट्रोजन की कमी", "बारिश में जलभराव", "गर्मी में दरारें"], best_crops: ["Soybean", "Cotton", "Wheat", "Gram"], best_crops_hi: ["सोयाबीन", "कपास", "गेहूं", "चना"], avoid_crops: ["Rice", "Groundnut"], avoid_crops_hi: ["धान", "मूंगफली"], fertilizers: ["Urea 50kg/acre", "DAP 25kg/acre", "Zinc Sulphate 10kg/acre"], fertilizers_hi: ["यूरिया 50 किग्रा/एकड़", "डीएपी 25 किग्रा/एकड़", "जिंक सल्फेट 10 किग्रा/एकड़"] },
        "Jabalpur": { soil_type: "Red Laterite", soil_type_hi: "लाल लेटराइट", ph: 6.5, nitrogen: "Low", phosphorus: "Low", potassium: "Low", organic_matter: 0.8, problems: ["Multiple nutrient deficiency", "Acidic tendency", "Low fertility"], problems_hi: ["कई पोषक तत्वों की कमी", "अम्लीयता", "कम उर्वरता"], best_crops: ["Maize", "Rice", "Toor"], best_crops_hi: ["मक्का", "धान", "तुअर"], avoid_crops: ["Wheat", "Cotton"], avoid_crops_hi: ["गेहूं", "कपास"], fertilizers: ["Lime 200kg/acre", "Urea 55kg/acre", "DAP 30kg/acre", "MOP 25kg/acre"], fertilizers_hi: ["चूना 200 किग्रा/एकड़", "यूरिया 55 किग्रा/एकड़", "डीएपी 30 किग्रा/एकड़", "एमओपी 25 किग्रा/एकड़"] },
    },
    "Uttar Pradesh": {
        "Lucknow": { soil_type: "Alluvial (Gangetic)", soil_type_hi: "जलोढ़ मिट्टी (गंगा)", ph: 7.5, nitrogen: "Medium", phosphorus: "Medium", potassium: "High", organic_matter: 1.5, problems: ["Slight alkalinity", "Zinc deficiency"], problems_hi: ["हल्की क्षारीयता", "जिंक की कमी"], best_crops: ["Wheat", "Rice", "Sugarcane", "Mustard"], best_crops_hi: ["गेहूं", "धान", "गन्ना", "सरसों"], avoid_crops: ["Cotton"], avoid_crops_hi: ["कपास"], fertilizers: ["Urea 50kg/acre", "DAP 25kg/acre", "Zinc Sulphate 10kg/acre"], fertilizers_hi: ["यूरिया 50 किग्रा/एकड़", "डीएपी 25 किग्रा/एकड़", "जिंक सल्फेट 10 किग्रा/एकड़"] },
        "Varanasi": { soil_type: "Alluvial Sandy Loam", soil_type_hi: "रेतीली जलोढ़ मिट्टी", ph: 7.3, nitrogen: "Medium", phosphorus: "Low", potassium: "Medium", organic_matter: 1.3, problems: ["Low phosphorus", "Quick drainage"], problems_hi: ["फॉस्फोरस कमी", "जल्दी सूखती है"], best_crops: ["Wheat", "Vegetables", "Mustard"], best_crops_hi: ["गेहूं", "सब्जियां", "सरसों"], avoid_crops: ["Cotton"], avoid_crops_hi: ["कपास"], fertilizers: ["Urea 45kg/acre", "SSP 40kg/acre"], fertilizers_hi: ["यूरिया 45 किग्रा/एकड़", "एसएसपी 40 किग्रा/एकड़"] },
        "Agra": { soil_type: "Alluvial + Sandy Mix", soil_type_hi: "जलोढ़ + रेतीली", ph: 8.0, nitrogen: "Low", phosphorus: "Low", potassium: "Medium", organic_matter: 0.7, problems: ["High alkalinity", "Low organic matter", "Salinity in some areas"], problems_hi: ["ज्यादा क्षारीयता", "कम जैविक पदार्थ", "कुछ जगह लवणता"], best_crops: ["Mustard", "Potato", "Wheat"], best_crops_hi: ["सरसों", "आलू", "गेहूं"], avoid_crops: ["Rice", "Sugarcane"], avoid_crops_hi: ["धान", "गन्ना"], fertilizers: ["Gypsum 100kg/acre", "Urea 40kg/acre", "DAP 30kg/acre"], fertilizers_hi: ["जिप्सम 100 किग्रा/एकड़", "यूरिया 40 किग्रा/एकड़", "डीएपी 30 किग्रा/एकड़"] },
    },
    "Maharashtra": {
        "Pune": { soil_type: "Medium Black", soil_type_hi: "मध्यम काली मिट्टी", ph: 7.5, nitrogen: "Low", phosphorus: "Low", potassium: "High", organic_matter: 1.0, problems: ["Low N and P", "Drought stress"], problems_hi: ["नाइट्रोजन-फॉस्फोरस कमी", "सूखे का तनाव"], best_crops: ["Soybean", "Onion", "Tomato"], best_crops_hi: ["सोयाबीन", "प्याज", "टमाटर"], avoid_crops: ["Rice"], avoid_crops_hi: ["धान"], fertilizers: ["Urea 50kg/acre", "DAP 30kg/acre", "FYM 2 ton/acre"], fertilizers_hi: ["यूरिया 50 किग्रा/एकड़", "डीएपी 30 किग्रा/एकड़", "गोबर खाद 2 टन/एकड़"] },
        "Nashik": { soil_type: "Shallow Black", soil_type_hi: "उथली काली मिट्टी", ph: 7.2, nitrogen: "Low", phosphorus: "Medium", potassium: "High", organic_matter: 1.2, problems: ["Shallow depth", "Low nitrogen"], problems_hi: ["उथली गहराई", "नाइट्रोजन कमी"], best_crops: ["Onion", "Grapes", "Tomato"], best_crops_hi: ["प्याज", "अंगूर", "टमाटर"], avoid_crops: ["Sugarcane"], avoid_crops_hi: ["गन्ना"], fertilizers: ["Urea 45kg/acre", "SSP 35kg/acre", "MOP 20kg/acre"], fertilizers_hi: ["यूरिया 45 किग्रा/एकड़", "एसएसपी 35 किग्रा/एकड़", "एमओपी 20 किग्रा/एकड़"] },
    },
    "Punjab": {
        "Ludhiana": { soil_type: "Sandy Loam Alluvial", soil_type_hi: "रेतीली दोमट जलोढ़", ph: 7.8, nitrogen: "Medium", phosphorus: "Medium", potassium: "High", organic_matter: 1.8, problems: ["Slight alkalinity", "Declining water table"], problems_hi: ["हल्की क्षारीयता", "गिरता भूजल स्तर"], best_crops: ["Wheat", "Rice", "Maize"], best_crops_hi: ["गेहूं", "धान", "मक्का"], avoid_crops: ["Cotton"], avoid_crops_hi: ["कपास"], fertilizers: ["Urea 55kg/acre", "DAP 25kg/acre"], fertilizers_hi: ["यूरिया 55 किग्रा/एकड़", "डीएपी 25 किग्रा/एकड़"] },
        "Amritsar": { soil_type: "Loamy Alluvial", soil_type_hi: "दोमट जलोढ़ मिट्टी", ph: 7.6, nitrogen: "High", phosphorus: "Medium", potassium: "High", organic_matter: 2.0, problems: ["Good fertility", "Waterlogging risk in kharif"], problems_hi: ["अच्छी उर्वरता", "खरीफ में जलभराव"], best_crops: ["Wheat", "Rice", "Vegetables"], best_crops_hi: ["गेहूं", "धान", "सब्जियां"], avoid_crops: ["Cotton"], avoid_crops_hi: ["कपास"], fertilizers: ["Urea 40kg/acre", "DAP 20kg/acre"], fertilizers_hi: ["यूरिया 40 किग्रा/एकड़", "डीएपी 20 किग्रा/एकड़"] },
    },
    "Rajasthan": {
        "Jaipur": { soil_type: "Sandy Desert", soil_type_hi: "रेतीली मरुस्थल", ph: 8.2, nitrogen: "Low", phosphorus: "Low", potassium: "Medium", organic_matter: 0.4, problems: ["Very low organic matter", "High alkalinity", "Wind erosion", "Drought"], problems_hi: ["जैविक पदार्थ बहुत कम", "ज्यादा क्षारीय", "हवा का कटाव", "सूखा"], best_crops: ["Bajra", "Mustard", "Guar"], best_crops_hi: ["बाजरा", "सरसों", "ग्वार"], avoid_crops: ["Rice", "Sugarcane", "Cotton"], avoid_crops_hi: ["धान", "गन्ना", "कपास"], fertilizers: ["FYM 3 ton/acre", "Urea 35kg/acre", "SSP 25kg/acre"], fertilizers_hi: ["गोबर खाद 3 टन/एकड़", "यूरिया 35 किग्रा/एकड़", "एसएसपी 25 किग्रा/एकड़"] },
        "Kota": { soil_type: "Medium Black", soil_type_hi: "मध्यम काली मिट्टी", ph: 7.8, nitrogen: "Low", phosphorus: "Medium", potassium: "High", organic_matter: 0.9, problems: ["Low nitrogen", "Drought prone"], problems_hi: ["नाइट्रोजन कमी", "सूखा प्रवण"], best_crops: ["Soybean", "Wheat", "Mustard"], best_crops_hi: ["सोयाबीन", "गेहूं", "सरसों"], avoid_crops: ["Rice"], avoid_crops_hi: ["धान"], fertilizers: ["Urea 45kg/acre", "DAP 30kg/acre", "Boron 2kg/acre"], fertilizers_hi: ["यूरिया 45 किग्रा/एकड़", "डीएपी 30 किग्रा/एकड़", "बोरोन 2 किग्रा/एकड़"] },
    },
};

const LEVEL_COLOR = {
    Low: { bg: "#FFF0F0", text: "#DC2626", icon: "⬇️" },
    Medium: { bg: "#FFFBEB", text: "#D97706", icon: "➡️" },
    High: { bg: "#F0FFF4", text: "#16A34A", icon: "⬆️" },
};

export default function SoilHealthCard({
    farmerProfile,
    onClose,
}: {
    farmerProfile: any;
    onClose: () => void;
}) {
    const defaultState =
        farmerProfile?.state ||
        Object.keys(SOIL_DATABASE)[0];

    const defaultDistrict =
        farmerProfile?.district ||
        Object.keys(
            SOIL_DATABASE[defaultState] || {}
        )[0];

    const [state, setState] = useState(defaultState);
    const [district, setDistrict] = useState(defaultDistrict);
    const [lang, setLang] = useState<"hi" | "en">("hi");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiAdvice, setAiAdvice] = useState("");

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", h);
        return () =>
            window.removeEventListener("keydown", h);
    }, [onClose]);

    // Reset district when state changes
    useEffect(() => {
        const districts =
            Object.keys(SOIL_DATABASE[state] || {});
        if (districts.length > 0) {
            if (!districts.includes(district)) {
                setDistrict(districts[0]);
            }
        }
        setAiAdvice("");
    }, [state]);

    const stateData = SOIL_DATABASE[state] || {};
    const districts = Object.keys(stateData);
    const soilData = stateData[district];

    async function generateAIAdvice() {
        if (!soilData) return;
        setAiLoading(true);

        try {
            const prompt = `
You are KisanDB — an expert Indian farming AI.

Soil data for ${district}, ${state}:
- Soil Type: ${soilData.soil_type}
- pH: ${soilData.ph}
- Nitrogen: ${soilData.nitrogen}
- Phosphorus: ${soilData.phosphorus}
- Potassium: ${soilData.potassium}
- Organic Matter: ${soilData.organic_matter}%
- Problems: ${soilData.problems.join(", ")}

Give 3 specific actionable recommendations 
in Hindi for this farmer to improve their soil.
Keep each point to 1-2 sentences.
Be practical and specific.
Use emojis. Mix Hindi and English naturally.
Format: numbered list 1. 2. 3.
      `.trim();

            const res = await fetch("/api/ai-chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: prompt,
                    type: "soil_advice"
                }),
            });
            const data = await res.json();
            setAiAdvice(data.reply || generateFallbackAdvice());
        } catch {
            setAiAdvice(generateFallbackAdvice());
        } finally {
            setAiLoading(false);
        }
    }

    function generateFallbackAdvice(): string {
        if (!soilData) return "";
        const tips = [];

        if (soilData.nitrogen === "Low") {
            tips.push(lang === "hi"
                ? `1. 🌿 Mitti mein Urea (${soilData.fertilizers[0]}) milayein — nitrogen badhega aur fasal hara-bhara rahega!`
                : `1. 🌿 Add Urea (${soilData.fertilizers[0]}) to boost nitrogen and improve crop greenness.`
            );
        }
        if (soilData.ph > 7.8) {
            tips.push(lang === "hi"
                ? "2. 🧪 pH zyada hai — Gypsum ya Sulphur milana mitti ko sahi karega."
                : "2. 🧪 pH is high — add Gypsum or Sulphur to neutralize soil alkalinity."
            );
        }
        if (soilData.organic_matter < 1.0) {
            tips.push(lang === "hi"
                ? "3. 🐄 Gobar khad 2-3 ton/acre milayein — organic matter badhega aur mitti ka structure theek hoga!"
                : "3. 🐄 Add 2-3 ton/acre FYM — improves organic matter and soil structure significantly."
            );
        }
        return tips.join("\n\n") || (lang === "hi"
            ? "Aapki mitti ki sthiti theek hai! Regular mitti janch karte rahein. ✅"
            : "Your soil condition is decent! Keep doing regular soil testing. ✅"
        );
    }

    if (!soilData) {
        return (
            <div style={{
                position: "fixed", inset: 0, zIndex: 1000,
                background: "rgba(0,0,0,0.5)",
                display: "flex", alignItems: "center",
                justifyContent: "center",
            }}>
                <div style={{
                    background: "white", borderRadius: "20px",
                    padding: "40px", textAlign: "center",
                }}>
                    <div style={{ fontSize: "48px" }}>🔬</div>
                    <p>Loading soil data...</p>
                    <button onClick={onClose} style={{
                        marginTop: "20px",
                        padding: "10px 20px",
                        background: "#1A3C2E",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        cursor: "pointer"
                    }}>Close</button>
                </div>
            </div>
        );
    }

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
                width: "100%", maxWidth: "700px",
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
                            🔬 Soil Health Card
                        </h2>
                        <p style={{
                            color: "#A8D5BB", fontSize: "12px",
                            margin: "4px 0 0",
                        }}>
                            {lang === "hi"
                                ? "Mitti Ki Jaankari + AI Fertilizer Salah"
                                : "Soil Analysis + AI Fertilizer Advice"}
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

                {/* SELECTORS */}
                <div style={{
                    background: "#F5F0E8", padding: "14px 24px",
                    borderBottom: "1px solid #E8E0D0",
                    display: "flex", gap: "12px", flexWrap: "wrap",
                }}>
                    <div>
                        <label style={{
                            fontSize: "11px", color: "#888",
                            fontWeight: 700, display: "block",
                            marginBottom: "4px", textTransform: "uppercase",
                        }}>
                            {lang === "hi" ? "Rajya" : "State"}
                        </label>
                        <select
                            value={state}
                            onChange={e => setState(e.target.value)}
                            style={{
                                padding: "8px 12px", borderRadius: "10px",
                                border: "1.5px solid #E8E0D0",
                                background: "white", fontSize: "13px",
                                fontWeight: 700, color: "#1A3C2E",
                                outline: "none", cursor: "pointer",
                            }}
                        >
                            {Object.keys(SOIL_DATABASE).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{
                            fontSize: "11px", color: "#888",
                            fontWeight: 700, display: "block",
                            marginBottom: "4px", textTransform: "uppercase",
                        }}>
                            {lang === "hi" ? "Zila" : "District"}
                        </label>
                        <select
                            value={district}
                            onChange={e => {
                                setDistrict(e.target.value);
                                setAiAdvice("");
                            }}
                            style={{
                                padding: "8px 12px", borderRadius: "10px",
                                border: "1.5px solid #E8E0D0",
                                background: "white", fontSize: "13px",
                                fontWeight: 700, color: "#1A3C2E",
                                outline: "none", cursor: "pointer",
                            }}
                        >
                            {districts.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{ padding: "20px 24px" }}>

                    {/* SOIL TYPE CARD */}
                    <div style={{
                        background: "linear-gradient(135deg,#1A3C2E,#2D6A4F)",
                        borderRadius: "16px", padding: "18px",
                        marginBottom: "16px", color: "white",
                        display: "flex", gap: "16px",
                        alignItems: "center",
                    }}>
                        <span style={{ fontSize: "40px" }}>🪨</span>
                        <div>
                            <div style={{
                                fontSize: "10px", color: "#A8D5BB",
                                fontWeight: 700, textTransform: "uppercase",
                                letterSpacing: "1px",
                            }}>
                                {lang === "hi" ? "Mitti Ka Prakar" : "Soil Type"}
                            </div>
                            <div style={{
                                fontSize: "20px", fontWeight: 800,
                                color: "white", marginTop: "4px",
                            }}>
                                {lang === "hi"
                                    ? soilData.soil_type_hi
                                    : soilData.soil_type}
                            </div>
                            <div style={{
                                fontSize: "12px", color: "#A8D5BB",
                                marginTop: "4px",
                            }}>
                                📍 {district}, {state}
                                {" • "}pH: {soilData.ph}
                                {" • "}Organic Matter: {soilData.organic_matter}%
                            </div>
                        </div>
                    </div>

                    {/* NUTRIENTS */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3,1fr)",
                        gap: "10px", marginBottom: "16px",
                    }}>
                        {[
                            { label: "Nitrogen (N)", label_hi: "नाइट्रोजन", val: soilData.nitrogen, icon: "🌿" },
                            { label: "Phosphorus (P)", label_hi: "फॉस्फोरस", val: soilData.phosphorus, icon: "🔵" },
                            { label: "Potassium (K)", label_hi: "पोटेशियम", val: soilData.potassium, icon: "🟡" },
                        ].map(n => {
                            const c = LEVEL_COLOR[n.val];
                            return (
                                <div key={n.label} style={{
                                    background: c.bg,
                                    border: `1.5px solid ${c.text}33`,
                                    borderRadius: "12px",
                                    padding: "14px",
                                    textAlign: "center",
                                }}>
                                    <div style={{ fontSize: "22px" }}>
                                        {n.icon}
                                    </div>
                                    <div style={{
                                        fontSize: "10px", color: "#888",
                                        fontWeight: 700, textTransform: "uppercase",
                                        margin: "6px 0 4px",
                                    }}>
                                        {lang === "hi" ? n.label_hi : n.label}
                                    </div>
                                    <div style={{
                                        fontSize: "16px", fontWeight: 800,
                                        color: c.text,
                                        display: "flex", alignItems: "center",
                                        justifyContent: "center", gap: "4px",
                                    }}>
                                        {c.icon} {lang === "hi"
                                            ? n.val === "Low" ? "कम"
                                                : n.val === "Medium" ? "मध्यम"
                                                    : "अच्छा"
                                            : n.val}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* pH BAR */}
                    <div style={{
                        background: "#F5F0E8", borderRadius: "12px",
                        padding: "14px 16px", marginBottom: "16px",
                    }}>
                        <div style={{
                            display: "flex", justifyContent: "space-between",
                            marginBottom: "8px",
                        }}>
                            <span style={{
                                fontSize: "12px", fontWeight: 700,
                                color: "#1A3C2E",
                            }}>
                                🧪 pH {lang === "hi"
                                    ? "Matra" : "Level"}: {soilData.ph}
                            </span>
                            <span style={{
                                fontSize: "11px", fontWeight: 700,
                                color: soilData.ph < 6.5
                                    ? "#DC2626"
                                    : soilData.ph > 7.5
                                        ? "#D97706"
                                        : "#16A34A",
                            }}>
                                {soilData.ph < 6.5
                                    ? lang === "hi" ? "Amliय (Acidic)" : "Acidic"
                                    : soilData.ph > 7.5
                                        ? lang === "hi" ? "Kshariy (Alkaline)" : "Alkaline"
                                        : lang === "hi" ? "Theek (Neutral) ✅" : "Neutral ✅"}
                            </span>
                        </div>
                        {/* pH scale bar */}
                        <div style={{ position: "relative" }}>
                            <div style={{
                                height: "12px",
                                background: "linear-gradient(90deg,#DC2626,#F59E0B,#22C55E,#3B82F6,#8B5CF6)",
                                borderRadius: "8px",
                            }} />
                            <div style={{
                                position: "absolute", top: "-4px",
                                left: `${((soilData.ph - 4) / 10) * 100}%`,
                                width: "20px", height: "20px",
                                background: "white",
                                border: "3px solid #1A3C2E",
                                borderRadius: "50%",
                                transform: "translateX(-50%)",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                            }} />
                            <div style={{
                                display: "flex", justifyContent: "space-between",
                                marginTop: "8px", fontSize: "10px", color: "#888",
                            }}>
                                <span>4 (Acidic)</span>
                                <span>7 (Neutral)</span>
                                <span>14 (Alkaline)</span>
                            </div>
                        </div>
                    </div>

                    {/* PROBLEMS */}
                    {soilData.problems.length > 0 && (
                        <div style={{
                            background: "#FFF0F0",
                            border: "1.5px solid #EF444433",
                            borderRadius: "12px",
                            padding: "14px 16px", marginBottom: "16px",
                        }}>
                            <div style={{
                                fontWeight: 700, fontSize: "12px",
                                color: "#DC2626", marginBottom: "8px",
                            }}>
                                ⚠️ {lang === "hi"
                                    ? "Mitti Ki Samasya"
                                    : "Soil Problems"}
                            </div>
                            <div style={{
                                display: "flex", flexWrap: "wrap",
                                gap: "6px",
                            }}>
                                {(lang === "hi"
                                    ? soilData.problems_hi
                                    : soilData.problems
                                ).map((p, i) => (
                                    <span key={i} style={{
                                        background: "white",
                                        border: "1px solid #FCA5A5",
                                        borderRadius: "20px",
                                        padding: "3px 10px",
                                        fontSize: "11px", color: "#DC2626",
                                    }}>
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* BEST CROPS + AVOID */}
                    <div style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr",
                        gap: "12px", marginBottom: "16px",
                    }}>
                        <div style={{
                            background: "#F0FFF4",
                            border: "1.5px solid #22C55E33",
                            borderRadius: "12px", padding: "14px",
                        }}>
                            <div style={{
                                fontWeight: 700, fontSize: "12px",
                                color: "#16A34A", marginBottom: "8px",
                            }}>
                                ✅ {lang === "hi"
                                    ? "Is Mitti Ki Best Fasal"
                                    : "Best Crops for This Soil"}
                            </div>
                            <div style={{
                                display: "flex", flexWrap: "wrap",
                                gap: "5px",
                            }}>
                                {(lang === "hi"
                                    ? soilData.best_crops_hi
                                    : soilData.best_crops
                                ).map((c, i) => (
                                    <span key={i} style={{
                                        background: "#22C55E",
                                        color: "white",
                                        borderRadius: "20px",
                                        padding: "3px 10px",
                                        fontSize: "11px", fontWeight: 700,
                                    }}>
                                        {c}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div style={{
                            background: "#FFF0F0",
                            border: "1.5px solid #EF444433",
                            borderRadius: "12px", padding: "14px",
                        }}>
                            <div style={{
                                fontWeight: 700, fontSize: "12px",
                                color: "#DC2626", marginBottom: "8px",
                            }}>
                                ❌ {lang === "hi"
                                    ? "Ye Fasal Mat Ugaao"
                                    : "Avoid These Crops"}
                            </div>
                            <div style={{
                                display: "flex", flexWrap: "wrap",
                                gap: "5px",
                            }}>
                                {(lang === "hi"
                                    ? soilData.avoid_crops_hi
                                    : soilData.avoid_crops
                                ).map((c, i) => (
                                    <span key={i} style={{
                                        background: "#EF4444",
                                        color: "white",
                                        borderRadius: "20px",
                                        padding: "3px 10px",
                                        fontSize: "11px", fontWeight: 700,
                                    }}>
                                        {c}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* FERTILIZER RECOMMENDATIONS */}
                    <div style={{
                        background: "#FFFBEB",
                        border: "1.5px solid #F59E0B33",
                        borderRadius: "12px",
                        padding: "14px 16px", marginBottom: "16px",
                    }}>
                        <div style={{
                            fontWeight: 700, fontSize: "12px",
                            color: "#D97706", marginBottom: "10px",
                        }}>
                            🌱 {lang === "hi"
                                ? "Recommended Fertilizers"
                                : "Recommended Fertilizers"}
                        </div>
                        {(lang === "hi"
                            ? soilData.fertilizers_hi
                            : soilData.fertilizers
                        ).map((f, i) => (
                            <div key={i} style={{
                                display: "flex", gap: "8px",
                                alignItems: "center",
                                padding: "6px 0",
                                borderBottom: i < soilData.fertilizers.length - 1
                                    ? "1px solid #FDE68A"
                                    : "none",
                            }}>
                                <span style={{
                                    background: "#F59E0B",
                                    color: "white",
                                    borderRadius: "50%",
                                    width: "20px", height: "20px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "10px", fontWeight: 800,
                                    flexShrink: 0,
                                }}>
                                    {i + 1}
                                </span>
                                <span style={{
                                    fontSize: "12px", color: "#92400E",
                                    fontWeight: 600,
                                }}>
                                    {f}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* AI ADVICE BUTTON */}
                    <button
                        onClick={generateAIAdvice}
                        disabled={aiLoading}
                        style={{
                            width: "100%", padding: "14px",
                            background: aiLoading
                                ? "#ccc"
                                : "linear-gradient(135deg,#1A3C2E,#2D6A4F)",
                            color: "white", border: "none",
                            borderRadius: "12px", fontSize: "14px",
                            fontWeight: 800, cursor: aiLoading
                                ? "not-allowed" : "pointer",
                            marginBottom: aiAdvice ? "12px" : "0",
                            transition: "transform 0.1s active",
                            boxShadow: "0 4px 12px rgba(20,83,45,0.2)"
                        }}
                    >
                        {aiLoading
                            ? "🤖 AI Salah Taiyaar Ho Rahi Hai..."
                            : "🤖 AI Se Personalized Salah Lein"}
                    </button>

                    {/* AI ADVICE OUTPUT */}
                    {aiAdvice && (
                        <div style={{
                            background: "linear-gradient(135deg,#1A3C2E,#2D6A4F)",
                            borderRadius: "14px", padding: "16px 18px",
                            color: "white",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                            animation: "slideUp 0.3s ease-out"
                        }}>
                            <div style={{
                                display: "flex", gap: "10px",
                                alignItems: "flex-start",
                            }}>
                                <span style={{ fontSize: "24px" }}>
                                    🤖
                                </span>
                                <div>
                                    <div style={{
                                        fontSize: "11px", color: "#A8D5BB",
                                        fontWeight: 700, marginBottom: "8px",
                                        textTransform: "uppercase",
                                    }}>
                                        {lang === "hi"
                                            ? "AI Ki Khas Salah — Aapki Mitti Ke Liye"
                                            : "AI Personalized Advice — For Your Soil"}
                                    </div>
                                    <div style={{
                                        fontSize: "13px", lineHeight: 1.7,
                                        whiteSpace: "pre-line",
                                    }}>
                                        {aiAdvice}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* GOVT LINK */}
                    <a
                        href="https://soilhealth.dac.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: "block", marginTop: "12px",
                            background: "#F5F0E8",
                            border: "1.5px solid #E8E0D0",
                            color: "#1A3C2E", textAlign: "center",
                            padding: "12px", borderRadius: "12px",
                            textDecoration: "none", fontSize: "13px",
                            fontWeight: 700,
                            transition: "all 0.2s"
                        }}
                    >
                        🏛️ {lang === "hi"
                            ? "Govt Soil Testing Center Dhundhen →"
                            : "Find Govt Soil Testing Center →"}
                        soilhealth.dac.gov.in 🔗
                    </a>
                </div>
            </div>
            <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}

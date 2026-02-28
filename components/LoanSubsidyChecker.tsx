"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    checkEligibility,
    FarmerProfile,
    SchemeResult,
    buildSMSSummary,
} from "@/lib/schemeEngine";

const TYPE_COLORS: Record<string, {
    bg: string; border: string;
    badge: string; icon: string
}> = {
    subsidy: { bg: "#F0FFF4", border: "#22C55E", badge: "#22C55E", icon: "💰" },
    loan: { bg: "#EFF6FF", border: "#3B82F6", badge: "#3B82F6", icon: "🏦" },
    insurance: { bg: "#FFFBEB", border: "#F59E0B", badge: "#F59E0B", icon: "🛡️" },
    service: { bg: "#F5F0FF", border: "#8B5CF6", badge: "#8B5CF6", icon: "🔬" },
    loan_waiver: { bg: "#FFF0F0", border: "#EF4444", badge: "#EF4444", icon: "✂️" },
    price_support: { bg: "#F0FFFE", border: "#14B8A6", badge: "#14B8A6", icon: "📊" },
};

export default function LoanSubsidyChecker({
    farmerProfile,
    onClose,
}: {
    farmerProfile: any;
    onClose: () => void;
}) {
    // Auto-fill priority: auth user object -> MongoDB farmers (passed as farmerProfile) -> localStorage -> Empty
    const [farmer, setFarmer] =
        useState<FarmerProfile>({
            name: "",
            state: "",
            land_acres: 0,
            crops: [],
            revenue: 0,
            has_aadhaar: true,
            has_bank: true,
        });

    const [results, setResults] =
        useState<SchemeResult[]>([]);
    const [checked, setChecked] =
        useState(false);
    const [loading, setLoading] =
        useState(false);
    const [lang, setLang] =
        useState<"hi" | "en">("hi");
    const [filter, setFilter] =
        useState<"all" | "eligible">("eligible");
    const [smsSent, setSmsSent] =
        useState(false);
    const [editing, setEditing] =
        useState(false);

    // Auto-fill logic on mount
    useEffect(() => {
        // 1 & 2: Priority is farmerProfile (which should combine auth + DB data from parent)
        const storedData = typeof window !== "undefined" ? localStorage.getItem("farmer_profile_backup") : null;
        const local = storedData ? JSON.parse(storedData) : null;

        const mergedProfile = {
            name: farmerProfile?.name || local?.name || "",
            state: farmerProfile?.state || local?.state || "",
            land_acres: farmerProfile?.landSize ||
                farmerProfile?.land_acres ||
                local?.land_acres || 0,
            crops: farmerProfile?.crops?.map(
                (c: any) => c.cropName || c
            ) || local?.crops || [],
            revenue: farmerProfile?.revenue ||
                farmerProfile?.totalRevenue ||
                local?.revenue || 0,
            has_aadhaar: true,
            has_bank: true,
        };

        console.log("Farmer profile:", mergedProfile);
        setFarmer(mergedProfile);

        // Auto-check if enough info exists
        if (mergedProfile.state && mergedProfile.land_acres > 0) {
            handleCheck(mergedProfile);
        }
    }, [farmerProfile]);

    // ESC Key listener
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    function handleCheck(p: FarmerProfile = farmer) {
        setLoading(true);
        // Save to localStorage for priority 3 fallback
        localStorage.setItem("farmer_profile_backup", JSON.stringify(p));

        setTimeout(() => {
            const res = checkEligibility(p);
            setResults(res);
            setChecked(true);
            setLoading(false);
        }, 800);
    }

    async function handleSendSMS() {
        if (!farmerProfile?.phone) {
            alert("Phone number profile mein nahi hai. SMS nahi bheja ja sakta.");
            return;
        }

        try {
            const msg = buildSMSSummary(
                farmer.name, results
            );
            const res = await fetch("/api/alerts/sms", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: msg,
                    phone: farmerProfile.phone,
                }),
            });
            if (res.ok) {
                setSmsSent(true);
            } else {
                alert("SMS send nahi ho pa rahi. Thodi der mein try karein.");
            }
        } catch {
            alert("SMS send nahi ho pa rahi. Thodi der mein try karein.");
        }
    }

    const eligibleCount = results.filter(
        r => r.result === "eligible"
    ).length;

    const displayResults = filter === "eligible"
        ? results.filter(r => r.result === "eligible")
        : results;

    return (
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                background: "rgba(0,0,0,0.5)",
                overflowY: "auto",
                padding: "20px",
                backdropFilter: "blur(4px)",
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{
                    background: "white",
                    borderRadius: "20px",
                    width: "100%",
                    maxWidth: "680px",
                    overflow: "hidden",
                    boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
                    margin: "auto",
                }}
            >
                {/* ── HEADER ──────────────────── */}
                <div style={{
                    background: "linear-gradient(135deg, #1A3C2E, #2D6A4F)",
                    padding: "20px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                }}>
                    <div>
                        <h2 style={{
                            color: "white",
                            fontSize: "20px",
                            fontWeight: 800,
                            margin: 0,
                        }}>
                            💰 Loan & Subsidy Checker
                        </h2>
                        <p style={{
                            color: "#A8D5BB",
                            fontSize: "12px",
                            margin: "4px 0 0",
                        }}>
                            {lang === "hi"
                                ? "Sarkari yojanaon ki jaankari — aapke liye"
                                : "Government schemes — personalized for you"}
                        </p>
                    </div>
                    <div style={{
                        display: "flex", gap: "8px",
                        alignItems: "center"
                    }}>
                        {/* Lang toggle */}
                        <div style={{
                            display: "flex",
                            background: "rgba(255,255,255,0.1)",
                            borderRadius: "20px",
                            padding: "3px",
                        }}>
                            {(["hi", "en"] as const).map(l => (
                                <button
                                    key={l}
                                    onClick={() => setLang(l)}
                                    style={{
                                        padding: "4px 12px",
                                        borderRadius: "20px",
                                        border: "none",
                                        cursor: "pointer",
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        background: lang === l
                                            ? "white" : "transparent",
                                        color: lang === l
                                            ? "#1A3C2E" : "rgba(255,255,255,0.7)",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {l === "hi" ? "हिं" : "EN"}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: "rgba(255,255,255,0.15)",
                                border: "none",
                                color: "white",
                                borderRadius: "10px",
                                padding: "8px 12px",
                                cursor: "pointer",
                                fontSize: "16px",
                            }}
                        >✕</button>
                    </div>
                </div>

                {/* ── FARMER PROFILE CARD ──────── */}
                <div style={{
                    background: "#F5F0E8",
                    padding: "16px 24px",
                    borderBottom: "1px solid #E8E0D0",
                }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: editing ? "14px" : "0",
                    }}>
                        <div style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#1A3C2E",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                        }}>
                            👨🌾 {lang === "hi"
                                ? "Aapki Jaankari"
                                : "Your Profile"}
                        </div>
                        <button
                            onClick={() => setEditing(!editing)}
                            style={{
                                background: "white",
                                border: "1px solid #E8E0D0",
                                borderRadius: "8px",
                                padding: "5px 12px",
                                fontSize: "11px",
                                cursor: "pointer",
                                color: "#1A3C2E",
                                fontWeight: 700,
                            }}
                        >
                            {editing ? "✓ Done" : "✏️ Edit"}
                        </button>
                    </div>

                    {!editing ? (
                        /* View mode */
                        <div style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "10px",
                            marginTop: "10px",
                        }}>
                            {[
                                { label: "Naam", value: farmer.name },
                                { label: "State", value: farmer.state },
                                { label: "Zameen", value: `${farmer.land_acres} acres` },
                                { label: "Revenue", value: `₹${farmer.revenue.toLocaleString()}` },
                                { label: "Fasal", value: farmer.crops.join(", ") || "N/A" },
                            ].map(item => (
                                <div
                                    key={item.label}
                                    style={{
                                        background: "white",
                                        border: "1px solid #E8E0D0",
                                        borderRadius: "10px",
                                        padding: "8px 14px",
                                    }}
                                >
                                    <div style={{
                                        fontSize: "10px",
                                        color: "#888",
                                        fontWeight: 700,
                                        textTransform: "uppercase",
                                    }}>
                                        {item.label}
                                    </div>
                                    <div style={{
                                        fontSize: "13px",
                                        fontWeight: 700,
                                        color: "#1A3C2E",
                                        marginTop: "2px",
                                    }}>
                                        {item.value || "—"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Edit mode */
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "10px",
                            marginTop: "10px",
                        }}>
                            {[
                                { key: "name", label: "Naam", type: "text", placeholder: "Aapka naam" },
                                { key: "state", label: "State", type: "text", placeholder: "UP / MP / Maharashtra" },
                                { key: "land_acres", label: "Zameen (acres)", type: "number", placeholder: "3.5" },
                                { key: "revenue", label: "Revenue (₹)", type: "number", placeholder: "100000" },
                            ].map(field => (
                                <div key={field.key}>
                                    <label style={{
                                        fontSize: "11px",
                                        color: "#888",
                                        fontWeight: 700,
                                        display: "block",
                                        marginBottom: "4px",
                                    }}>
                                        {field.label}
                                    </label>
                                    <input
                                        type={field.type}
                                        value={
                                            (farmer as any)[field.key]
                                        }
                                        placeholder={field.placeholder}
                                        onChange={e => setFarmer({
                                            ...farmer,
                                            [field.key]:
                                                field.type === "number"
                                                    ? Number(e.target.value)
                                                    : e.target.value,
                                        })}
                                        style={{
                                            width: "100%",
                                            padding: "9px 12px",
                                            border: "1.5px solid #E8E0D0",
                                            borderRadius: "10px",
                                            fontSize: "13px",
                                            outline: "none",
                                            fontFamily: "inherit",
                                            background: "white",
                                            boxSizing: "border-box",
                                        }}
                                    />
                                </div>
                            ))}
                            <div style={{ gridColumn: "span 1" }}>
                                <label style={{
                                    fontSize: "11px", color: "#888",
                                    fontWeight: 700, display: "block",
                                    marginBottom: "4px",
                                }}>
                                    Fasalein (comma se alag karein)
                                </label>
                                <input
                                    type="text"
                                    value={farmer.crops.join(", ")}
                                    placeholder="Wheat, Rice, Mustard"
                                    onChange={e => setFarmer({
                                        ...farmer,
                                        crops: e.target.value
                                            .split(",")
                                            .map(s => s.trim())
                                            .filter(Boolean),
                                    })}
                                    style={{
                                        width: "100%",
                                        padding: "9px 12px",
                                        border: "1.5px solid #E8E0D0",
                                        borderRadius: "10px",
                                        fontSize: "13px",
                                        outline: "none",
                                        fontFamily: "inherit",
                                        background: "white",
                                        boxSizing: "border-box",
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Check button */}
                    <button
                        onClick={() => handleCheck()}
                        disabled={loading}
                        style={{
                            marginTop: "14px",
                            width: "100%",
                            padding: "13px",
                            background: loading
                                ? "#ccc" : "#1A3C2E",
                            color: "white",
                            border: "none",
                            borderRadius: "12px",
                            fontSize: "14px",
                            fontWeight: 800,
                            cursor: loading
                                ? "not-allowed" : "pointer",
                            transition: "all 0.2s",
                        }}
                    >
                        {loading
                            ? "🔄 Check ho raha hai..."
                            : "🔍 Yojana Check Karein"}
                    </button>
                </div>

                {/* ── RESULTS ─────────────────── */}
                <AnimatePresence>
                    {checked && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            style={{ padding: "20px 24px" }}
                        >

                            {/* Summary banner */}
                            <div style={{
                                background: eligibleCount > 0
                                    ? "linear-gradient(135deg,#1A3C2E,#2D6A4F)"
                                    : "#FFF0F0",
                                borderRadius: "14px",
                                padding: "16px 20px",
                                marginBottom: "16px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}>
                                <div>
                                    <div style={{
                                        color: "white",
                                        fontWeight: 800,
                                        fontSize: "16px",
                                    }}>
                                        🎉 {eligibleCount} yojanaon ke liye
                                        <br />eligible hain aap!
                                    </div>
                                    <div style={{
                                        color: "#A8D5BB",
                                        fontSize: "12px",
                                        marginTop: "4px",
                                    }}>
                                        {results.length - eligibleCount} schemes mein eligible nahi
                                    </div>
                                </div>
                                <div style={{
                                    background: "rgba(255,255,255,0.15)",
                                    borderRadius: "12px",
                                    padding: "10px 16px",
                                    textAlign: "center",
                                }}>
                                    <div style={{
                                        fontSize: "28px",
                                        fontWeight: 800,
                                        color: "white",
                                    }}>
                                        {eligibleCount}
                                    </div>
                                    <div style={{
                                        fontSize: "10px",
                                        color: "#A8D5BB",
                                        fontWeight: 700,
                                    }}>
                                        ELIGIBLE
                                    </div>
                                </div>
                            </div>

                            {/* Filter tabs */}
                            <div style={{
                                display: "flex",
                                gap: "8px",
                                marginBottom: "14px",
                            }}>
                                {[
                                    { key: "eligible", label: `✅ Eligible (${eligibleCount})` },
                                    { key: "all", label: `📋 Sab (${results.length})` },
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() =>
                                            setFilter(tab.key as any)
                                        }
                                        style={{
                                            padding: "8px 16px",
                                            borderRadius: "20px",
                                            border: "1.5px solid",
                                            borderColor: filter === tab.key
                                                ? "#1A3C2E" : "#E8E0D0",
                                            background: filter === tab.key
                                                ? "#1A3C2E" : "white",
                                            color: filter === tab.key
                                                ? "white" : "#888",
                                            fontSize: "12px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Scheme cards */}
                            <div style={{
                                maxHeight: "400px",
                                overflowY: "auto",
                                paddingRight: "4px",
                            }}>
                                {displayResults.map(result => {
                                    const s = result.scheme;
                                    const col = TYPE_COLORS[s.type]
                                        || TYPE_COLORS.subsidy;
                                    const isEligible =
                                        result.result === "eligible";

                                    return (
                                        <div
                                            key={s.id}
                                            style={{
                                                background: isEligible
                                                    ? col.bg : "#FAFAFA",
                                                border: `1.5px solid ${isEligible
                                                    ? col.border : "#EEE"
                                                    }`,
                                                borderRadius: "14px",
                                                padding: "16px",
                                                marginBottom: "10px",
                                                opacity: isEligible
                                                    ? 1 : 0.6,
                                            }}
                                        >
                                            {/* Card header */}
                                            <div style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                                marginBottom: "10px",
                                            }}>
                                                <div style={{
                                                    display: "flex",
                                                    gap: "10px",
                                                    alignItems: "flex-start",
                                                    flex: 1,
                                                }}>
                                                    <span style={{
                                                        fontSize: "24px"
                                                    }}>
                                                        {col.icon}
                                                    </span>
                                                    <div>
                                                        <div style={{
                                                            fontWeight: 800,
                                                            fontSize: "14px",
                                                            color: "#1A3C2E",
                                                        }}>
                                                            {lang === "hi"
                                                                ? s.name_hi
                                                                : s.name}
                                                        </div>
                                                        <div style={{
                                                            fontSize: "11px",
                                                            color: "#888",
                                                            marginTop: "2px",
                                                        }}>
                                                            {lang === "hi"
                                                                ? s.name
                                                                : s.name_hi}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "flex-end",
                                                    gap: "4px",
                                                }}>
                                                    <span style={{
                                                        background: col.badge,
                                                        color: "white",
                                                        padding: "3px 10px",
                                                        borderRadius: "20px",
                                                        fontSize: "9px",
                                                        fontWeight: 800,
                                                        textTransform: "uppercase",
                                                    }}>
                                                        {s.type.replace("_", " ")}
                                                    </span>
                                                    {isEligible && (
                                                        <span style={{
                                                            background: "#1A3C2E",
                                                            color: "white",
                                                            padding: "3px 10px",
                                                            borderRadius: "20px",
                                                            fontSize: "9px",
                                                            fontWeight: 800,
                                                        }}>
                                                            ✅ ELIGIBLE
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Benefit highlight */}
                                            <div style={{
                                                background: "rgba(26,60,46,0.07)",
                                                borderRadius: "10px",
                                                padding: "10px 14px",
                                                marginBottom: "10px",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}>
                                                <div>
                                                    <div style={{
                                                        fontSize: "10px",
                                                        color: "#888",
                                                        fontWeight: 700,
                                                        textTransform: "uppercase",
                                                    }}>
                                                        {lang === "hi"
                                                            ? "फायदा" : "Benefit"}
                                                    </div>
                                                    <div style={{
                                                        fontSize: "13px",
                                                        fontWeight: 700,
                                                        color: "#1A3C2E",
                                                        marginTop: "2px",
                                                    }}>
                                                        {lang === "hi"
                                                            ? s.benefit_hi
                                                            : s.benefit}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    fontSize: "18px",
                                                    fontWeight: 800,
                                                    color: col.badge,
                                                }}>
                                                    {s.max_benefit}
                                                </div>
                                            </div>

                                            {/* Deadline warning */}
                                            {result.deadline_urgent && (
                                                <div style={{
                                                    background: "#FFF3CD",
                                                    border: "1px solid #F59E0B",
                                                    borderRadius: "8px",
                                                    padding: "8px 12px",
                                                    marginBottom: "10px",
                                                    fontSize: "12px",
                                                    color: "#92400E",
                                                    fontWeight: 600,
                                                    display: "flex",
                                                    gap: "6px",
                                                }}>
                                                    <span>⏰</span>
                                                    <span>
                                                        {lang === "hi"
                                                            ? `JALDI: ${s.deadline_hi}`
                                                            : `URGENT: ${s.deadline}`}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Not eligible reasons */}
                                            {!isEligible &&
                                                result.reasons.length > 0 && (
                                                    <div style={{
                                                        background: "#FFF0F0",
                                                        borderRadius: "8px",
                                                        padding: "8px 12px",
                                                        marginBottom: "10px",
                                                        fontSize: "11px",
                                                        color: "#CC0000",
                                                    }}>
                                                        ❌ {lang === "hi"
                                                            ? result.reasons_hi[0]
                                                            : result.reasons[0]}
                                                    </div>
                                                )}

                                            {/* Documents needed */}
                                            {isEligible && (
                                                <div style={{
                                                    marginBottom: "10px",
                                                    fontSize: "11px",
                                                    color: "#666",
                                                }}>
                                                    <span style={{ fontWeight: 700 }}>
                                                        📄 {lang === "hi"
                                                            ? "मांग पत्र: "
                                                            : "Documents: "}
                                                    </span>
                                                    {(lang === "hi"
                                                        ? s.documents_hi
                                                        : s.documents
                                                    ).join(" • ")}
                                                </div>
                                            )}

                                            {/* Apply button */}
                                            {isEligible && (
                                                <a
                                                    href={s.apply_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: "block",
                                                        background: "#1A3C2E",
                                                        color: "white",
                                                        textAlign: "center",
                                                        padding: "11px",
                                                        borderRadius: "10px",
                                                        textDecoration: "none",
                                                        fontSize: "13px",
                                                        fontWeight: 800,
                                                        transition: "all 0.2s",
                                                    }}
                                                >
                                                    Apply Now → {s.name} 🔗
                                                </a>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* SMS Button */}
                            {eligibleCount > 0 && (
                                <button
                                    onClick={handleSendSMS}
                                    disabled={smsSent}
                                    style={{
                                        width: "100%",
                                        marginTop: "14px",
                                        padding: "13px",
                                        background: smsSent
                                            ? "#22C55E" : "#F5F0E8",
                                        color: smsSent
                                            ? "white" : "#1A3C2E",
                                        border: "1.5px solid #E8E0D0",
                                        borderRadius: "12px",
                                        fontSize: "13px",
                                        fontWeight: 800,
                                        cursor: smsSent
                                            ? "not-allowed" : "pointer",
                                    }}
                                >
                                    {smsSent
                                        ? "✅ SMS Bhej Diya!"
                                        : "📱 SMS Summary Bhejein"}
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

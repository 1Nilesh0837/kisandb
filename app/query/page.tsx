"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Send, Lightbulb, Loader2, Sparkles, AlertCircle, TrendingUp, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function QueryPage() {
    const { language, t } = useLanguage();
    const { token } = useAuth();
    const [isListening, setIsListening] = useState(false);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);

    // Initialize Web Speech API
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;

                recognitionRef.current.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setQuery(transcript);
                    setIsListening(false);
                    handleSend(transcript);
                };

                recognitionRef.current.onerror = () => {
                    setIsListening(false);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            }
        }
    }, []);

    // Update recognition language dynamically
    useEffect(() => {
        if (recognitionRef.current) {
            recognitionRef.current.lang = language === "hi" ? "hi-IN" : "en-US";
        }
    }, [language]);

    const handleMicClick = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition not supported in this browser.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    const handleSend = async (q: string = query) => {
        if (!q.trim()) return;
        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const res = await fetch("/api/query", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ query: q }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Server error");
                return;
            }

            if (data.success) {
                setResult(data);
            } else {
                setError(data.error || t.noData);
            }
        } catch (err) {
            console.error(err);
            setError(t.noData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* 🎯 Header Section */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-black text-[#14532D] tracking-tight">
                    {t.queryPageTitle}
                </h1>
                <p className="text-gray-500 text-lg font-medium">
                    {t.queryPageSub}
                </p>
            </div>

            {/* 🎤 Input Area Card */}
            <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-xl shadow-[#14532D]/5 border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#22C55E]/20 to-transparent" />

                <div className="space-y-6">
                    <div className="relative">
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder={t.queryPlaceholder}
                            className="w-full bg-[#F8FAFC] border-2 border-gray-100 rounded-3xl p-6 pr-16 text-lg font-medium text-gray-800 focus:outline-none focus:border-[#14532D]/30 focus:ring-4 focus:ring-[#14532D]/5 transition-all min-h-[160px] resize-none placeholder:text-gray-300"
                        />
                        <div className="absolute bottom-5 right-5 flex items-center gap-3">
                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest hidden sm:block">
                                {query.length > 0 ? `${query.length} chars` : "Type or Talk"}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => handleSend()}
                            disabled={loading || !query.trim()}
                            className="flex-1 bg-[#14532D] text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-[#14532D]/20 hover:bg-[#14532D]/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                <>
                                    <Send size={22} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    {t.askButton}
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleMicClick}
                            className={`px-8 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all border-2 ${isListening
                                ? "bg-red-50 border-red-200 text-red-600 animate-pulse"
                                : "bg-white border-gray-100 text-[#14532D] hover:border-[#14532D]/20 hover:bg-gray-50"
                                }`}
                        >
                            <Mic size={22} fill={isListening ? "currentColor" : "none"} />
                            {isListening ? t.listening : t.recordButton}
                        </button>
                    </div>

                    {/* Quick Suggestions */}
                    <div className="pt-4 space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">
                            <Sparkles size={12} className="text-[#22C55E]" />
                            Suggested Queries
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {t.suggestions.map((suggestion: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => { setQuery(suggestion); handleSend(suggestion); }}
                                    className="bg-[#F8FAFC] hover:bg-[#14532D]/5 border border-gray-100 hover:border-[#14532D]/20 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-[#14532D] transition-all duration-300"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 📊 Result Section */}
            <AnimatePresence mode="wait">
                {loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-4 py-10"
                    >
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-[#14532D]/10 border-t-[#22C55E] rounded-full animate-spin" />
                            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#22C55E] animate-pulse" size={20} />
                        </div>
                        <span className="text-sm text-[#14532D] font-bold tracking-wide">{t.analyzing}</span>
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-50 border border-red-100 p-6 rounded-3xl flex items-center gap-4 text-red-700"
                    >
                        <AlertCircle size={24} />
                        <span className="font-bold">{error}</span>
                    </motion.div>
                )}

                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 overflow-hidden relative">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black text-[#14532D] uppercase tracking-wider">
                                    {result.intent === "price_prediction" ? "🔮 Price Forecast" : result.intent === "mandi_info" ? "🌾 Mandi Live" : t.result}
                                </h3>
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${result.intent === "price_prediction"
                                    ? "bg-amber-100 text-amber-700" : result.intent === "mandi_info" ? "bg-emerald-100 text-emerald-700"
                                        : "bg-[#22C55E]/10 text-[#22C55E]"
                                    }`}>
                                    {result.intent === "price_prediction" ? `Confidence: ${result.prediction?.confidence}%` : result.intent === "mandi_info" ? "Government API Live" : "Verified Data"}
                                </div>
                            </div>

                            {result.intent === "price_prediction" && result.prediction ? (
                                <div className="space-y-8">
                                    <div className="h-[300px] w-full">
                                        <PredictionChart data={result.prediction} />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">🏆 Best Day to Sell</div>
                                            <div className="text-2xl font-black text-amber-600">{result.prediction.bestSellDate}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">💰 Best Expected Price</div>
                                            <div className="text-2xl font-black text-[#14532D]">₹{result.prediction.bestSellPrice.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                            ) : result.intent === "mandi_info" && result.mandiData ? (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">{t.avgPrice}</p>
                                            <p className="text-2xl font-black text-emerald-900">₹{result.mandiData.todayStats?.avgPrice?.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">{t.bestMandi}</p>
                                            <p className="text-xl font-black text-amber-900 truncate">{result.mandiData.highestMandi?.mandi}</p>
                                        </div>
                                        <div className={`p-6 rounded-3xl border ${result.mandiData.priceChange?.trend === 'up' ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
                                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${result.mandiData.priceChange?.trend === 'up' ? 'text-green-600' : 'text-orange-600'}`}>{t.todayTrend}</p>
                                            <p className={`text-2xl font-black ${result.mandiData.priceChange?.trend === 'up' ? 'text-green-900' : 'text-orange-900'}`}>
                                                {result.mandiData.priceChange?.trend === 'up' ? '▲' : '▼'} {Math.abs(result.mandiData.priceChange?.change_pct || 0)}%
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-black text-[#14532D] uppercase tracking-widest">
                                            <MapPin size={16} />
                                            {t.nearbyMandis}
                                        </div>
                                        <div className="overflow-hidden rounded-2xl border border-gray-100">
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Mandi</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-right">Price</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {result.mandiData.nearbyMandis?.slice(0, 5).map((m: any, i: number) => (
                                                        <tr key={i} className="border-t border-gray-100">
                                                            <td className="px-6 py-4 font-bold text-gray-700">{m.mandi}</td>
                                                            <td className="px-6 py-4 font-black text-[#14532D] text-right">₹{m.modalPrice?.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <ResultItem label="Crop" value={result.data?.[0]?.cropName || result.data?.[0]?.crop || "N/A"} />
                                    <ResultItem label="Quantity" value={`${result.data?.[0]?.quantity || "0"} QTL`} />
                                    <ResultItem label="Total Value" value={`₹${(result.data?.[0]?.totalAmount || result.data?.[0]?.total || 0).toLocaleString()}`} />
                                </div>
                            )}

                            {/* Advisory Box - Highlighted */}
                            <div className="mt-10 bg-[#14532D]/5 rounded-2xl p-6 border-l-4 border-[#22C55E]">
                                <div className="flex items-center gap-2 text-[#14532D] font-black text-sm uppercase tracking-widest mb-3">
                                    <Lightbulb size={18} className="text-[#22C55E]" />
                                    {t.aiRecommendation}
                                </div>
                                <p className="text-[#14532D]/80 text-lg font-medium leading-relaxed">
                                    {result.advice || "No specific advice available for this query."}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function PredictionChart({ data }: { data: any }) {
    const chartData = {
        labels: data.predictions.map((p: any) => p.date),
        datasets: [{
            label: "Predicted Price (₹/quintal)",
            data: data.predictions.map((p: any) => p.predictedPrice),
            borderColor: "#14532D",
            backgroundColor: "rgba(20, 83, 45, 0.1)",
            borderWidth: 3,
            pointBackgroundColor: data.predictions.map((p: any) =>
                p.date === data.bestSellDate ? "#D97706" : "#14532D"
            ),
            pointRadius: data.predictions.map((p: any) =>
                p.date === data.bestSellDate ? 8 : 4
            ),
            tension: 0.4,
            fill: true
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "#14532D",
                padding: 12,
                titleFont: { size: 14, weight: "bold" as const },
                bodyFont: { size: 14 },
                callbacks: {
                    label: (context: any) => ` ₹${context.raw}/qtl`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                grid: { color: "rgba(0,0,0,0.05)" },
                ticks: { font: { weight: "bold" as const } }
            },
            x: {
                grid: { display: false },
                ticks: { font: { weight: "bold" as const } }
            }
        }
    };

    return <Line data={chartData} options={options} />;
}

function ResultItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-1">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</div>
            <div className="text-2xl font-black text-gray-900">{value}</div>
        </div>
    );
}

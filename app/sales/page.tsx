"use client";

import { useState, useMemo, useEffect } from "react";
import {
    BarChart3, TrendingUp, DollarSign, Calendar, Search,
    Filter, ArrowUpRight, ArrowDownRight, Package, CheckCircle2, Clock, Plus, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import axios from "axios";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface Sale {
    _id: string;
    cropName: string;
    quantity: number;
    pricePerQuintal: number;
    totalAmount: number;
    profit: number;
    date: string;
    status: string;
}

export default function SalesPage() {
    const { language, t } = useLanguage();
    const { token } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRange, setFilterRange] = useState("All");
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        cropName: "",
        quantity: "",
        pricePerQuintal: "",
        totalAmount: "",
        profit: ""
    });

    useEffect(() => {
        if (token) fetchSales();
    }, [token]);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = async () => {
        if (!formData.cropName || !formData.quantity || !formData.totalAmount) return;

        const payload = {
            cropName: formData.cropName,
            quantity: parseFloat(formData.quantity),
            pricePerQuintal: parseFloat(formData.pricePerQuintal || "0"),
            totalAmount: parseFloat(formData.totalAmount),
            profit: parseFloat(formData.profit || "0"),
            date: new Date(),
            status: "Completed"
        };

        try {
            const res = await axios.post("/api/sales", payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSales([res.data, ...sales]);
            showToast(t.saleRecorded);
            setIsModalOpen(false);
            setFormData({ cropName: "", quantity: "", pricePerQuintal: "", totalAmount: "", profit: "" });
        } catch (error) {
            console.error("Failed to save sale", error);
        }
    };

    const fetchSales = async () => {
        try {
            const res = await axios.get("/api/sales", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSales(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch sales", error);
            setLoading(false);
        }
    };

    const monthlyEarnings = useMemo(() => {
        const earnings = new Array(12).fill(0);
        sales.forEach(sale => {
            const date = new Date(sale.date);
            const month = date.getMonth();
            earnings[month] += sale.totalAmount;
        });
        return earnings;
    }, [sales]);

    const totalRevenueSum = useMemo(() => sales.reduce((acc, s) => acc + s.totalAmount, 0), [sales]);
    const avgEarnings = useMemo(() => totalRevenueSum / (monthlyEarnings.filter(e => e > 0).length || 1), [totalRevenueSum, monthlyEarnings]);

    const highestMonthIdx = useMemo(() => {
        let max = 0;
        let idx = -1;
        monthlyEarnings.forEach((e, i) => {
            if (e > max) {
                max = e;
                idx = i;
            }
        });
        return idx;
    }, [monthlyEarnings]);

    const filteredRecords = useMemo(() => {
        return sales.filter(r => {
            const matchesSearch = r.cropName.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [sales, searchQuery]);

    const chartData = {
        labels: t.months,
        datasets: [
            {
                label: t.earnings,
                data: monthlyEarnings,
                backgroundColor: '#22C55E',
                borderRadius: 8,
                hoverBackgroundColor: '#14532D',
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#14532D',
                padding: 12,
                titleFont: { size: 14, weight: 'bold' as const },
                bodyFont: { size: 13 },
                displayColors: false,
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { weight: 'bold' as const }, color: '#94A3B8' }
            },
            y: {
                grid: { color: '#F1F5F9' },
                ticks: { font: { weight: 'bold' as const }, color: '#94A3B8' }
            },
        },
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-[#14532D] tracking-tight">{t.salesTitle}</h1>
                    <p className="text-gray-500 font-medium">{t.salesSub}</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#14532D] text-white px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#14532D]/20 hover:bg-[#14532D]/90 active:scale-95 transition-all"
                >
                    <Plus size={20} strokeWidth={3} />
                    {t.recordSale}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard
                    title={t.totalRevenue}
                    value={`₹${totalRevenueSum.toLocaleString()}`}
                    subtext={t.thisYear}
                    icon={<DollarSign size={24} />}
                    color="bg-green-50 text-green-600"
                />
                <SummaryCard
                    title={t.highestProfitMonth}
                    value={highestMonthIdx !== -1 ? t.months[highestMonthIdx] : "N/A"}
                    subtext={`₹${highestMonthIdx !== -1 ? monthlyEarnings[highestMonthIdx].toLocaleString() : 0}`}
                    icon={<TrendingUp size={24} />}
                    color="bg-blue-50 text-blue-600"
                />
                <SummaryCard
                    title={t.avgMonthlyEarnings}
                    value={`₹${Math.round(avgEarnings).toLocaleString()}`}
                    subtext={t.thisYear}
                    icon={<BarChart3 size={24} />}
                    color="bg-purple-50 text-purple-600"
                />
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-[#14532D]/5 border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-[#14532D] tracking-tight">{t.monthlyEarningsTitle}</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.month} vs {t.earnings}</p>
                    </div>
                </div>
                <div className="h-[350px]">
                    <Bar data={chartData} options={chartOptions} />
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-[#14532D]/5 overflow-hidden">
                <div className="p-8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-xl font-black text-[#14532D] tracking-tight">{t.salesRecords}</h3>
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder={t.searchSales}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-[#F8FAFC] border-2 border-transparent focus:border-[#22C55E]/20 rounded-xl py-2.5 pl-11 pr-4 text-sm font-bold shadow-sm outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                        <thead className="bg-[#F8FAFC] border-b border-gray-50">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.date}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.crop}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.qtl}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.pricePerQtlTable}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.totalAmount}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.profit}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.status}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={7} className="px-8 py-12 text-center text-gray-400 font-bold">{language === "en" ? "Loading Sales..." : "बिक्री का डेटा लोड हो रहा है..."}</td></tr>
                            ) : filteredRecords.map((record, idx) => (
                                <tr key={record._id} className="group hover:bg-[#F8FAFC]/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <Calendar size={16} className="text-gray-300" />
                                            <span className="font-bold text-gray-600 text-sm">{new Date(record.date).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 font-black text-gray-900">{record.cropName}</td>
                                    <td className="px-8 py-6 font-medium text-gray-500">{record.quantity} QTL</td>
                                    <td className="px-8 py-6 font-medium text-gray-500">₹{record.pricePerQuintal.toLocaleString()}</td>
                                    <td className="px-8 py-6 font-black text-[#14532D]">₹{record.totalAmount.toLocaleString()}</td>
                                    <td className="px-8 py-6 font-black text-[#22C55E]">₹{record.profit.toLocaleString()}</td>
                                    <td className="px-8 py-6">
                                        <StatusBadge status={record.status} language={language} t={t} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 🪄 Record Sale Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-[#14532D]/20 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="p-8 space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-black text-[#14532D] tracking-tight">{t.recordSale}</h2>
                                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.cropName}</label>
                                        <input
                                            type="text"
                                            value={formData.cropName}
                                            onChange={(e) => setFormData({ ...formData, cropName: e.target.value })}
                                            className="w-full bg-[#F8FAFC] border-2 border-gray-100 rounded-2xl py-3.5 px-6 font-bold outline-none focus:border-[#14532D]/20 transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.qtl}</label>
                                            <input
                                                type="number"
                                                value={formData.quantity}
                                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                                className="w-full bg-[#F8FAFC] border-2 border-gray-100 rounded-2xl py-3.5 px-6 font-bold outline-none focus:border-[#14532D]/20 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.pricePerQtlTable}</label>
                                            <input
                                                type="number"
                                                value={formData.pricePerQuintal}
                                                onChange={(e) => setFormData({ ...formData, pricePerQuintal: e.target.value })}
                                                className="w-full bg-[#F8FAFC] border-2 border-gray-100 rounded-2xl py-3.5 px-6 font-bold outline-none focus:border-[#14532D]/20 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.totalAmount}</label>
                                            <input
                                                type="number"
                                                value={formData.totalAmount}
                                                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                                                className="w-full bg-[#F8FAFC] border-2 border-gray-100 rounded-2xl py-3.5 px-6 font-bold outline-none focus:border-[#14532D]/20 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.profit}</label>
                                            <input
                                                type="number"
                                                value={formData.profit}
                                                onChange={(e) => setFormData({ ...formData, profit: e.target.value })}
                                                className="w-full bg-[#F8FAFC] border-2 border-gray-100 rounded-2xl py-3.5 px-6 font-bold outline-none focus:border-[#14532D]/20 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-gray-400 hover:text-gray-600 transition-all">{t.cancel}</button>
                                    <button onClick={handleSave} className="flex-1 py-4 bg-[#14532D] text-white rounded-2xl font-bold shadow-lg shadow-[#14532D]/20 transition-all active:scale-95">{t.save}</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* 🍞 Toast Notification */}
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[200] bg-gray-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm"
                    >
                        <CheckCircle2 size={20} className="text-[#22C55E]" />
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function SummaryCard({ title, value, subtext, icon, color }: any) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl ${color}`}>{icon}</div>
                <div className="px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-black rounded-full uppercase tracking-widest">{subtext}</div>
            </div>
            <div>
                <p className="text-gray-400 text-xs font-black uppercase tracking-widest">{title}</p>
                <h2 className="text-2xl font-black text-gray-900 mt-1">{value}</h2>
            </div>
        </div>
    );
}

function StatusBadge({ status, language, t }: { status: string, language: string, t: any }) {
    const isCompleted = status === "Completed";
    return (
        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-fit ${isCompleted
            ? "bg-[#22C55E]/10 text-[#22C55E]"
            : "bg-amber-500/10 text-amber-500"
            }`}>
            {isCompleted ? <CheckCircle2 size={12} /> : <Clock size={12} />}
            {isCompleted ? t.completed : t.pending}
        </span>
    );
}

"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Search, Plus, Package, Edit2, Trash2, X,
    ChevronDown, Filter, MoreVertical, CheckCircle2, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import axios from "axios";

interface Crop {
    _id: string;
    cropName: string;
    quantity: number;
    pricePerQuintal: number;
    status: string;
    updatedAt: string;
}

export default function InventoryPage() {
    const { language, t } = useLanguage();
    const { token } = useAuth();

    // State
    const [crops, setCrops] = useState<Crop[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
    const [cropToDelete, setCropToDelete] = useState<Crop | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        cropName: "",
        quantity: "",
        pricePerQuintal: ""
    });

    useEffect(() => {
        if (token) fetchCrops();
    }, [token]);

    const fetchCrops = async () => {
        try {
            const res = await axios.get("/api/crops", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCrops(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch crops", error);
            setLoading(false);
        }
    };

    const filteredCrops = useMemo(() => {
        return crops.filter(c => {
            const matchesSearch = c.cropName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterStatus === "All" || c.status === filterStatus;
            return matchesSearch && matchesFilter;
        });
    }, [crops, searchQuery, filterStatus]);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleOpenModal = (crop?: Crop) => {
        if (crop) {
            setEditingCrop(crop);
            setFormData({
                cropName: crop.cropName,
                quantity: crop.quantity.toString(),
                pricePerQuintal: crop.pricePerQuintal.toString()
            });
        } else {
            setEditingCrop(null);
            setFormData({ cropName: "", quantity: "", pricePerQuintal: "" });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.cropName || !formData.quantity || !formData.pricePerQuintal) return;

        const quantityNum = parseFloat(formData.quantity);
        const priceNum = parseFloat(formData.pricePerQuintal);

        let status = "In Stock";
        if (quantityNum === 0) status = "Out of Stock";
        else if (quantityNum < 100) status = "Low Stock";

        const payload = {
            cropName: formData.cropName,
            quantity: quantityNum,
            pricePerQuintal: priceNum,
            status,
            updatedAt: new Date()
        };

        try {
            if (editingCrop) {
                const res = await axios.put(`/api/crops/${editingCrop._id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCrops(crops.map(c => c._id === editingCrop._id ? res.data : c));
                showToast(t.successUpdate);
            } else {
                const res = await axios.post("/api/crops", payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCrops([res.data, ...crops]);
                showToast(t.successUpdate);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to save crop", error);
        }
    };

    const handleDelete = async () => {
        if (cropToDelete) {
            try {
                await axios.delete(`/api/crops/${cropToDelete._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCrops(crops.filter(c => c._id !== cropToDelete._id));
                showToast(t.successDelete);
                setIsDeleteModalOpen(false);
                setCropToDelete(null);
            } catch (error) {
                console.error("Failed to delete crop", error);
            }
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 🏷️ Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-[#14532D] tracking-tight">{t.inventoryTitle}</h1>
                    <p className="text-gray-500 font-medium">{t.inventorySub}</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-[#14532D] text-white px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#14532D]/20 hover:bg-[#14532D]/90 active:scale-95 transition-all"
                >
                    <Plus size={20} strokeWidth={3} />
                    {t.addCrop}
                </button>
            </div>

            {/* 🔍 Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder={t.searchCrops}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border-2 border-transparent focus:border-[#14532D]/20 rounded-2xl py-4 pl-14 pr-6 shadow-sm outline-none font-medium transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-white border-2 border-transparent focus:border-[#14532D]/20 rounded-2xl px-6 py-4 shadow-sm outline-none font-bold text-[#14532D] appearance-none transition-all pr-12 relative"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2314532D' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
                    >
                        <option value="All">{t.filterAll}</option>
                        <option value="In Stock">{language === "en" ? "In Stock" : "स्टॉक में"}</option>
                        <option value="Low Stock">{language === "en" ? "Low Stock" : "कम स्टॉक"}</option>
                        <option value="Out of Stock">{language === "en" ? "Out of Stock" : "स्टॉक खत्म"}</option>
                    </select>
                </div>
            </div>

            {/* 📦 Inventory Content */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-[#14532D]/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-[#F8FAFC] border-b border-gray-50">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.cropName}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.totalStockQty}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.pricePerQtl}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.status}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-bold">{language === "en" ? "Loading Inventory..." : "स्टॉक लोड हो रहा है..."}</td></tr>
                            ) : filteredCrops.map((item) => (
                                <tr key={item._id} className="group hover:bg-[#F8FAFC]/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-[#14532D]/5 flex items-center justify-center text-[#14532D]">
                                                <Package size={22} />
                                            </div>
                                            <div>
                                                <div className="font-black text-gray-900 text-lg">{item.cropName}</div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.lastUpdated}: {new Date(item.updatedAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 font-bold text-gray-700 text-lg">{item.quantity} QTL</td>
                                    <td className="px-8 py-6 font-black text-[#14532D] text-lg">₹{item.pricePerQuintal.toLocaleString()}</td>
                                    <td className="px-8 py-6">
                                        <StatusBadge status={item.status as any} language={language} />
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleOpenModal(item)}
                                                className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-[#14532D]/10 hover:text-[#14532D] transition-all"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => { setCropToDelete(item); setIsDeleteModalOpen(true); }}
                                                className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 📱 Mobile List view */}
            <div className="md:hidden space-y-4">
                {filteredCrops.map((item) => (
                    <div key={item._id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Package className="text-[#14532D]" size={20} />
                                <span className="font-black text-lg">{item.cropName}</span>
                            </div>
                            <StatusBadge status={item.status as any} language={language} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.totalStockQty}</div>
                                <div className="text-xl font-bold">{item.quantity} QTL</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.pricePerQtl}</div>
                                <div className="text-xl font-bold text-[#14532D]">₹{item.pricePerQuintal}</div>
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => handleOpenModal(item)} className="flex-1 py-3 bg-gray-50 rounded-xl text-sm font-bold text-gray-600 transition-all">{t.edit}</button>
                            <button onClick={() => { setCropToDelete(item); setIsDeleteModalOpen(true); }} className="flex-1 py-3 bg-red-50 rounded-xl text-sm font-bold text-red-500 transition-all">{t.delete}</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* 🪄 Add/Edit Modal */}
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
                                    <h2 className="text-2xl font-black text-[#14532D] tracking-tight">{editingCrop ? t.edit : t.addCrop}</h2>
                                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.cropName}</label>
                                        <input
                                            type="text"
                                            value={formData.cropName}
                                            onChange={(e) => setFormData({ ...formData, cropName: e.target.value })}
                                            className="w-full bg-[#F8FAFC] border-2 border-gray-100 rounded-2xl py-4 px-6 font-bold outline-none focus:border-[#14532D]/20 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.quantity}</label>
                                        <input
                                            type="number"
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                            className="w-full bg-[#F8FAFC] border-2 border-gray-100 rounded-2xl py-4 px-6 font-bold outline-none focus:border-[#14532D]/20 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.pricePerQtl}</label>
                                        <input
                                            type="number"
                                            value={formData.pricePerQuintal}
                                            onChange={(e) => setFormData({ ...formData, pricePerQuintal: e.target.value })}
                                            className="w-full bg-[#F8FAFC] border-2 border-gray-100 rounded-2xl py-4 px-6 font-bold outline-none focus:border-[#14532D]/20 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4.5 font-bold text-gray-400 hover:text-gray-600 transition-all">{t.cancel}</button>
                                    <button onClick={handleSave} className="flex-1 py-4.5 bg-[#14532D] text-white rounded-2xl font-bold shadow-lg shadow-[#14532D]/20 transition-all active:scale-95">{t.save}</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* 🗑️ Delete Confirmation */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-red-900/10 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl relative z-10 p-8 text-center space-y-6"
                        >
                            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                                <AlertCircle size={40} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-gray-900">{t.deleteConfirmTitle}</h3>
                                <p className="text-gray-500 font-medium">{t.deleteConfirmMsg}</p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button onClick={handleDelete} className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-500/20 active:scale-95 transition-all">{t.confirm}</button>
                                <button onClick={() => setIsDeleteModalOpen(false)} className="w-full py-4 font-bold text-gray-400 hover:text-gray-600 transition-all">{t.cancel}</button>
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

function StatusBadge({ status, language }: { status: "In Stock" | "Low Stock" | "Out of Stock", language: string }) {
    const colors = {
        "In Stock": "bg-[#22C55E]/10 text-[#22C55E]",
        "Low Stock": "bg-amber-500/10 text-amber-500",
        "Out of Stock": "bg-red-500/10 text-red-500",
    };

    const labels = {
        en: {
            "In Stock": "In Stock",
            "Low Stock": "Low Stock",
            "Out of Stock": "Out of Stock",
        },
        hi: {
            "In Stock": "स्टॉक में",
            "Low Stock": "कम स्टॉक",
            "Out of Stock": "स्टॉक खत्म",
        }
    } as any;

    return (
        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${colors[status]}`}>
            {labels[language][status]}
        </span>
    );
}

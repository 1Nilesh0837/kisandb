"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, Globe, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
    const { signup } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({ name: "", email: "", password: "", language: "en" });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const result = await signup(form.name, form.email, form.password, form.language);
        if (result.success) {
            router.push("/");
        } else {
            setError(result.error || "Signup failed");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F0FDF4] via-white to-[#ECFDF5] flex items-center justify-center p-4">
            {/* Decorative circles */}
            <div className="fixed top-[-120px] right-[-120px] w-[400px] h-[400px] bg-[#22C55E]/5 rounded-full blur-3xl" />
            <div className="fixed bottom-[-100px] left-[-100px] w-[350px] h-[350px] bg-[#14532D]/5 rounded-full blur-3xl" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <span className="text-4xl">🌾</span>
                        <span className="text-3xl font-black text-[#14532D] tracking-tight">KisanDB</span>
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Create your farmer account</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-[#14532D]/5 border border-gray-100 overflow-hidden">
                    <div className="p-8 space-y-6">
                        <div>
                            <h2 className="text-2xl font-black text-[#14532D] tracking-tight">Sign Up</h2>
                            <p className="text-gray-400 text-sm mt-1">Start managing your crops today</p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold border border-red-100"
                            >
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name */}
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                                <input
                                    type="text"
                                    placeholder="Full Name / पूरा नाम"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    required
                                    className="w-full bg-[#F8FAFC] border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-800 outline-none focus:border-[#22C55E]/30 transition-all placeholder:text-gray-300 placeholder:font-medium"
                                />
                            </div>

                            {/* Email */}
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    required
                                    className="w-full bg-[#F8FAFC] border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-800 outline-none focus:border-[#22C55E]/30 transition-all placeholder:text-gray-300 placeholder:font-medium"
                                />
                            </div>

                            {/* Password */}
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password (min 6 chars)"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    required
                                    minLength={6}
                                    className="w-full bg-[#F8FAFC] border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-12 font-bold text-gray-800 outline-none focus:border-[#22C55E]/30 transition-all placeholder:text-gray-300 placeholder:font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            {/* Language Selector */}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">
                                    <Globe size={12} className="inline mr-1 mb-0.5" /> Preferred Language
                                </label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, language: "en" })}
                                        className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${form.language === "en"
                                            ? "bg-[#14532D] text-white shadow-lg shadow-[#14532D]/20"
                                            : "bg-[#F8FAFC] text-gray-400 border-2 border-gray-100 hover:border-gray-200"
                                            }`}
                                    >
                                        🇬🇧 English
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, language: "hi" })}
                                        className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${form.language === "hi"
                                            ? "bg-[#14532D] text-white shadow-lg shadow-[#14532D]/20"
                                            : "bg-[#F8FAFC] text-gray-400 border-2 border-gray-100 hover:border-gray-200"
                                            }`}
                                    >
                                        🇮🇳 हिंदी
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-[#14532D] text-white rounded-2xl font-black text-base shadow-xl shadow-[#14532D]/20 hover:shadow-2xl hover:shadow-[#14532D]/30 transition-all active:scale-[.98] flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>Create Account <ArrowRight size={18} /></>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="bg-[#F8FAFC] px-8 py-5 text-center border-t border-gray-100">
                        <p className="text-sm text-gray-400">
                            Already have an account?{" "}
                            <Link href="/login" className="text-[#14532D] font-bold hover:underline">
                                Login
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

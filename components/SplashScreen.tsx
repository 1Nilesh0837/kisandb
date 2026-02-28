"use client";

import { motion } from "framer-motion";
import { Wheat, ArrowRight } from "lucide-react";

interface SplashScreenProps {
    onStart: () => void;
}

export default function SplashScreen({ onStart }: SplashScreenProps) {
    return (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col md:flex-row overflow-hidden">

            {/* Left Panel: Green Background + Phone Mockup */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full md:w-1/2 bg-primary flex items-center justify-center p-8 relative overflow-hidden"
            >
                {/* Decorative elements */}
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-accent/20 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/10 rounded-full blur-2xl" />

                {/* Floating Phone Mockup */}
                <motion.div
                    initial={{ y: 100, opacity: 0, rotate: -5 }}
                    animate={{ y: 0, opacity: 1, rotate: -10 }}
                    transition={{
                        type: "spring",
                        stiffness: 40,
                        damping: 15,
                        delay: 0.4
                    }}
                    className="relative z-10"
                >
                    <div className="w-[240px] h-[480px] md:w-[280px] md:h-[580px] bg-gray-900 rounded-[2.5rem] border-[8px] border-gray-800 shadow-[20px_40px_80px_-15px_rgba(0,0,0,0.4)] overflow-hidden relative">
                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-800 rounded-b-xl z-20" />

                        {/* Mock Screen Content */}
                        <div className="absolute inset-0 bg-cream p-5 pt-12 flex flex-col gap-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-primary/20" />
                                <div className="w-1/2 h-3 bg-primary/10 rounded-full" />
                            </div>
                            <div className="w-full h-32 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10">
                                <Wheat size={32} className="text-primary/20" />
                            </div>
                            <div className="space-y-2">
                                <div className="w-full h-2 bg-gray-200 rounded-full" />
                                <div className="w-3/4 h-2 bg-gray-200 rounded-full" />
                            </div>
                            <div className="mt-auto flex flex-col gap-2">
                                <div className="w-full h-10 bg-accent/20 rounded-xl" />
                                <div className="w-full h-10 bg-primary rounded-xl" />
                            </div>
                        </div>
                    </div>

                    {/* Secondary smaller phone/element for depth as seen in split mockup */}
                    <motion.div
                        animate={{ y: [0, -15, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -right-16 md:-right-24 bottom-12 w-[160px] h-[320px] md:w-[200px] md:h-[400px] bg-accent/80 rounded-[2rem] border-[6px] border-white/20 shadow-2xl backdrop-blur-md z-0 rotate-12 flex items-center justify-center"
                    >
                        <div className="flex flex-col items-center gap-2 text-white/40">
                            <Wheat size={48} />
                            <div className="w-12 h-1 bg-white/20 rounded-full" />
                        </div>
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Right Content Panel */}
            <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="w-full md:w-1/2 flex flex-col justify-center px-10 md:px-20 bg-white py-12 md:py-0"
            >
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-4xl">🌾</span>
                        <h1 className="text-5xl font-extrabold text-primary tracking-tight">
                            KisanDB
                        </h1>
                    </div>

                    <p className="text-2xl md:text-3xl text-gray-800 font-bold leading-tight mb-4">
                        Apni Fasal Ki Baat,
                        <br />
                        <span className="text-accent underline decoration-gold/30">Apni Zubaan Mein</span>
                    </p>

                    <p className="text-gray-500 mb- aggregation-pipeline-explanation 10 max-w-sm leading-relaxed">
                        AI-powered Agricultural Intelligence built to help farmers manage crops, inventory and sales through local language insights.
                    </p>

                    <button
                        onClick={onStart}
                        className="group relative inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-white px-10 py-5 rounded-2xl text-xl font-bold shadow-[0_20px_50px_-12px_rgba(8,76,51,0.4)] transition-all hover:scale-105 active:scale-95"
                    >
                        Shuru Karein
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>

                {/* Footer Text */}
                <div className="absolute bottom-10 text-gray-400 text-xs font-medium uppercase tracking-[0.2em]">
                    Powered by MongoDB • AgriAI
                </div>
            </motion.div>
        </div>
    );
}

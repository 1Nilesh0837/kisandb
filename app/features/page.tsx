"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { ChevronRight, IndianRupee, Landmark, ShieldCheck, Microscope } from "lucide-react";
import LoanSubsidyChecker from "@/components/LoanSubsidyChecker";
import LiveMandiPrices from "@/components/LiveMandiPrices";
import CropInsurance from "@/components/CropInsurance";
import SoilHealthCard from "@/components/SoilHealthCard";

export default function FeaturesPage() {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const [isCheckerOpen, setIsCheckerOpen] = useState(false);
    const [isMandiOpen, setIsMandiOpen] = useState(false);
    const [isInsuranceOpen, setIsInsuranceOpen] = useState(false);
    const [isSoilOpen, setIsSoilOpen] = useState(false);

    const features = [
        {
            id: "loan_checker",
            title: language === "en" ? "Loan & Subsidy Checker" : "लोन और सब्सिडी चेक",
            subtitle: language === "en" ? "Check your eligibility for government schemes" : "सरकारी योजनाओं के लिए अपनी पात्रता जांचें",
            icon: <IndianRupee size={24} />,
            color: "bg-amber-50 text-amber-600",
            onClick: () => setIsCheckerOpen(true),
        },
        {
            id: "mandi_prices",
            title: language === "en" ? "Live Mandi Prices" : "लाइव मंडी भाव",
            subtitle: language === "en" ? "Real-time rates from your local market" : "आपकी स्थानीय मंडी से वास्तविक समय की दरें",
            icon: <Landmark size={24} />,
            color: "bg-blue-50 text-blue-600",
            onClick: () => setIsMandiOpen(true),
        },
        {
            id: "insurance",
            title: language === "en" ? "Crop Insurance" : "फसल बीमा",
            subtitle: language === "en" ? "Protect your harvest from climate risks" : "जलवायु जोखिमों से अपनी फसल की रक्षा करें",
            icon: <ShieldCheck size={24} />,
            color: "bg-green-50 text-green-600",
            onClick: () => setIsInsuranceOpen(true),
        },
        {
            id: "soil_health",
            title: language === "en" ? "Soil Health Card" : "मृदा स्वास्थ्य कार्ड",
            subtitle: language === "en" ? "Get AI recommendations for your soil" : "अपनी मिट्टी के लिए एआई सिफारिशें प्राप्त करें",
            icon: <Microscope size={24} />,
            color: "bg-purple-50 text-purple-600",
            onClick: () => setIsSoilOpen(true),
        },
    ];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
            {/* Header */}
            <section className="space-y-4">
                <h1 className="text-4xl font-black text-[#14532D] tracking-tight">
                    {language === "en" ? "More Features" : "अतिरिक्त सुविधाएं"}
                </h1>
                <p className="text-gray-500 font-medium text-lg">
                    {language === "en" ? "Powerful tools to help you grow your farm and finances." : "आपके खेत और वित्त को बढ़ाने में मदद करने के लिए शक्तिशाली उपकरण।"}
                </p>
            </section>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((feature) => (
                    <button
                        key={feature.id}
                        onClick={feature.onClick}
                        className="flex items-center gap-6 p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-[#14532D]/20 transition-all text-left group active:scale-[0.98]"
                    >
                        <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                            {feature.icon}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-black text-[#14532D] mb-1">{feature.title}</h3>
                            <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">{feature.subtitle}</p>
                        </div>
                        <ChevronRight size={24} className="text-gray-300 group-hover:text-[#14532D] transition-colors" />
                    </button>
                ))}
            </div>

            {/* Modal */}
            {isCheckerOpen && (
                <LoanSubsidyChecker
                    farmerProfile={user}
                    onClose={() => setIsCheckerOpen(false)}
                />
            )}

            {isMandiOpen && (
                <LiveMandiPrices
                    farmerProfile={user}
                    onClose={() => setIsMandiOpen(false)}
                />
            )}

            {isInsuranceOpen && (
                <CropInsurance
                    farmerProfile={user}
                    onClose={() => setIsInsuranceOpen(false)}
                />
            )}

            {isSoilOpen && (
                <SoilHealthCard
                    farmerProfile={user}
                    onClose={() => setIsSoilOpen(false)}
                />
            )}
        </div>
    );
}

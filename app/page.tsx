"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  TrendingUp,
  Package,
  Wheat,
  Cloud,
  Phone,
  Download,
  IndianRupee,
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import LoanSubsidyChecker from "@/components/LoanSubsidyChecker";
import { ChevronRight } from "lucide-react";

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { user, token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isCheckerOpen, setIsCheckerOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch("/api/data", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((d) => setData(d));
  }, [token]);

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      {/* 👋 Welcome Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-extrabold text-[#14532D] tracking-tight">
            {language === "hi" ? `स्वागत है, ${user?.name || ""} 👋` : `Welcome, ${user?.name || ""} 👋`}
          </h1>
          <p className="text-gray-500 text-lg font-medium">
            {t.subtitle}
          </p>
        </div>
        <Link href="/inventory" className="flex items-center justify-center gap-3 bg-[#14532D] text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-[#14532D]/20 hover:scale-105 hover:bg-[#14532D]/90 active:scale-95 transition-all w-full md:w-auto">
          <Plus size={24} strokeWidth={3} />
          {t.addStock}
        </Link>
      </section>

      {/* 📊 Stats Grid - Exact 4 Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/inventory" className="block">
          <StatCard
            title={t.totalStock}
            value={data?.stats ? `${data.stats.totalStock} Quintals` : "..."}
            subtitle={t.totalStockSub}
            icon={<Package className="text-[#14532D]" size={28} />}
          />
        </Link>
        <Link href="/sales" className="block">
          <StatCard
            title={t.monthlySales}
            value={data?.stats ? `₹${data.stats.thisMonthSales.toLocaleString()}` : "..."}
            subtitle={<span className="text-[#22C55E] font-bold">{t.monthlySalesSub}</span>}
            icon={<IndianRupee className="text-[#14532D]" size={28} />}
          />
        </Link>
        <Link href="/inventory" className="block">
          <StatCard
            title={t.bestCrop}
            value={data?.stats ? data.stats.topCrop : "..."}
            subtitle={t.bestCropSub}
            icon={<Wheat className="text-[#14532D]" size={28} />}
          />
        </Link>
        <StatCard
          title={t.weather}
          value="28°C — Sunny"
          subtitle={t.weatherSub}
          icon={<Cloud className="text-[#14532D]" size={28} />}
        />
      </section>

      {/* Main Content Area - 70/30 Split */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-10">
        {/* 📋 Recent Activity - 70% */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-2xl font-bold text-gray-900 leading-none">{t.recentActivity}</h3>
            <button className="text-[#14532D] font-bold text-sm flex items-center gap-2 hover:opacity-70 transition-opacity">
              {t.viewAll} <ArrowRight size={16} />
            </button>
          </div>
          <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8FAFC] text-gray-400 font-bold uppercase text-[10px] tracking-[0.15em] border-b border-gray-100">
                <tr>
                  <th className="px-8 py-6">{t.action}</th>
                  <th className="px-8 py-6">{t.details}</th>
                  <th className="px-8 py-6">{t.time}</th>
                  <th className="px-8 py-6">{t.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.sales?.length > 0 ? data.sales.slice(0, 5).map((sale: any, i: number) => (
                  <ActivityRow
                    key={sale._id}
                    action={t.saleRecorded}
                    details={`₹${sale.totalAmount.toLocaleString()} ${sale.cropName}`}
                    time={new Date(sale.date).toLocaleDateString()}
                    status={t.completed}
                  />
                )) : (
                  <>
                    <ActivityRow action={t.stockAdded} details={data?.error ? "Error loading data" : "Waiting for records..."} time="..." status={t.completed} />
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar - 30% */}
        <div className="lg:col-span-3 space-y-10">
          {/* ⚡ Quick Actions */}
          <section className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 px-2 leading-none">{t.quickActions}</h3>
            <div className="flex flex-col gap-4">
              <Link href="/inventory">
                <ActionButton icon={<Plus size={22} />} label={t.addStock} />
              </Link>
              <Link href="/sales">
                <ActionButton icon={<TrendingUp size={22} />} label={t.recordSale} />
              </Link>
              <ActionButton
                icon={<Download size={22} />}
                label={t.downloadReport}
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
                  const downloadAnchorNode = document.createElement('a');
                  downloadAnchorNode.setAttribute("href", dataStr);
                  downloadAnchorNode.setAttribute("download", "kisandb_report.json");
                  document.body.appendChild(downloadAnchorNode);
                  downloadAnchorNode.click();
                  downloadAnchorNode.remove();
                }}
              />
            </div>
          </section>

          {/* 📞 Farmer Support Card */}
          <section className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 relative overflow-hidden group hover:border-[#14532D]/30 transition-colors">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#14532D]/5 rounded-full group-hover:scale-125 transition-transform duration-700" />
            <div className="relative z-10">
              <h3 className="text-xl font-extrabold text-[#14532D] mb-2">{t.support}</h3>
              <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed">
                {t.supportSub}
              </p>
              <a href="tel:18001234567" className="w-full bg-[#14532D] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-[#14532D]/10 hover:bg-[#14532D]/90 transition-all">
                <Phone size={20} fill="white" />
                {t.callSupport}
              </a>
            </div>
          </section>

          {/* 🌟 More Features */}
          <section className="pt-6 border-t border-gray-100">
            <Link href="/features" className="flex items-center justify-between px-2 mb-4 group/h">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover/h:text-[#14532D] transition-colors">
                {language === "en" ? "More Features" : "अतिरिक्त सुविधाएं"}
              </h3>
              <ChevronRight size={12} className="text-gray-300 group-hover/h:text-[#14532D]" />
            </Link>
            <button
              onClick={() => setIsCheckerOpen(true)}
              className="w-full flex items-center justify-between p-5 bg-white border border-gray-100 rounded-[2.5rem] hover:border-[#14532D]/30 hover:shadow-xl transition-all group active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                  💰
                </div>
                <div className="text-left">
                  <div className="font-black text-[#14532D] text-sm">
                    {language === "en" ? "Loan & Subsidy" : "लोन और सब्सिडी"}
                  </div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                    {language === "en" ? "Eligibility Checker" : "योग्यता चेक करें"}
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-[#14532D] transition-colors" />
            </button>
          </section>
        </div>
      </div>

      {/* 💰 Loan & Subsidy Checker Modal */}
      {isCheckerOpen && (
        <LoanSubsidyChecker
          farmerProfile={{ ...user, ...data }}
          onClose={() => setIsCheckerOpen(false)}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, subtitle, icon }: any) {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group flex flex-col justify-between min-h-[220px]">
      <div>
        <div className="bg-[#F8FAFC] w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#14532D]/5 transition-colors">
          {icon}
        </div>
        <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] mb-2">{title}</div>
        <div className="text-3xl font-black text-[#14532D] mb-2">{value}</div>
      </div>
      <div className="text-sm font-semibold text-gray-500 leading-relaxed border-t border-gray-50 pt-4 mt-2">{subtitle}</div>
    </div>
  );
}

function ActivityRow({ action, details, time, status }: any) {
  return (
    <tr className="hover:bg-gray-50/50 transition-colors group">
      <td className="px-8 py-6 font-bold text-gray-800">{action}</td>
      <td className="px-8 py-6 text-gray-500 font-medium">{details}</td>
      <td className="px-8 py-6 text-gray-400 font-bold flex items-center gap-2">
        <Clock size={14} className="opacity-50" /> {time}
      </td>
      <td className="px-8 py-6">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#22C55E]/10 text-[#14532D] rounded-full text-[10px] font-black uppercase tracking-widest">
          <CheckCircle2 size={12} strokeWidth={3} />
          {status}
        </span>
      </td>
    </tr>
  );
}

function ActionButton({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:border-[#14532D]/30 hover:shadow-lg transition-all group">
      <div className="bg-[#F8FAFC] p-3 rounded-xl text-gray-400 group-hover:text-[#14532D] group-hover:bg-[#14532D]/10 transition-all">
        {icon}
      </div>
      <span className="font-extrabold text-gray-700 group-hover:text-[#14532D] transition-colors">{label}</span>
      <ArrowRight size={18} className="ml-auto opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#14532D]" />
    </button>
  );
}

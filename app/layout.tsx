import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "KisanDB — Farmer Crop Data",
  description: "Hindi Natural Language Interface for MongoDB designed for Indian farmers.",
};

import { LanguageProvider } from "@/lib/LanguageContext";
import { AuthProvider } from "@/lib/AuthContext";
import Header from "@/components/Header";
import AppWrapper from "@/components/AppWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi">
      <body className={`${poppins.variable} antialiased min-h-screen bg-[#F8FAF9]`}>
        <AuthProvider>
          <LanguageProvider>
            <AppWrapper>
              <Header />
              <main className="app-container max-w-7xl mx-auto px-6 md:px-12 pt-32 md:pt-40 pb-40">
                {children}
              </main>
              <BottomNav />
            </AppWrapper>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

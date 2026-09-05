import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { AiAssistantDrawer } from "@/components/features/AiAssistantDrawer";

export const metadata: Metadata = {
  title: "SkillVantage AI - From Skills to Careers",
  description: "Student-focused AI career intelligence platform for SIH 2026 Problem Statement 26134. Understand industry demands, discover skill gaps, and build career roadmaps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="font-sans bg-surface-ground text-slate-900 antialiased selection:bg-brand-500 selection:text-white"
      >
        <AppProvider>
          {children}
          <ToastContainer />
          <AiAssistantDrawer />
        </AppProvider>
      </body>
    </html>
  );
}

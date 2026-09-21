import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { AiAssistantDrawer } from "@/components/features/AiAssistantDrawer";

export const metadata: Metadata = {
  title: "MatchSkill - AI Workforce & Career Intelligence Platform",
  description: "MatchSkill - Student-focused AI career intelligence platform. Understand industry demands, discover skill gaps, and match verified learning resources.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
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

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import TermsModal from "@/components/TermsModal";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "EV Guardian – Smart EV Charging Station Locator & Booking",
  description: "Find, book, and manage EV charging stations near you. Real-time availability, seamless booking, and instant payments.",
  keywords: "EV charging, electric vehicle, charging station, slot booking, fast charger",
  openGraph: {
    title: "EV Guardian",
    description: "The smartest EV charging platform in India",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased min-h-screen relative selection:bg-green-200`}>
         {/* Background with overlapping circles */}
         <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-gradient-to-br from-[#8cc63f] to-[#74af2b] dark:from-[#060b13] dark:to-[#03060a]">
            <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-white opacity-[0.08] dark:opacity-[0.02] mix-blend-overlay" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[80vw] h-[80vw] rounded-full bg-black opacity-[0.05] dark:opacity-[0.2] mix-blend-multiply" />
            <div className="absolute top-[30%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-white opacity-[0.1] mix-blend-screen" />
         </div>
         <div className="relative z-10 flex flex-col min-h-screen">
           {children}
         </div>
        <TermsModal />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#0f172a', color: '#f1f5f9', border: '1px solid #22d3ee22' },
            success: { iconTheme: { primary: '#22d3ee', secondary: '#0f172a' } },
            error: { iconTheme: { primary: '#f43f5e', secondary: '#0f172a' } },
          }}
        />
      </body>
    </html>
  );
}

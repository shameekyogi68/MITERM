"use client";

import { Car, Gauge, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import OfflineBanner from "./OfflineBanner";

export default function AppShell({
  children,
  isAdmin,
}: {
  children: React.ReactNode;
  isAdmin: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background mesh-bg dot-grid">
      {/* Premium ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] animate-ambient opacity-10" style={{ background: '#7c3aed' }} />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] rounded-full blur-[100px] animate-ambient opacity-10" style={{ background: '#6d28d9', animationDelay: '-4s' }} />
        <div className="absolute bottom-20 right-20 w-[300px] h-[300px] rounded-full blur-[80px] animate-ambient opacity-10" style={{ background: '#06b6d4', animationDelay: '-2s' }} />
        <div className="absolute -bottom-40 left-10 w-[600px] h-[600px] rounded-full blur-[150px] animate-ambient opacity-[0.05]" style={{ background: '#7c3aed', animationDelay: '-6s' }} />
      </div>

      {/* Top gradient accent line */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-gradient-to-r from-[#7c3aed] via-[#6d28d9] to-[#7c3aed] bg-[length:200%_100%] animate-[border-flow_3s_linear_infinite]" />

      {/* ── Header ── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/85 backdrop-blur-2xl shadow-lg shadow-black/20 border-b border-white/[0.06]"
            : "bg-background/0"
        }`}
      >
        <div className="flex h-16 sm:h-20 max-w-6xl mx-auto items-center justify-between px-4 sm:px-6">
          {/* Logo + Brand */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {/* Custom Premium Logo */}
            <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-primary to-cyan-500 text-white shadow-xl shadow-primary/20 animate-float border border-white/20">
              <Car className="h-5.5 w-5.5 sm:h-6.5 sm:w-6.5" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-violet-600 via-primary to-cyan-500 opacity-55 blur-lg -z-10" />
            </div>

            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-black tracking-tight flex items-center gap-1 leading-none">
                <span className="gradient-text bg-gradient-to-r from-violet-400 via-primary to-cyan-400">Petrol</span>
                <span className="text-foreground">Pandit</span>
                <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse-soft shrink-0" />
              </h1>
              <p className="text-[9px] sm:text-[10px] leading-none text-muted-foreground/60 tracking-[0.2em] sm:tracking-[0.25em] uppercase font-bold mt-1">
                Fuel Expense Oracle
              </p>
            </div>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-purple-600 px-2.5 py-1 text-[9px] font-bold text-white shadow-md shadow-primary/20 shrink-0">
                <Gauge className="h-2.5 w-2.5" />
                ADMIN
              </span>
            )}
          </div>
        </div>
      </header>

      <OfflineBanner />

      {/* Main content — tight padding on mobile */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-3 sm:pt-6 pb-2">
        {children}
      </main>

      {/* Footer ── desktop only */}
      <footer className="hidden md:block relative z-10 border-t mt-12">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-primary/10 to-purple-500/10">
                <Car className="h-3 w-3 text-primary" />
              </div>
              <span className="font-medium">Petrol Pandit</span>
              <span className="opacity-50">·</span>
              <span>v1.0.0</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              System Online
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

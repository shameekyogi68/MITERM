"use client";

import { Car, Gauge } from "lucide-react";
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
            ? "bg-background/80 backdrop-blur-md shadow-md border-b border-white/[0.06]"
            : "bg-background/0"
        }`}
      >
        <div className="flex h-16 sm:h-20 max-w-6xl mx-auto items-center justify-between px-4 sm:px-6">
          {/* Logo + Brand */}
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Custom Modern Logo */}
            <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] text-white border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-primary/40">
              <Car className="h-5 w-5 text-white" />
              <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
            </div>
 
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-white flex items-center leading-none">
                  Petrol<span className="text-primary font-medium">Pandit</span>
                </h1>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary tracking-wider uppercase shrink-0">
                    <Gauge className="h-2.5 w-2.5" />
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[9px] sm:text-[10px] leading-none text-white/40 tracking-[0.22em] uppercase font-bold mt-1.5">
                RIDE EXPENSE PLATFORM
              </p>
            </div>
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

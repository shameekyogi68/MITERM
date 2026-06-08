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
      {/* Premium ambient background gradient */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] animate-ambient opacity-10" style={{ background: '#7c3aed' }} />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] rounded-full blur-[100px] animate-ambient opacity-10" style={{ background: '#6d28d9', animationDelay: '-4s' }} />
        <div className="absolute bottom-20 right-20 w-[300px] h-[300px] rounded-full blur-[80px] animate-ambient opacity-10" style={{ background: '#06b6d4', animationDelay: '-2s' }} />
        <div className="absolute -bottom-40 left-10 w-[600px] h-[600px] rounded-full blur-[150px] animate-ambient opacity-[0.05]" style={{ background: '#7c3aed', animationDelay: '-6s' }} />
      </div>

      {/* Gradient accent line at top */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-gradient-to-r from-[#7c3aed] via-[#6d28d9] to-[#7c3aed] bg-[length:200%_100%] animate-[border-flow_3s_linear_infinite]" />

      <header
        className={`sticky top-3 z-50 w-[calc(100%-1.5rem)] xs:w-[calc(100%-2rem)] mx-auto border transition-all duration-300 rounded-2xl ${
          scrolled
            ? "bg-card/80 backdrop-blur-2xl shadow-xl border-white/10"
            : "bg-background/40 backdrop-blur-md border-white/5"
        }`}
      >
        <div className="container mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20 animate-float">
              <Car className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-white" />
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-purple-600 opacity-40 blur-md -z-10" />
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div>
                <h1 className="text-sm xs:text-base sm:text-lg font-extrabold tracking-tight flex items-center gap-1">
                  <span className="gradient-text font-black">Petrol</span>
                  <span className="text-foreground">Pandit</span>
                  <Sparkles className="h-3 w-3 text-primary/60 animate-pulse-soft" />
                </h1>
                <p className="text-[8px] leading-none text-muted-foreground/60 tracking-widest uppercase font-bold">
                  Fuel Expense Oracle
                </p>
              </div>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-purple-600 px-2 py-0.5 text-[9px] font-bold text-white shadow-md shadow-primary/20">
                  <Gauge className="h-2 w-2" />
                  ADMIN
                </span>
              )}
            </div>
          </div>
        </div>
      </header>
      <OfflineBanner />
      <main className="relative z-10 container mx-auto max-w-6xl px-4 py-6">{children}</main>
 
      {/* Premium Footer */}
      <footer className="relative z-10 border-t mt-12 pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-primary/10 to-purple-500/10">
                <Car className="h-3 w-3 text-primary" />
              </div>
              <span className="font-medium">Petrol Pandit</span>
              <span className="opacity-50">·</span>
              <span>v1.0.0</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                System Online
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

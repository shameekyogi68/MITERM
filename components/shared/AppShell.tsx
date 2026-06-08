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
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-ambient" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] animate-ambient" style={{ animationDelay: '-4s' }} />
        <div className="absolute -bottom-40 left-10 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] animate-ambient" style={{ animationDelay: '-2s' }} />
      </div>

      {/* Gradient accent line at top */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_100%] animate-[border-flow_3s_linear_infinite]" />

      <header
        className={`sticky top-1.5 z-50 w-[calc(100%-2rem)] mx-auto border-b transition-all duration-300 rounded-2xl ${
          scrolled
            ? "bg-card/75 backdrop-blur-2xl shadow-2xl border-white/5"
            : "bg-background/40 backdrop-blur-md border-primary/5"
        }`}
      >
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20 animate-float">
              <Car className="h-5 w-5 text-white" />
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-purple-600 opacity-40 blur-md -z-10" />
            </div>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg font-bold tracking-tight flex items-center gap-1.5">
                  <span className="gradient-text">MITE</span>
                  <span className="text-foreground font-extrabold">Ride Manager</span>
                  <Sparkles className="h-3.5 w-3.5 text-primary/60 animate-pulse-soft" />
                </h1>
                <p className="text-[9px] leading-none text-muted-foreground tracking-widest uppercase font-semibold">
                  Expense Tracker
                </p>
              </div>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-purple-600 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-lg shadow-primary/20">
                  <Gauge className="h-2.5 w-2.5" />
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
      <footer className="relative z-10 border-t mt-12">
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-primary/10 to-purple-500/10">
                <Car className="h-3 w-3 text-primary" />
              </div>
              <span className="font-medium">MITE Ride Manager</span>
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

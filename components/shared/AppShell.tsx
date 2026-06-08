"use client";

import { Car, Gauge, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import OfflineBanner from "./OfflineBanner";

const PANCHAYAT_LEADERS = [
  {
    name: "Narendra Modi",
    title: "Prime Minister",
    quote: "Mitron! Is the mileage exactly 14 km/L? OPEC is watching!",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Narendra_Modi_Official_Portrait_2019.jpg/150px-Narendra_Modi_Official_Portrait_2019.jpg",
    emoji: "🦁",
  },
  {
    name: "Nirmala Sitharaman",
    title: "Finance Minister",
    quote: "I don't drive, so I don't care. Where is my 18% Fastag GST?",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Nirmala_Sitharaman_Official_portrait.jpg/150px-Nirmala_Sitharaman_Official_portrait.jpg",
    emoji: "💼",
  },
  {
    name: "Hardeep Singh Puri",
    title: "Fuel Minister",
    quote: "Today's petrol price is verified. Keep driving or buy an EV!",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Hardeep_Singh_Puri_%28cropped%29.jpg/150px-Hardeep_Singh_Puri_%28cropped%29.jpg",
    emoji: "⛽",
  },
  {
    name: "Siddaramaiah",
    title: "Karnataka CM",
    quote: "Free bus for ladies! But full petrol charges for your Exter!",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Siddaramaiah_2017.jpg/150px-Siddaramaiah_2017.jpg",
    emoji: "🌾",
  },
  {
    name: "D.K. Shivakumar",
    title: "Karnataka CM",
    quote: "Kanakapura road is smooth. Pay Shameek fast, no discounts!",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/D_K_Shivakumar.jpg/150px-D_K_Shivakumar.jpg",
    emoji: "⚡",
  },
];

export default function AppShell({
  children,
  isAdmin,
}: {
  children: React.ReactNode;
  isAdmin: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [isPanchayatOpen, setIsPanchayatOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // iOS-safe scroll lock — same technique as PaymentDialog
  useEffect(() => {
    if (!isPanchayatOpen) return;
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo({ top: scrollY, behavior: "instant" as ScrollBehavior });
    };
  }, [isPanchayatOpen]);

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
        <div className="flex h-13 sm:h-16 max-w-6xl mx-auto items-center justify-between px-3 sm:px-5">
          {/* Logo + Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg shadow-primary/25 animate-float">
              <Car className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-purple-600 opacity-40 blur-md -z-10" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight flex items-center gap-1 leading-none">
                <span className="gradient-text font-black">Petrol</span>
                <span className="text-foreground">Pandit</span>
                <Sparkles className="h-2.5 w-2.5 text-primary/60 animate-pulse-soft shrink-0" />
              </h1>
              <p className="text-[8px] sm:text-[9px] leading-none text-muted-foreground/50 tracking-widest uppercase font-bold mt-0.5">
                Fuel Expense Oracle
              </p>
            </div>
            {isAdmin && (
              <span className="hidden xs:inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-purple-600 px-2 py-0.5 text-[9px] font-bold text-white shadow-md shadow-primary/20 shrink-0">
                <Gauge className="h-2 w-2" />
                ADMIN
              </span>
            )}
          </div>

          {/* Petrol Panchayat Surveillance Widget */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop: full avatar stack */}
            <button
              onPointerDown={() => setIsPanchayatOpen(true)}
              className="hidden md:flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity touch-manipulation"
              aria-label="Open Petrol Panchayat"
            >
              <div className="flex -space-x-2.5 overflow-hidden">
                {PANCHAYAT_LEADERS.map((leader) => (
                  <div
                    key={leader.name}
                    className="relative h-8 w-8 rounded-full border-2 border-background overflow-hidden bg-muted transition-transform duration-200 hover:scale-110 hover:z-10 shadow-md"
                    title={`${leader.name} (${leader.title})`}
                  >
                    <img
                      src={leader.image}
                      alt={leader.name}
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs select-none">
                      {leader.emoji}
                    </div>
                  </div>
                ))}
              </div>
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 bg-white/5 border border-white/10 px-2 py-1 rounded-full hover:bg-white/10 transition-colors">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                Live Panchayat
              </span>
            </button>

            {/* Mobile: compact pill button */}
            <button
              onPointerDown={() => setIsPanchayatOpen(true)}
              className="flex md:hidden items-center gap-1.5 bg-white/[0.06] border border-white/[0.08] rounded-full py-1.5 px-2.5 touch-manipulation active:bg-white/10 transition-colors"
              aria-label="Open Petrol Panchayat"
            >
              <div className="relative h-5 w-5 rounded-full overflow-hidden border border-white/20 bg-muted shrink-0">
                <img
                  src={PANCHAYAT_LEADERS[0].image}
                  alt="Panchayat"
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-[8px]">🕵️</div>
                <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-destructive animate-ping opacity-80" />
                <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-destructive" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider text-white/90">Watch</span>
            </button>
          </div>
        </div>
      </header>

      <OfflineBanner />

      {/* Main content — tight padding on mobile */}
      <main className="relative z-10 max-w-6xl mx-auto px-3 sm:px-5 pt-3 sm:pt-5 pb-2">
        {children}
      </main>

      {/* Footer — desktop only */}
      <footer className="hidden md:block relative z-10 border-t mt-12">
        <div className="max-w-6xl mx-auto px-5 py-5">
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

      {/* ── Petrol Panchayat Modal ── */}
      {isPanchayatOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-md animate-fade-in"
            onPointerDown={() => setIsPanchayatOpen(false)}
          />

          {/* Sheet (slides up from bottom on mobile, centered on desktop) */}
          <div className="relative w-full sm:max-w-lg mx-auto animate-slide-up sm:animate-fade-in-scale flex flex-col max-h-[88vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-white/[0.08] bg-[#0d0f14] shadow-2xl z-10">
            {/* Drag handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 shrink-0 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/20">
                  <span className="absolute inset-0 rounded-xl bg-destructive/20 animate-ping opacity-50" style={{ animationDuration: '2s' }} />
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Petrol Panchayat <span className="text-[10px] text-muted-foreground font-mono">CCTV-01</span>
                  </h3>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Commute Surveillance Committee</p>
                </div>
              </div>
              <button
                onPointerDown={() => setIsPanchayatOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white transition-colors touch-manipulation"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable list */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed italic text-center pb-3 border-b border-white/[0.05]">
                "Our esteemed leaders are actively monitoring Shameek's Exter and calculating if you are paying your fuel dues on time."
              </p>

              {PANCHAYAT_LEADERS.map((leader) => (
                <div
                  key={leader.name}
                  className="flex gap-3 items-start p-3 rounded-2xl bg-white/[0.025] border border-white/[0.05] hover:bg-white/[0.04] transition-colors group"
                >
                  {/* Avatar */}
                  <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-2xl overflow-hidden border border-white/10 shrink-0 bg-muted shadow-md">
                    <img
                      src={leader.image}
                      alt={leader.name}
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xl select-none">{leader.emoji}</div>
                    <div className="absolute top-1 left-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                    </div>
                  </div>

                  {/* Speech bubble */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1 mb-1.5">
                      <h4 className="text-xs sm:text-sm font-extrabold text-white truncate">{leader.name}</h4>
                      <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-primary/80 font-bold bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/10 shrink-0">{leader.title}</span>
                    </div>
                    <div className="relative bg-white/[0.03] border border-white/[0.06] rounded-xl p-2.5 text-xs text-muted-foreground leading-relaxed group-hover:border-primary/20 transition-colors">
                      <div className="absolute top-3 -left-1.5 w-3 h-3 bg-[#0d0f14] border-l border-b border-white/[0.06] transform rotate-45 group-hover:border-primary/20 transition-colors" />
                      <p className="font-medium italic text-foreground/90">"{leader.quote}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer status */}
            <div className="px-5 py-3 border-t border-white/[0.05] text-[9px] text-muted-foreground font-semibold flex items-center gap-1.5 justify-center shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Surveillance ACTIVE · 18% GST · FREE BUS FOR LADIES
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

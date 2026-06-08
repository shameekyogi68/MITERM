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

          {/* Petrol Panchayat Surveillance Widget */}
          <div className="flex items-center gap-3">
            {/* Desktop stack: 5 overlapping avatars */}
            <div 
              onClick={() => setIsPanchayatOpen(true)}
              className="hidden md:flex items-center gap-0.5 cursor-pointer hover:opacity-95 transition-opacity"
            >
              <div className="flex -space-x-2.5 overflow-hidden">
                {PANCHAYAT_LEADERS.map((leader) => (
                  <div 
                    key={leader.name}
                    className="relative group h-8 w-8 rounded-full border-2 border-[#161922] overflow-hidden bg-[#161922] transition-all duration-300 hover:scale-110 hover:z-20 shadow-md"
                    title={`${leader.name} (${leader.title})`}
                  >
                    <img
                      src={leader.image}
                      alt={leader.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs bg-primary/20 select-none">
                      {leader.emoji}
                    </div>
                  </div>
                ))}
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-full ml-1.5 transition-all hover:bg-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                Live Panchayat
              </span>
            </div>

            {/* Mobile widget: Single Modi avatar with badge */}
            <button
              onClick={() => setIsPanchayatOpen(true)}
              className="flex md:hidden items-center gap-1.5 bg-white/5 border border-white/10 rounded-full py-1.5 px-2.5 cursor-pointer hover:bg-white/10 transition-colors shrink-0"
            >
              <div className="relative h-6 w-6 rounded-full overflow-hidden border border-white/20 bg-muted">
                <img
                  src={PANCHAYAT_LEADERS[0].image}
                  alt="Modi"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-[10px]">
                  🕵️‍♂️
                </div>
                {/* Flashing camera dot */}
                <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-destructive animate-ping" />
                <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-destructive" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider text-white">Panchayat</span>
            </button>
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

      {/* Petrol Panchayat Surveillance Committee Overlay */}
      {isPanchayatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop with premium blur */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setIsPanchayatOpen(false)}
          />
          
          {/* Modal Card */}
          <div className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#0d0f14] p-6 text-foreground animate-fade-in-scale max-h-[85vh] flex flex-col z-10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/25 text-destructive animate-pulse">
                  <span className="absolute inset-0 rounded-xl bg-destructive/25 animate-ping opacity-60" style={{ animationDuration: '2s' }} />
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    Petrol Panchayat <span className="text-xs text-muted-foreground font-mono">CCTV-01</span>
                  </h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Commute Surveillance Committee</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPanchayatOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Committee Members List */}
            <div className="space-y-4 overflow-y-auto flex-1 pr-1 scrollbar-thin">
              <p className="text-xs text-muted-foreground leading-relaxed italic text-center pb-2 border-b border-white/5 font-medium">
                "Our esteemed leaders are actively monitoring Shameek's Exter and calculating if you are paying your fuel dues on time."
              </p>
              
              {PANCHAYAT_LEADERS.map((leader, index) => (
                <div 
                  key={leader.name} 
                  className="flex gap-4 items-start p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all group"
                >
                  {/* Photo Bubble */}
                  <div className="relative h-14 w-14 rounded-2xl overflow-hidden border border-white/10 shrink-0 bg-muted shadow-md group-hover:scale-105 transition-transform duration-300">
                    <img
                      src={leader.image}
                      alt={leader.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-2xl select-none">
                      {leader.emoji}
                    </div>
                    {/* Flashing overlay indicator */}
                    <div className="absolute top-1 left-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                    </div>
                  </div>

                  {/* Bubble Speech Message */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1">
                      <h4 className="text-sm font-extrabold text-white">{leader.name}</h4>
                      <span className="text-[9px] uppercase tracking-wider text-primary/80 font-bold bg-primary/10 px-2 py-0.5 rounded-full border border-primary/10">{leader.title}</span>
                    </div>
                    {/* Comical Speech Bubble */}
                    <div className="relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3 text-xs text-muted-foreground/90 leading-relaxed group-hover:border-primary/20 transition-colors">
                      {/* speech pointer triangle */}
                      <div className="absolute top-4 -left-1.5 w-3 h-3 bg-[#0d0f14] border-l border-b border-white/[0.06] transform rotate-45 group-hover:border-primary/20" />
                      <p className="font-semibold italic text-foreground">"{leader.quote}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Alert */}
            <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5 shrink-0 justify-center">
              <span className="inline-flex h-2 w-2 rounded-full bg-success animate-pulse" />
              Surveillance status: ACTIVE · 18% GST APPLIED · FREE BUS PASS FOR LADIES
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

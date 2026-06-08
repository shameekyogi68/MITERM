"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Fuel, Clock, CreditCard, TrendingUp, Car, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getDashboardStats, getPendingPayments } from "@/app/actions/stats.actions";
import OverdueBanner from "@/components/shared/OverdueBanner";
import WeeklyEarningsBarChart from "@/components/charts/WeeklyEarningsBarChart";
import CollectionRateDonutChart from "@/components/charts/CollectionRateDonutChart";
import PaymentDialog from "@/components/dialogs/PaymentDialog";
import { useToast } from "@/components/shared/Toast";

interface DashboardData {
  totalPending: number;
  totalCollected: number;
  totalFuelCost: number;
  totalRides: number;
  pendingCount: number;
  paidCount: number;
  overdueCount: number;
  monthlyFuelSpend: Array<{ month: string; amount: number }>;
  averageCostPerRide: number;
  averageCostPerPerson: number;
  mostFrequentDefaulter: { name: string; count: number } | null;
  todayPetrolPrice: number;
  todayFuelCost: number;
  memberAttendance: Record<string, { attended: number; totalSpent: number }>;
  mileage: number;
  routeDistance: number;
}

// ── Animated Counter ──────────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 800, prefix = "") {
  const [display, setDisplay] = useState(`${prefix}0`);

  useEffect(() => {
    let active = true;
    let frameId = 0;
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      if (!active) return;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setDisplay(`${prefix}${current.toLocaleString("en-IN")}`);
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => {
      active = false;
      cancelAnimationFrame(frameId);
    };
  }, [target, duration, prefix]);

  return display;
}

// ── Skeletons ─────────────────────────────────────────────────────────────────
function StatSkeleton() {
  return (
    <div className="rounded-2xl glass-premium p-4 sm:p-5 space-y-3">
      <div className="skeleton h-9 w-9 sm:h-11 sm:w-11 rounded-xl" />
      <div className="skeleton h-8 w-20" />
      <div className="skeleton h-3 w-16" />
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className="rounded-2xl sm:rounded-3xl glass-premium animate-pulse overflow-hidden">
      <div className="h-56 sm:h-72 skeleton" />
      <div className="p-4"><div className="skeleton h-16 rounded-xl" /></div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  icon: Icon,
  accentColor,
  accentBg,
  delay,
  isCurrency = false,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  accentColor: string;
  accentBg: string;
  delay: number;
  isCurrency?: boolean;
}) {
  const numericValue = isCurrency
    ? typeof value === "string"
      ? parseFloat(value.replace(/[₹,%,]/g, "")) || 0
      : (value as number)
    : typeof value === "number"
      ? value
      : parseFloat(String(value).replace(/[₹,%]/g, "")) || 0;

  const animatedValue = useAnimatedCounter(numericValue, 800, isCurrency ? "₹" : "");

  return (
    <div
      className="group relative rounded-2xl glass-premium p-4 sm:p-5 transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${delay * 0.06}s` }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(-2px)";
        el.style.boxShadow = `0 0 30px ${accentColor}30, 0 8px 32px rgba(0,0,0,0.4)`;
        el.style.borderColor = `${accentColor}40`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "";
        el.style.boxShadow = "";
        el.style.borderColor = "";
      }}
    >
      <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl" style={{ background: accentBg }}>
        <Icon className="h-4 sm:h-5 w-4 sm:w-5" style={{ color: accentColor }} />
      </div>
      <p className="mt-3 sm:mt-4 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold leading-none tracking-tight tabular-nums stat-number">
        {isCurrency ? animatedValue : value}
      </p>
      <p className="mt-1 text-[9px] sm:text-[11px] uppercase tracking-[0.12em] sm:tracking-[0.15em] font-bold text-muted-foreground truncate">
        {title}
      </p>
      <div
        className="absolute bottom-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(to right, transparent, ${accentColor}60, transparent)` }}
      />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DashboardTab({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<Array<{
    rideId: string; rideDate: Date; memberName: string;
    amount: number; status: string; createdAt: Date;
  }>>([]);
  const [paymentDialog, setPaymentDialog] = useState<{
    open: boolean; rideId: string; memberName: string;
    amount: number; rideDate: Date; status?: string;
  }>({ open: false, rideId: "", memberName: "", amount: 0, rideDate: new Date() });

  const fetchData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const [s, p] = await Promise.all([getDashboardStats(), getPendingPayments()]);
      setStats(s as DashboardData);
      setFetchError(null);
      setPendingPayments(
        p.map((a: any) => ({
          rideId: a.rideId,
          rideDate: a.ride.date,
          memberName: a.member.name,
          amount: a.share,
          status: a.status,
          createdAt: a.createdAt,
        })),
      );
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setFetchError("Failed to load dashboard. Tap refresh to try again.");
    } finally {
      if (showRefreshIndicator) setIsRefreshing(false);
    }
  }, []);

  const handleManualRefresh = useCallback(async () => {
    await fetchData(true);
    router.refresh();
    addToast("success", "Dashboard refreshed");
  }, [fetchData, router, addToast]);

  useEffect(() => {
    fetchData();
    if (fetchError) return;
    const interval = setInterval(() => {
      router.refresh();
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData, router, fetchError]);

  // ── Error state ──────────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center px-4">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <RefreshCw className="h-7 w-7 text-destructive" />
        </div>
        <div>
          <p className="text-base font-bold text-foreground">{fetchError}</p>
          <p className="text-sm text-muted-foreground mt-1">Check your connection and try again.</p>
        </div>
        <button
          onClick={handleManualRefresh}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white touch-manipulation active:scale-95"
          style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    );
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  if (!stats) {
    return (
      <div className="space-y-5">
        <HeroSkeleton />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const collectionRate =
    stats.totalPending + stats.totalCollected > 0
      ? Math.round((stats.totalCollected / (stats.totalPending + stats.totalCollected)) * 100)
      : 0;

  const statCards = [
    { title: "Today's Petrol Drain", value: formatCurrency(stats.todayFuelCost), icon: Fuel, accentColor: "#7c3aed", accentBg: "rgba(124,58,237,0.1)", isCurrency: true },
    { title: "Total Pending", value: formatCurrency(stats.totalPending), icon: Clock, accentColor: "#f59e0b", accentBg: "rgba(245,158,11,0.1)", isCurrency: true },
    { title: "Total Collected", value: formatCurrency(stats.totalCollected), icon: CreditCard, accentColor: "#06b6d4", accentBg: "rgba(6,182,212,0.1)", isCurrency: true },
    { title: "Collection Rate", value: `${collectionRate}%`, icon: TrendingUp, accentColor: "#10b981", accentBg: "rgba(16,185,129,0.1)", isCurrency: false },
  ];

  const fuelPerTrip = stats.mileage > 0 ? stats.routeDistance / stats.mileage : 0;

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ── Hero Card ── */}
      <div
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl border border-white/[0.08] animate-fade-in-up"
        style={{ background: "linear-gradient(160deg, #18092a 0%, #0c1424 60%, #07090f 100%)" }}
      >
        {/* Ambient glows */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(124,58,237,0.25)" }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(6,182,212,0.12)" }} />

        <div className="relative z-10">
          {/* Top row: badge + title + price */}
          <div className="px-5 pt-5 sm:px-6 sm:pt-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600/30 to-cyan-500/30 px-3 py-1 text-[10px] sm:text-xs font-extrabold text-cyan-400 border border-cyan-500/20 backdrop-blur-sm uppercase tracking-wider">
                <Car className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Hyundai Exter SUV
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-white">
                Namma <span className="gradient-text bg-gradient-to-r from-violet-400 via-primary to-cyan-400 font-extrabold">Exter</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold leading-relaxed max-w-sm">
                Sacred chariot gulping liquid gold to MITE daily
              </p>
            </div>

            {/* Live petrol price widget */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start shrink-0 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3 sm:p-4 gap-3 sm:gap-1 backdrop-blur-md">
              <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                </span>
                <span className="text-amber-400">Live price</span>
              </div>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-amber-400">
                  ₹{stats.todayPetrolPrice.toFixed(2)}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">/L</span>
              </div>
            </div>
          </div>

          {/* Car image container with a premium 3D glowing platform */}
          <div className="relative w-full mt-4 flex flex-col items-center justify-center overflow-hidden" style={{ height: "clamp(180px, 45vw, 300px)" }}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.15)_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute bottom-4 w-[80%] h-12 bg-white/[0.02] border border-white/[0.05] rounded-full blur-[2px] shadow-[0_15px_30px_rgba(124,58,237,0.2),0_0_20px_rgba(6,182,212,0.1)] transform scale-y-[0.3] pointer-events-none" />
            <img
              src="/car-clean.png"
              alt="Hyundai Exter SUV"
              className="relative z-10 w-full h-[85%] object-contain object-center transition-transform duration-700 hover:scale-[1.05] animate-float"
              style={{ filter: "drop-shadow(0 12px 36px rgba(124,58,237,0.5)) drop-shadow(0 0 10px rgba(6,182,212,0.25))" }}
            />
          </div>

          {/* Stats strip */}
          <div className="px-5 pb-5 sm:px-6 sm:pb-6 -mt-1 relative z-20">
            <div className="rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] p-4 sm:p-5 shadow-inner">
              <div className="grid grid-cols-4 divide-x divide-white/[0.06]">
                <div className="px-1 sm:px-3 text-center">
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-wider leading-tight">Mileage</p>
                  <p className="text-xl sm:text-3xl font-black mt-1 leading-none text-violet-400 tabular-nums">{stats.mileage}</p>
                  <p className="text-[9px] text-muted-foreground/50 font-semibold mt-1">km/L</p>
                </div>
                <div className="px-1 sm:px-3 text-center">
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-wider leading-tight">Distance</p>
                  <p className="text-xl sm:text-3xl font-black mt-1 leading-none text-cyan-400 tabular-nums">{stats.routeDistance}</p>
                  <p className="text-[9px] text-muted-foreground/50 font-semibold mt-1">km</p>
                </div>
                <div className="px-1 sm:px-3 text-center">
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-wider leading-tight">Fuel</p>
                  <p className="text-xl sm:text-3xl font-black mt-1 leading-none text-white/90 tabular-nums">
                    {fuelPerTrip.toFixed(1)}
                  </p>
                  <p className="text-[9px] text-muted-foreground/50 font-semibold mt-1">litres</p>
                </div>
                <div className="px-1 sm:px-3 text-center">
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-wider leading-tight">Today's Cost</p>
                  <p className="text-lg sm:text-3xl font-black mt-1 leading-none gradient-text bg-gradient-to-r from-violet-400 via-primary to-cyan-400 tabular-nums">
                    {formatCurrency(Math.round(fuelPerTrip * stats.todayPetrolPrice))}
                  </p>
                  <p className="text-[9px] text-muted-foreground/50 font-semibold mt-1">total</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Manual refresh button */}
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          aria-label="Refresh dashboard"
          className="absolute top-4 right-4 z-20 h-9 w-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/15 active:bg-white/20 transition-colors touch-manipulation disabled:opacity-50 sm:hidden"
        >
          <RefreshCw className={`h-4 w-4 text-white/70 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {statCards.map((card, i) => (
          <StatCard key={card.title} {...card} delay={i + 1} />
        ))}
      </div>

      {/* ── Overdue & Pending Banner ── */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
        <OverdueBanner
          pendingPayments={pendingPayments}
          onPayClick={(item) =>
            setPaymentDialog({
              open: true,
              rideId: item.rideId,
              memberName: item.memberName,
              amount: item.amount,
              rideDate: item.rideDate,
              status: item.status,
            })
          }
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
        <div className="lg:col-span-2 rounded-2xl glass-premium p-4 sm:p-6 card-hover">
          <WeeklyEarningsBarChart data={stats.monthlyFuelSpend} />
        </div>
        <div className="rounded-2xl glass-premium p-4 sm:p-6 card-hover">
          <CollectionRateDonutChart collected={stats.totalCollected} pending={stats.totalPending} />
        </div>
      </div>

      {/* ── Payment Dialog ── */}
      <PaymentDialog
        isOpen={paymentDialog.open}
        onClose={() => setPaymentDialog((prev) => ({ ...prev, open: false }))}
        rideId={paymentDialog.rideId}
        memberName={paymentDialog.memberName}
        amount={paymentDialog.amount}
        rideDate={paymentDialog.rideDate}
        currentStatus={paymentDialog.status}
        isAdmin={isAdmin}
        onSuccess={fetchData}
      />
    </div>
  );
}

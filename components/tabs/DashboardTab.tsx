"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Fuel,
  Clock,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Car,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getDashboardStats, getPendingPayments } from "@/app/actions/stats.actions";
import OverdueBanner from "@/components/shared/OverdueBanner";
import WeeklyEarningsBarChart from "@/components/charts/WeeklyEarningsBarChart";
import CollectionRateDonutChart from "@/components/charts/CollectionRateDonutChart";
import SparklineChart from "@/components/charts/SparklineChart";
import PaymentDialog from "@/components/dialogs/PaymentDialog";

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

// ── Animated Counter Hook ────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 800, prefix = "", suffix = "", decimals = 0) {
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      if (decimals > 0) {
        setDisplay(`${prefix}${current.toFixed(decimals)}${suffix}`);
      } else {
        setDisplay(`${prefix}${Math.round(current).toLocaleString("en-IN")}${suffix}`);
      }
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, prefix, suffix, decimals]);

  return display;
}

// ── Stat Card with animated counter ──────────────────────────────────────────
function StatSkeleton() {
  return (
    <div className="rounded-2xl glass-premium p-5 space-y-3">
      <div className="skeleton h-10 w-10 rounded-xl" />
      <div className="skeleton h-8 w-24" />
      <div className="skeleton h-4 w-20" />
    </div>
  );
}

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
 
  const animatedValue = useAnimatedCounter(numericValue, 800, isCurrency ? "₹" : "", "", 0);
 
  return (
    <div
      className="group relative rounded-2xl glass-premium p-4 sm:p-5 transition-all duration-300 animate-fade-in-up"
      style={{
        animationDelay: `${delay * 0.06}s`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 30px ${accentColor}30, 0 8px 32px rgba(0, 0, 0, 0.4)`;
        (e.currentTarget as HTMLDivElement).style.borderColor = `${accentColor}40`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "";
        (e.currentTarget as HTMLDivElement).style.borderColor = "";
      }}
    >
      {/* Icon square */}
      <div
        className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl"
        style={{ background: accentBg }}
      >
        <Icon className="h-4 sm:h-5 w-4 sm:w-5" style={{ color: accentColor }} />
      </div>
 
      {/* Value */}
      <p
        className="mt-3 sm:mt-4 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold leading-none tracking-tight tabular-nums stat-number"
        style={{ color: "inherit" }}
      >
        {isCurrency ? animatedValue : value}
      </p>
 
      {/* Label */}
      <p className="mt-1 text-[9px] xs:text-[10px] sm:text-[11px] uppercase tracking-[0.12em] sm:tracking-[0.15em] font-bold text-muted-foreground truncate">
        {title}
      </p>
 
      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(to right, transparent, ${accentColor}60, transparent)` }}
      />
    </div>
  );
}

export default function DashboardTab({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [pendingPayments, setPendingPayments] = useState<
    Array<{
      rideId: string;
      rideDate: Date;
      memberName: string;
      amount: number;
      status: string;
      createdAt: Date;
    }>
  >([]);
  const [paymentDialog, setPaymentDialog] = useState<{
    open: boolean;
    rideId: string;
    memberName: string;
    amount: number;
    rideDate: Date;
    status?: string;
  }>({ open: false, rideId: "", memberName: "", amount: 0, rideDate: new Date() });
 
  const fetchData = useCallback(async () => {
    const [s, p] = await Promise.all([getDashboardStats(), getPendingPayments()]);
    setStats(s as DashboardData);
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
  }, []);
 
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      router.refresh();
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData, router]);
 
  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
    );
  }
 
  const collectionRate = stats.totalPending + stats.totalCollected > 0
    ? Math.round((stats.totalCollected / (stats.totalPending + stats.totalCollected)) * 100)
    : 0;
 
  const statCards = [
    {
      title: "Today's Petrol Drain",
      value: formatCurrency(stats.todayFuelCost),
      icon: Fuel,
      accentColor: "#7c3aed",
      accentBg: "rgba(124,58,237,0.1)",
      isCurrency: true,
    },
    {
      title: "Total Pending",
      value: formatCurrency(stats.totalPending),
      icon: Clock,
      accentColor: "#f59e0b",
      accentBg: "rgba(245,158,11,0.1)",
      isCurrency: true,
    },
    {
      title: "Total Collected",
      value: formatCurrency(stats.totalCollected),
      icon: CreditCard,
      accentColor: "#06b6d4",
      accentBg: "rgba(6,182,212,0.1)",
      isCurrency: true,
    },
    {
      title: "Collection Rate",
      value: `${collectionRate}%`,
      icon: TrendingUp,
      accentColor: "#10b981",
      accentBg: "rgba(16,185,129,0.1)",
      isCurrency: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hyundai Exter Hero Card with Full-Bleed Gradient */}
      <div
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl sm:shadow-2xl animate-fade-in-up"
        style={{ 
          background: "linear-gradient(135deg, #1a0533 0%, #0a1628 100%)",
        }}
      >
        {/* Purple rim-light glow on right side */}
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#7c3aed]/20 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(124,58,237,0.2)" }} />

        <div className="grid gap-6 md:grid-cols-2 items-center relative z-10">
          {/* Details */}
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary border border-primary/20 backdrop-blur-sm">
                <Car className="h-3.5 w-3.5 animate-[spin-slow_6s_linear_infinite]" />
                HYUNDAI EXTER SUV
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight">
                Namma <span className="gradient-text">Exter</span>
              </h2>
              <p className="text-sm text-muted-foreground font-medium">
                The sacred chariot gulping liters of liquid gold to drag us to MITE daily
              </p>
            </div>

            {/* Petrol Price Card */}
            <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-xl border border-amber-500/20 p-4 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-widest">Liquid Gold Price Today</span>
                  <p className="text-4xl sm:text-[42px] font-light leading-none tabular-nums" style={{ color: "#f59e0b" }}>
                    ₹{stats.todayPetrolPrice.toFixed(2)}
                  </p>
                  <span className="text-xs font-medium text-muted-foreground">per liter of tears</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                  <span className="text-amber-500">Live</span>
                </div>
              </div>
            </div>

            {/* Specifications Grid in Frosted Glass Panel */}
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-4 shadow-inner">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-tight block">Mileage (saint 😇)</span>
                  <p className="text-3xl font-light leading-none tabular-nums" style={{ color: "#7c3aed" }}>
                    {stats.mileage}
                  </p>
                  <span className="text-xs font-medium text-muted-foreground">km/L</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-tight block">Distance (potholes)</span>
                  <p className="text-3xl font-light leading-none tabular-nums" style={{ color: "#06b6d4" }}>
                    {stats.routeDistance}
                  </p>
                  <span className="text-xs font-medium text-muted-foreground">km</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-tight block">Fuel Needed 💨</span>
                  <p className="text-3xl font-light leading-none tabular-nums">
                    {(stats.routeDistance / stats.mileage).toFixed(2)}
                  </p>
                  <span className="text-xs font-medium text-muted-foreground">Liters</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-tight block">Wallet Damage</span>
                  <p className="text-2xl sm:text-3xl font-light leading-none gradient-text tabular-nums break-all">
                    {formatCurrency(Math.round((stats.routeDistance / stats.mileage) * stats.todayPetrolPrice))}
                  </p>
                </div>
              </div>
            </div>


          </div>

          {/* Cinematic Image */}
          <div className="relative flex justify-end items-center h-32 xs:h-40 sm:h-52 md:h-64 rounded-xl sm:rounded-2xl overflow-hidden" style={{ boxShadow: "0 0 40px rgba(124,58,237,0.3), 0 0 80px rgba(109,40,217,0.15)" }}>
            {/* Purple rim-light glow effect */}
            <div className="absolute inset-0 bg-gradient-to-l from-[#7c3aed]/30 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#7c3aed]/10 via-transparent to-transparent pointer-events-none" />
            
            <img
              src="/car-hero.png"
              alt="Hyundai Exter SUV"
              className="relative w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              style={{ filter: "drop-shadow(0 0 15px rgba(124,58,237,0.25))" }}
            />
          </div>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {statCards.map((card, i) => (
          <StatCard key={card.title} {...card} delay={i + 1} />
        ))}
      </div>

      {/* Overdue & Pending Banner */}
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

      {/* Charts Row */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
        {/* Weekly Earnings Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl glass-premium p-4 sm:p-6 card-hover">
          <WeeklyEarningsBarChart data={stats.monthlyFuelSpend} />
        </div>

        {/* Collection Rate Donut Chart */}
        <div className="rounded-2xl glass-premium p-4 sm:p-6 card-hover">
          <CollectionRateDonutChart
            collected={stats.totalCollected}
            pending={stats.totalPending}
          />
        </div>
      </div>


      {/* Payment Dialog */}
      <PaymentDialog
        isOpen={paymentDialog.open}
        onClose={() => setPaymentDialog({ ...paymentDialog, open: false })}
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

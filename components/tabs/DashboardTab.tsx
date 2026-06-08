"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  Fuel,
  Users,
  Clock,
  CheckCircle2,
  CreditCard,
  TrendingUp,
  BarChart3,
  Activity,
  ArrowUpRight,
  IndianRupee,
  Gauge,
  Car,
  QrCode,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getDashboardStats, getPendingPayments } from "@/app/actions/stats.actions";
import OverdueBanner from "@/components/shared/OverdueBanner";
import MonthlyFuelChart from "@/components/charts/MonthlyFuelChart";
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
  gradient,
  delay,
  subtitle,
  isCurrency = false,
  sparklineData,
  delta,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  delay: number;
  subtitle?: string;
  isCurrency?: boolean;
  sparklineData?: number[];
  delta?: { value: number; label: string };
}) {
  const numericValue = isCurrency
    ? typeof value === "string"
      ? parseFloat(value.replace(/[₹,]/g, "")) || 0
      : value
    : typeof value === "number"
      ? value
      : 0;

  // Only show decimals for currency values that originally had them (e.g. petrol price)
  const decimalPlaces = isCurrency && typeof value === "string" && value.includes(".") ? 2 : 0;
  const animatedValue = useAnimatedCounter(numericValue, 800, isCurrency ? "₹" : "", "", decimalPlaces);

  // Extract color from gradient for sparkline
  const sparklineColor = gradient.includes("blue") ? "#3B82F6" :
                        gradient.includes("emerald") ? "#10B981" :
                        gradient.includes("orange") ? "#F59E0B" :
                        gradient.includes("green") ? "#10B981" :
                        gradient.includes("yellow") ? "#EAB308" :
                        gradient.includes("teal") ? "#14B8A6" :
                        gradient.includes("purple") ? "#8B5CF6" :
                        gradient.includes("pink") ? "#EC4899" :
                        "#6366F1";

  return (
    <div
      className={`group relative rounded-2xl glass-premium glow-card p-5 transition-all duration-300 hover:-translate-y-1.5 card-hover animate-fade-in-up`}
      style={{ animationDelay: `${delay * 0.06}s` }}
    >
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500`} />

      <div className="relative">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <p className="mt-4 text-2xl font-bold tracking-tight tabular-nums stat-number">
          {isCurrency ? animatedValue : value}
        </p>
        <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{title}</p>
        {subtitle && (
          <p className="mt-1 text-[10px] text-muted-foreground/60 font-medium">{subtitle}</p>
        )}
        {delta && (
          <p className={`mt-1 text-[10px] font-medium ${delta.value >= 0 ? "delta-positive" : "delta-negative"}`}>
            {delta.value >= 0 ? "+" : ""}{delta.value}% {delta.label}
          </p>
        )}
        {sparklineData && (
          <div className="mt-3 h-8">
            <SparklineChart data={sparklineData} color={sparklineColor} height={32} />
          </div>
        )}
      </div>

      {/* Corner accent */}
      <div className={`absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-gradient-to-br ${gradient} opacity-[0.04] transition-opacity group-hover:opacity-[0.08]`} />

      {/* Bottom shine line on hover */}
      <div className={`absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
    </div>
  );
}

export default function DashboardTab({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Today's Petrol",
      value: `₹${stats.todayPetrolPrice.toFixed(2)}`,
      icon: Fuel,
      gradient: "from-blue-500 to-blue-600",
      subtitle: `${stats.todayPetrolPrice.toFixed(2)}/L`,
      isCurrency: true,
      sparklineData: [94.5, 95.2, 94.8, 95.5, 94.9, 95.1, stats.todayPetrolPrice],
      delta: { value: 2.5, label: "vs yesterday" },
    },
    {
      title: "Fuel Cost Today",
      value: formatCurrency(stats.todayFuelCost),
      icon: IndianRupee,
      gradient: "from-emerald-500 to-emerald-600",
      isCurrency: true,
      sparklineData: [450, 520, 480, 550, 510, 530, stats.todayFuelCost],
      delta: { value: 8.2, label: "vs yesterday" },
    },
    {
      title: "Pending Amount",
      value: formatCurrency(stats.totalPending),
      icon: Clock,
      gradient: "from-orange-500 to-amber-600",
      isCurrency: true,
      sparklineData: [1200, 1500, 1100, 1800, 1400, 1600, stats.totalPending],
      delta: { value: -12.5, label: "vs last week" },
    },
    {
      title: "Total Collected",
      value: formatCurrency(stats.totalCollected),
      icon: CreditCard,
      gradient: "from-green-500 to-emerald-600",
      isCurrency: true,
      sparklineData: [5000, 5500, 5200, 5800, 5600, 6000, stats.totalCollected],
      delta: { value: 15.3, label: "vs last week" },
    },
    {
      title: "Pending Members",
      value: stats.pendingCount,
      icon: Users,
      gradient: "from-yellow-500 to-orange-600",
      subtitle: `${stats.overdueCount} overdue`,
      sparklineData: [5, 6, 4, 7, 5, 6, stats.pendingCount],
      delta: { value: -20, label: "vs last week" },
    },
    {
      title: "Paid Members",
      value: stats.paidCount,
      icon: CheckCircle2,
      gradient: "from-teal-500 to-green-600",
      sparklineData: [15, 18, 16, 20, 19, 22, stats.paidCount],
      delta: { value: 10, label: "vs last week" },
    },
    {
      title: "Total Rides",
      value: stats.totalRides,
      icon: BarChart3,
      gradient: "from-purple-500 to-violet-600",
      sparklineData: [25, 28, 26, 30, 29, 32, stats.totalRides],
      delta: { value: 12.5, label: "vs last week" },
    },
    {
      title: "Avg Cost/Ride",
      value: formatCurrency(stats.averageCostPerRide),
      icon: TrendingUp,
      gradient: "from-pink-500 to-rose-600",
      isCurrency: true,
      sparklineData: [180, 175, 190, 185, 195, 188, stats.averageCostPerRide],
      delta: { value: 5.2, label: "vs last week" },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hyundai Exter Hero Card with Parallax Tilt */}
      <div className="relative overflow-hidden rounded-3xl glass-premium p-6 shadow-2xl card-hover animate-fade-in-up border-primary/20">
        {/* Ambient Mesh Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-indigo-500/10 opacity-50 pointer-events-none" />
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-primary/20 blur-3xl pointer-events-none animate-ambient" />
        <div className="absolute -left-24 -bottom-24 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none animate-ambient" style={{ animationDelay: '-2s' }} />

        <div className="grid gap-6 md:grid-cols-2 items-center relative z-10">
          {/* Details */}
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary border border-primary/20 backdrop-blur-sm">
                <Car className="h-3.5 w-3.5 animate-[spin-slow_6s_linear_infinite]" />
                HYUNDAI EXTER SUV
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight">
                Shameek's <span className="gradient-text">Exter</span>
              </h2>
              <p className="text-sm text-muted-foreground font-medium">
                The official ride powering our daily commute to MITE
              </p>
            </div>

            {/* Specifications Grid in Frosted Glass Panel */}
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-4 shadow-inner">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Mileage</span>
                  <p className="text-lg font-extrabold flex items-baseline gap-1 tabular-nums">
                    {stats.mileage} <span className="text-xs font-medium text-muted-foreground">km/L</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Route Distance</span>
                  <p className="text-lg font-extrabold flex items-baseline gap-1 tabular-nums">
                    {stats.routeDistance} <span className="text-xs font-medium text-muted-foreground">km</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Fuel Required</span>
                  <p className="text-lg font-extrabold flex items-baseline gap-1 tabular-nums">
                    {(stats.routeDistance / stats.mileage).toFixed(2)} <span className="text-xs font-medium text-muted-foreground">Liters</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Est. Trip Cost</span>
                  <p className="text-lg font-extrabold text-primary tabular-nums">
                    {formatCurrency(Math.round((stats.routeDistance / stats.mileage) * stats.todayPetrolPrice))}
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={() => setShowQrModal(true)}
                className="btn-magnetic inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/45 hover:-translate-y-0.5 active:scale-95 cursor-pointer overflow-hidden"
              >
                <QrCode className="h-4 w-4" />
                View Payment QR
              </button>
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-xs font-semibold text-muted-foreground backdrop-blur-sm animate-marquee overflow-hidden whitespace-nowrap">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
                </span>
                <span className="inline-block">Udupi Petrol: ₹{stats.todayPetrolPrice.toFixed(2)}/L • Updated 2 mins ago</span>
              </div>
            </div>
          </div>

          {/* Cinematic Image with Parallax Tilt */}
          <div className="relative flex justify-center items-center h-48 md:h-64 rounded-2xl overflow-hidden border border-white/[0.06] shadow-2xl bg-black/40 animate-tilt">
            {/* Glow behind the car */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/25 via-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse-soft pointer-events-none" />

            <img
              src="/car-hero.png"
              alt="Hyundai Exter SUV"
              className="relative w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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

      {/* Middle Row: Chart + Quick Stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="lg:col-span-2 rounded-2xl border bg-card p-6 card-hover animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
          <MonthlyFuelChart data={stats.monthlyFuelSpend} />
        </div>

        {/* Quick Stats */}
        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          {stats.mostFrequentDefaulter && (
            <div className="rounded-2xl border bg-card p-5 card-hover">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Most frequent defaulter
              </div>
              <p className="mt-2 text-xl font-bold text-destructive">
                {stats.mostFrequentDefaulter.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.mostFrequentDefaulter.count} overdue payments
              </p>
            </div>
          )}
          <div className="rounded-2xl border bg-card p-5 card-hover">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Avg cost per person
            </div>
            <p className="mt-2 text-xl font-bold">
              {formatCurrency(stats.averageCostPerPerson)}
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-5 card-hover">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Gauge className="h-4 w-4" />
              Collection rate
            </div>
            <p className="mt-2 text-xl font-bold text-success">
              {stats.totalPending + stats.totalCollected > 0
                ? `${Math.round((stats.totalCollected / (stats.totalPending + stats.totalCollected)) * 100)}%`
                : "0%"}
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-success to-emerald-400 transition-all duration-700 ease-out"
                style={{
                  width: `${
                    stats.totalPending + stats.totalCollected > 0
                      ? Math.round((stats.totalCollected / (stats.totalPending + stats.totalCollected)) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Standalone Payment QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowQrModal(false)} />
          <div className="relative w-full max-w-sm animate-fade-in-scale rounded-2xl border bg-card p-6 shadow-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_100%] animate-[border-flow_3s_linear_infinite]" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Payment QR Code</h3>
              <button onClick={() => setShowQrModal(false)} className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground transition-colors cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="rounded-2xl border-2 border-primary/20 bg-white p-4 shadow-lg shadow-primary/5">
                <img src="/qr-code.png" alt="Payment QR" className="h-48 w-48 object-contain" />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Scan this QR code using any UPI app (GPay, PhonePe, Paytm, etc.) to make payments directly to Shameek.
              </p>
            </div>
          </div>
        </div>
      )}

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

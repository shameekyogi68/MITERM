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
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getDashboardStats, getPendingPayments } from "@/app/actions/stats.actions";
import OverdueBanner from "@/components/shared/OverdueBanner";
import MonthlyFuelChart from "@/components/charts/MonthlyFuelChart";
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
    <div className="rounded-2xl border bg-card p-5 space-y-3">
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
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  delay: number;
  subtitle?: string;
  isCurrency?: boolean;
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

  return (
    <div
      className={`group relative rounded-2xl border bg-card p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 card-hover animate-fade-in-up`}
      style={{ animationDelay: `${delay * 0.06}s` }}
    >
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />

      <div className="relative">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <p className="mt-4 text-2xl font-bold tracking-tight tabular-nums">
          {isCurrency ? animatedValue : value}
        </p>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">{title}</p>
        {subtitle && (
          <p className="mt-1 text-[10px] text-muted-foreground/60">{subtitle}</p>
        )}
      </div>

      {/* Corner accent */}
      <div className={`absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-gradient-to-br ${gradient} opacity-[0.03] transition-opacity group-hover:opacity-[0.06]`} />

      {/* Bottom shine line on hover */}
      <div className={`absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
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
    },
    {
      title: "Fuel Cost Today",
      value: formatCurrency(stats.todayFuelCost),
      icon: IndianRupee,
      gradient: "from-emerald-500 to-emerald-600",
      isCurrency: true,
    },
    {
      title: "Pending Amount",
      value: formatCurrency(stats.totalPending),
      icon: Clock,
      gradient: "from-orange-500 to-amber-600",
      isCurrency: true,
    },
    {
      title: "Total Collected",
      value: formatCurrency(stats.totalCollected),
      icon: CreditCard,
      gradient: "from-green-500 to-emerald-600",
      isCurrency: true,
    },
    {
      title: "Pending Members",
      value: stats.pendingCount,
      icon: Users,
      gradient: "from-yellow-500 to-orange-600",
      subtitle: `${stats.overdueCount} overdue`,
    },
    {
      title: "Paid Members",
      value: stats.paidCount,
      icon: CheckCircle2,
      gradient: "from-teal-500 to-green-600",
    },
    {
      title: "Total Rides",
      value: stats.totalRides,
      icon: BarChart3,
      gradient: "from-purple-500 to-violet-600",
    },
    {
      title: "Avg Cost/Ride",
      value: formatCurrency(stats.averageCostPerRide),
      icon: TrendingUp,
      gradient: "from-pink-500 to-rose-600",
      isCurrency: true,
    },
  ];

  return (
    <div className="space-y-6">
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

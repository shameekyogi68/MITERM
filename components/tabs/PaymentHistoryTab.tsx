"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, CheckCircle2, Filter, ArrowDownToLine, TrendingUp, IndianRupee, Calendar, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { getPaymentHistory } from "@/app/actions/stats.actions";
import { exportRides } from "@/app/actions/export.actions";
import { ALL_MEMBERS } from "@/lib/constants";
import { useToast } from "@/components/shared/Toast";

interface PaymentRecord {
  id: string;
  rideId: string;
  memberName: string;
  amount: number;
  rideDate: Date;
  paidAt: Date;
}

export default function PaymentHistoryTab() {
  const { addToast } = useToast();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const now = new Date();
      let fromDate: Date | undefined;
      let toDate: Date | undefined;

      if (dateFilter === "this-month") {
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (dateFilter === "last-month") {
        fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        toDate = new Date(now.getFullYear(), now.getMonth(), 0);
      }

      const data = await getPaymentHistory({ fromDate, toDate });
      setPayments(
        data.map((a: any) => ({
          id: a.id,
          rideId: a.rideId,
          memberName: a.member.name,
          amount: a.share,
          rideDate: a.ride.date,
          paidAt: a.paidAt!,
        })),
      );
    } catch (err) {
      console.error("PaymentHistory fetch error:", err);
      setFetchError("Failed to load payment history. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch = p.memberName.toLowerCase().includes(search.toLowerCase());
      const matchesMember = memberFilter === "all" || p.memberName === memberFilter;
      return matchesSearch && matchesMember;
    });
  }, [payments, search, memberFilter]);

  const totalCollected = filtered.reduce((sum, p) => sum + p.amount, 0);
  const uniqueMembers = [...new Set(filtered.map((p) => p.memberName))].length;
  const avgPayment = filtered.length > 0 ? totalCollected / filtered.length : 0;

  const handleExport = async (format: "json" | "csv") => {
    let url: string | null = null;
    try {
      const result = await exportRides(format);
      if (result.filename === "error.json") {
        try {
          const errObj = JSON.parse(result.data);
          if (errObj.error) {
            addToast("error", errObj.error);
            return;
          }
        } catch {}
      }

      const blob = new Blob([result.data], { type: result.contentType });
      url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export error:", err);
      addToast("error", "Failed to export rides.");
    } finally {
      if (url) {
        URL.revokeObjectURL(url);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl glass-premium p-3 sm:p-5 space-y-3">
              <div className="skeleton h-8 w-8 sm:h-10 sm:w-10 rounded-xl" />
              <div className="skeleton h-6 w-16" />
              <div className="skeleton h-3 w-20" />
            </div>
          ))}
        </div>
        <div className="skeleton h-12 rounded-full" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-4">
        <div className="h-14 w-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <p className="font-bold text-foreground">{fetchError}</p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white touch-manipulation active:scale-95"
          style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Summary Stat Cards — glass-premium */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div
          className="group glass-premium rounded-2xl p-3 sm:p-5 transition-all duration-300 hover:-translate-y-1 card-hover animate-fade-in-up"
          style={{ animationDelay: "0.05s" }}
        >
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
            <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <p className="mt-2 sm:mt-3 text-lg sm:text-2xl font-bold tracking-tight gradient-text stat-number truncate">
            {formatCurrency(totalCollected)}
          </p>
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.1em] font-medium text-muted-foreground leading-tight">Total Collected</p>
        </div>

        <div
          className="group glass-premium rounded-2xl p-3 sm:p-5 transition-all duration-300 hover:-translate-y-1 card-hover animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110" style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <p className="mt-2 sm:mt-3 text-lg sm:text-2xl font-bold tracking-tight tabular-nums stat-number truncate">
            {formatCurrency(avgPayment)}
          </p>
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.1em] font-medium text-muted-foreground leading-tight">Avg Payment</p>
        </div>

        <div
          className="group glass-premium rounded-2xl p-3 sm:p-5 transition-all duration-300 hover:-translate-y-1 card-hover animate-fade-in-up"
          style={{ animationDelay: "0.15s" }}
        >
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110" style={{ background: "linear-gradient(135deg, #06b6d4, #0284c7)" }}>
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <p className="mt-2 sm:mt-3 text-lg sm:text-2xl font-bold tracking-tight tabular-nums stat-number">
            {filtered.length}
          </p>
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.1em] font-medium text-muted-foreground leading-tight">Records</p>
          <p className="text-[10px] text-muted-foreground/60">{uniqueMembers} members</p>
        </div>
      </div>

      {/* Filter bar — glass pills */}
      <div className="flex flex-wrap gap-2.5">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full py-3 pl-10 pr-4 text-sm transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className="select-premium rounded-full py-3 pl-9 pr-8 text-sm transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <option value="all">All Members</option>
            {ALL_MEMBERS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <select
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setSearch("");
            setMemberFilter("all");
          }}
          className="select-premium rounded-full px-4 py-3 text-sm transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <option value="all">All Time</option>
          <option value="this-month">This Month</option>
          <option value="last-month">Last Month</option>
        </select>
        <div className="flex gap-2 ml-auto">
          {/* CSV — outlined glass */}
          <button
            onClick={() => handleExport("csv")}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-3 text-sm font-medium transition-all hover:bg-[#7c3aed]/10"
            style={{ border: "1px solid rgba(124,58,237,0.4)", color: "#7c3aed" }}
          >
            <ArrowDownToLine className="h-4 w-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          {/* JSON — outlined glass */}
          <button
            onClick={() => handleExport("json")}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-3 text-sm font-medium transition-all hover:bg-[#7c3aed]/10"
            style={{ border: "1px solid rgba(124,58,237,0.4)", color: "#7c3aed" }}
          >
            <ArrowDownToLine className="h-4 w-4" />
            <span className="hidden sm:inline">JSON</span>
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="relative flex flex-col items-center justify-center py-20 overflow-hidden rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
          <div className="flex flex-col items-center gap-4">
            {/* Animated rising chart SVG */}
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <defs>
                <linearGradient id="chartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <rect x="10" y="50" width="12" height="20" rx="3" fill="url(#chartGrad)" opacity="0.4" style={{ animation: "fadeInUp 0.4s ease-out 0.1s both" }} />
              <rect x="28" y="35" width="12" height="35" rx="3" fill="url(#chartGrad)" opacity="0.6" style={{ animation: "fadeInUp 0.4s ease-out 0.2s both" }} />
              <rect x="46" y="20" width="12" height="50" rx="3" fill="url(#chartGrad)" opacity="0.8" style={{ animation: "fadeInUp 0.4s ease-out 0.3s both" }} />
              <rect x="64" y="10" width="12" height="60" rx="3" fill="url(#chartGrad)" style={{ animation: "fadeInUp 0.4s ease-out 0.4s both" }} />
              <polyline
                points="16,50 34,35 52,20 70,10"
                stroke="url(#chartGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                style={{ animation: "fadeInUp 0.5s ease-out 0.2s both" }}
              />
            </svg>
            <div className="text-center">
              <p className="text-xl font-bold" style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                No history yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">Payment records will appear here</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="block md:hidden space-y-3">
            {filtered.map((p, i) => (
              <div
                key={`${p.id}-${i}`}
                className="glass-premium rounded-2xl p-4 flex flex-col gap-2.5 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-sm text-white">{p.memberName}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Paid: {formatDateTime(p.paidAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm tabular-nums" style={{ color: "#06b6d4" }}>
                      {formatCurrency(p.amount)}
                    </p>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-success/15 px-2 py-0.5 text-[9px] font-bold text-success uppercase mt-1">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Paid
                    </span>
                  </div>
                </div>
                <div className="h-px bg-white/5 w-full" />
                <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                  <span>Ride Date</span>
                  <span className="font-bold text-white/95">{formatDate(p.rideDate)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-2xl glass-premium animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    className="border-b"
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      background: "rgba(15,17,23,0.9)",
                    }}
                  >
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Payment Date</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Member</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Amount</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Ride Date</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filtered.map((p, i) => (
                    <tr
                      key={`${p.id}-${i}`}
                      className="group transition-all duration-200 animate-fade-in"
                      style={{
                        animationDelay: `${i * 0.02}s`,
                        background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.04)";
                        (e.currentTarget as HTMLTableRowElement).style.borderLeft = "2px solid #7c3aed";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent";
                        (e.currentTarget as HTMLTableRowElement).style.borderLeft = "";
                      }}
                    >
                      <td className="px-5 py-3.5 text-sm">{formatDateTime(p.paidAt)}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-medium">{p.memberName}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold tabular-nums" style={{ color: "#06b6d4" }}>
                          {formatCurrency(p.amount)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{formatDate(p.rideDate)}</td>
                      <td className="px-5 py-3.5">
                        <span className="badge-premium bg-success/10 text-success">
                          <CheckCircle2 className="h-3 w-3" />
                          Paid
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Bar */}
          <div className="flex items-center justify-between glass-premium rounded-2xl px-6 py-4 text-sm">
            <span className="text-muted-foreground">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-bold gradient-text text-lg stat-number">
                {formatCurrency(totalCollected)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

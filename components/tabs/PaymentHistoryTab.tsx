"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Download, Search, CheckCircle2, Filter, ArrowDownToLine, TrendingUp, IndianRupee, Calendar } from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { getPaymentHistory } from "@/app/actions/stats.actions";
import { exportRides } from "@/app/actions/export.actions";
import { ALL_MEMBERS } from "@/lib/constants";

interface PaymentRecord {
  id: string;
  rideId: string;
  memberName: string;
  amount: number;
  rideDate: Date;
  paidAt: Date;
}

export default function PaymentHistoryTab() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
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
    setIsLoading(false);
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
    const result = await exportRides(format);
    const blob = new Blob([result.data], { type: result.contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border bg-card p-5 space-y-3">
              <div className="skeleton h-10 w-10 rounded-xl" />
              <div className="skeleton h-8 w-24" />
              <div className="skeleton h-4 w-20" />
            </div>
          ))}
        </div>
        <div className="skeleton h-14 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Summary Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="group relative rounded-2xl border bg-card p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 card-hover animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg transition-transform duration-300 group-hover:scale-110">
              <IndianRupee className="h-5 w-5 text-white" />
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight gradient-text stat-number">
              {formatCurrency(totalCollected)}
            </p>
            <p className="text-xs font-medium text-muted-foreground">Total Collected</p>
          </div>
          <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="group relative rounded-2xl border bg-card p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 card-hover animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg transition-transform duration-300 group-hover:scale-110">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums stat-number">
              {formatCurrency(avgPayment)}
            </p>
            <p className="text-xs font-medium text-muted-foreground">Avg Payment</p>
          </div>
          <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="group relative rounded-2xl border bg-card p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 card-hover animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg transition-transform duration-300 group-hover:scale-110">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums stat-number">
              {filtered.length}
            </p>
            <p className="text-xs font-medium text-muted-foreground">Records</p>
            <p className="text-[10px] text-muted-foreground/60">
              {uniqueMembers} members
            </p>
          </div>
          <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-premium w-full rounded-xl border bg-card py-3 pl-10 pr-4 text-sm transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className="select-premium rounded-xl border bg-card py-3 pl-9 pr-8 text-sm transition-all"
          >
            <option value="all">All Members</option>
            {ALL_MEMBERS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="select-premium rounded-xl border bg-card px-4 py-3 text-sm transition-all"
        >
          <option value="all">All Time</option>
          <option value="this-month">This Month</option>
          <option value="last-month">Last Month</option>
        </select>
        <button
          onClick={() => handleExport("csv")}
          className="btn-magnetic inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95"
        >
          <ArrowDownToLine className="h-4 w-4" />
          CSV
        </button>
        <button
          onClick={() => handleExport("json")}
          className="inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-medium transition-all hover:bg-muted hover:shadow-sm"
        >
          <ArrowDownToLine className="h-4 w-4" />
          JSON
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="relative flex flex-col items-center justify-center py-20 text-muted-foreground overflow-hidden rounded-2xl border border-dashed bg-gradient-to-br from-muted/30 to-muted/10">
          <div className="absolute inset-0 dot-grid opacity-20" />
          <div className="relative flex flex-col items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/30 border border-muted animate-fade-in-scale">
              <CheckCircle2 className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold">No payments yet</p>
              <p className="text-sm text-muted-foreground mt-1">Payment records will appear here</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border transition-all hover:shadow-lg animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-sticky-header border-b bg-gradient-to-r from-primary/[0.03] to-purple-500/[0.03]">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Date</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Member</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ride Date</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((p, i) => (
                    <tr key={`${p.id}-${i}`} className="table-row-hover group transition-colors animate-fade-in" style={{ animationDelay: `${i * 0.02}s` }}>
                      <td className="px-5 py-3.5 text-sm">{formatDateTime(p.paidAt)}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-medium">{p.memberName}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-success stat-number">{formatCurrency(p.amount)}</span>
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

          {/* Premium Summary Bar */}
          <div className="flex items-center justify-between rounded-2xl border bg-gradient-to-r from-card via-card to-primary/[0.02] px-6 py-4 text-sm shadow-sm">
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

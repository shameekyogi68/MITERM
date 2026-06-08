"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowRight,
  Filter,
  Zap,
  ShieldCheck,
  TrendingDown,
  IndianRupee,
  Users,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getPendingPayments } from "@/app/actions/stats.actions";
import { adminMarkPaid } from "@/app/actions/payment.actions";
import PaymentDialog from "@/components/dialogs/PaymentDialog";
import { useRouter } from "next/navigation";

interface PendingItem {
  rideId: string;
  memberName: string;
  amount: number;
  rideDate: Date;
  status: string;
  createdAt: Date;
}

const ITEMS_PER_PAGE = 10;

export default function PendingPaymentsTab({
  isAdmin,
}: {
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [payments, setPayments] = useState<PendingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [paymentDialog, setPaymentDialog] = useState<{
    open: boolean;
    rideId: string;
    memberName: string;
    amount: number;
    rideDate: Date;
    status?: string;
  }>({ open: false, rideId: "", memberName: "", amount: 0, rideDate: new Date() });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const data = await getPendingPayments();
    setPayments(
      data.map((a: any) => ({
        rideId: a.rideId,
        memberName: a.member.name,
        amount: a.share,
        rideDate: a.ride.date,
        status: a.status,
        createdAt: a.createdAt,
      })),
    );
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const members = useMemo(
    () => [...new Set(payments.map((p) => p.memberName))],
    [payments],
  );

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch = p.memberName.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = memberFilter === "all" || p.memberName === memberFilter;
      return matchesSearch && matchesFilter;
    });
  }, [payments, search, memberFilter]);

  const overdue = filtered.filter((p) => p.status === "OVERDUE");
  const pending = filtered.filter((p) => p.status !== "OVERDUE");
  const verification = filtered.filter((p) => p.status === "VERIFICATION");

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedOverdue = overdue.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );
  const paginatedPending = pending.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const totalOverdueAmount = overdue.reduce((sum, p) => sum + p.amount, 0);
  const totalPendingAmount = pending.reduce((sum, p) => sum + p.amount, 0);
  const uniqueMembers = [...new Set(filtered.map((p) => p.memberName))].length;

  const handleBulkPay = async () => {
    if (!isAdmin) return;
    for (const p of filtered) {
      await adminMarkPaid({ rideId: p.rideId, memberName: p.memberName });
    }
    router.refresh();
    fetchData();
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
      {/* Summary Stat Cards with Circular Progress */}
      <div className="grid grid-cols-3 gap-4">
        <div className="group relative rounded-2xl border bg-card p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 card-hover animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center gap-4">
            {/* Circular Progress */}
            <div className="relative h-16 w-16 shrink-0">
              <svg className="progress-ring h-16 w-16" viewBox="0 0 100 100">
                <circle
                  className="text-muted/20"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                />
                <circle
                  className="progress-ring-circle text-orange-500"
                  strokeWidth="8"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * (pending.length / (pending.length + overdue.length + uniqueMembers) || 0))}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight tabular-nums stat-number">
                {pending.length}
              </p>
              <p className="text-xs font-medium text-muted-foreground">Pending</p>
              <p className="text-[10px] text-muted-foreground/60">{formatCurrency(totalPendingAmount)}</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="group relative rounded-2xl border bg-card p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 card-hover animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center gap-4">
            {/* Circular Progress */}
            <div className="relative h-16 w-16 shrink-0">
              <svg className="progress-ring h-16 w-16" viewBox="0 0 100 100">
                <circle
                  className="text-muted/20"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                />
                <circle
                  className="progress-ring-circle text-red-500"
                  strokeWidth="8"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * (overdue.length / (pending.length + overdue.length + uniqueMembers) || 0))}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-destructive tabular-nums stat-number">
                {overdue.length}
              </p>
              <p className="text-xs font-medium text-destructive">Overdue</p>
              <p className="text-[10px] text-destructive/60">{formatCurrency(totalOverdueAmount)}</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="group relative rounded-2xl border bg-card p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 card-hover animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center gap-4">
            {/* Circular Progress */}
            <div className="relative h-16 w-16 shrink-0">
              <svg className="progress-ring h-16 w-16" viewBox="0 0 100 100">
                <circle
                  className="text-muted/20"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                />
                <circle
                  className="progress-ring-circle text-purple-500"
                  strokeWidth="8"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * (uniqueMembers / (pending.length + overdue.length + uniqueMembers) || 0))}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight tabular-nums stat-number">
                {uniqueMembers}
              </p>
              <p className="text-xs font-medium text-muted-foreground">Members</p>
              <p className="text-[10px] text-muted-foreground/60">
                {verification.length} verifying
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {filtered.length} payment{filtered.length !== 1 ? "s" : ""} pending
          </p>
        </div>
        {isAdmin && filtered.length > 0 && (
          <button
            onClick={handleBulkPay}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95"
          >
            <Zap className="h-4 w-4" />
            Mark All Paid
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by member name..."
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
            {members.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="relative flex flex-col items-center justify-center py-20 text-muted-foreground overflow-hidden rounded-2xl border border-dashed bg-gradient-to-br from-success/5 to-emerald-500/5">
          <div className="absolute inset-0 dot-grid opacity-30" />
          <div className="relative flex flex-col items-center gap-4">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-success/10 to-emerald-500/10 border border-success/20 animate-fade-in-scale">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-success text-white text-xs font-bold animate-scale-in">
                ✓
              </div>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold gradient-text">All Clear!</p>
              <p className="text-sm text-muted-foreground mt-1">Everyone is paid up — no pending payments</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Overdue Section */}
          {paginatedOverdue.length > 0 && (
            <div className="group overflow-hidden rounded-2xl border border-destructive/30 transition-all hover:shadow-lg hover:shadow-destructive/5 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="bg-gradient-to-r from-destructive/[0.08] to-destructive/[0.03] px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 animate-pulse-soft">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-destructive">
                        Overdue Payments
                      </h3>
                      <p className="text-xs text-destructive/70">
                        {overdue.length} overdue • {formatCurrency(totalOverdueAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse-soft" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-destructive/[0.02]">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ride Date</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Member</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-destructive/5">
                    {paginatedOverdue.map((item, i) => (
                      <tr key={`overdue-${item.rideId}-${item.memberName}-${i}`} className="group hover:bg-destructive/[0.02] transition-colors animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                        <td className="px-5 py-3.5 text-sm">{formatDate(item.rideDate)}</td>
                        <td className="px-5 py-3.5">
                          <span className="font-medium">{item.memberName}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-destructive stat-number">{formatCurrency(item.amount)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                            <Zap className="h-3 w-3" />
                            Overdue
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() =>
                              setPaymentDialog({
                                open: true,
                                rideId: item.rideId,
                                memberName: item.memberName,
                                amount: item.amount,
                                rideDate: item.rideDate,
                                status: item.status,
                              })
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl bg-destructive px-3.5 py-2 text-xs font-semibold text-destructive-foreground shadow-lg shadow-destructive/20 transition-all hover:shadow-xl hover:shadow-destructive/30 hover:brightness-110 active:scale-95"
                          >
                            Pay Now <ArrowRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pending Section */}
          {paginatedPending.length > 0 && (
            <div className="group overflow-hidden rounded-2xl border border-warning/30 transition-all hover:shadow-lg hover:shadow-warning/5 animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
              <div className="bg-gradient-to-r from-warning/[0.08] to-warning/[0.03] px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
                      <Clock className="h-4 w-4 text-warning" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-warning">
                        Pending Payments
                      </h3>
                      <p className="text-xs text-warning/70">
                        {pending.length} pending • {formatCurrency(totalPendingAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-warning/[0.02]">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ride Date</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Member</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warning/5">
                    {paginatedPending.map((item, i) => (
                      <tr key={`pending-${item.rideId}-${item.memberName}-${i}`} className="group hover:bg-warning/[0.02] transition-colors animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                        <td className="px-5 py-3.5 text-sm">{formatDate(item.rideDate)}</td>
                        <td className="px-5 py-3.5">
                          <span className="font-medium">{item.memberName}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold stat-number">{formatCurrency(item.amount)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                              item.status === "VERIFICATION"
                                ? "bg-verification/10 text-verification"
                                : "bg-warning/10 text-warning"
                            }`}
                          >
                            {item.status === "VERIFICATION" ? (
                              <><ShieldCheck className="h-3 w-3" /> Verification</>
                            ) : (
                              <><Clock className="h-3 w-3" /> Pending</>
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() =>
                              setPaymentDialog({
                                open: true,
                                rideId: item.rideId,
                                memberName: item.memberName,
                                amount: item.amount,
                                rideDate: item.rideDate,
                                status: item.status,
                              })
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-95"
                          >
                            Pay Now <ArrowRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-2xl border bg-card px-5 py-3 text-sm">
              <p className="text-muted-foreground">
                Showing {Math.min(filtered.length, ITEMS_PER_PAGE)} of {filtered.length}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-xl border bg-card px-4 py-2 text-sm transition-all hover:bg-muted hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded-xl border bg-card px-4 py-2 text-sm transition-all hover:bg-muted hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
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

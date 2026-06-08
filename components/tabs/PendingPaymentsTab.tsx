"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search, AlertTriangle, Clock, CheckCircle2,
  ChevronLeft, ChevronRight, ArrowRight,
  Filter, Zap, ShieldCheck, Users, ExternalLink, RefreshCw,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getPendingPayments } from "@/app/actions/stats.actions";
import { adminMarkPaid } from "@/app/actions/payment.actions";
import { getSetting } from "@/app/actions/settings.actions";
import PaymentDialog from "@/components/dialogs/PaymentDialog";
import { useToast } from "@/components/shared/Toast";
import { useRouter } from "next/navigation";

interface PendingItem {
  rideId: string; memberName: string; amount: number;
  rideDate: Date; status: string; createdAt: Date;
}

const ITEMS_PER_PAGE = 10;

const AVATAR_GRADIENTS = [
  "from-violet-500 to-purple-600", "from-cyan-500 to-blue-600",
  "from-amber-500 to-orange-600", "from-rose-500 to-pink-600",
  "from-emerald-500 to-teal-600", "from-indigo-500 to-violet-600",
];

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-success/10 text-success border border-success/20",
  PENDING: "bg-warning/10 text-warning border border-warning/20",
  OVERDUE: "bg-destructive/10 text-destructive border border-destructive/20",
  VERIFICATION: "bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/20",
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}
function getAvatarGradient(name: string) {
  const sum = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length];
}

export default function PendingPaymentsTab({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [payments, setPayments] = useState<PendingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isBulkPaying, setIsBulkPaying] = useState(false);
  const [search, setSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [adminPhone, setAdminPhone] = useState("7338603959");
  const [paymentDialog, setPaymentDialog] = useState<{
    open: boolean; rideId: string; memberName: string;
    amount: number; rideDate: Date; status?: string;
  }>({ open: false, rideId: "", memberName: "", amount: 0, rideDate: new Date() });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
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
    } catch (err) {
      console.error("PendingPayments fetch error:", err);
      setFetchError("Failed to load payments. Tap refresh.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    getSetting("adminPhone")
      .then((val) => { if (typeof val === "string" && val) setAdminPhone(val); })
      .catch(() => {});
  }, [fetchData]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, memberFilter]);

  const members = useMemo(
    () => [...new Set(payments.map((p) => p.memberName))].sort(),
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

  const totalOverdueAmount = overdue.reduce((sum, p) => sum + p.amount, 0);
  const totalPendingAmount = pending.reduce((sum, p) => sum + p.amount, 0);
  const uniqueMembers = [...new Set(filtered.map((p) => p.memberName))].length;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleBulkPay = useCallback(async () => {
    if (!isAdmin || isBulkPaying) return;
    setIsBulkPaying(true);
    try {
      const results = await Promise.allSettled(
        filtered.map((p) => adminMarkPaid({ rideId: p.rideId, memberName: p.memberName })),
      );
      const failures = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.success));
      if (failures.length > 0) {
        addToast("warning", `${filtered.length - failures.length} marked paid, ${failures.length} failed.`);
      } else {
        addToast("success", `All ${filtered.length} payments marked as paid!`);
      }
      router.refresh();
      await fetchData();
    } catch (err) {
      addToast("error", "Bulk pay failed. Please try again.");
    } finally {
      setIsBulkPaying(false);
    }
  }, [isAdmin, isBulkPaying, filtered, addToast, router, fetchData]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl glass-premium p-3 sm:p-4 space-y-2">
              <div className="skeleton h-8 w-8 rounded-xl" />
              <div className="skeleton h-6 w-12" />
              <div className="skeleton h-3 w-16" />
            </div>
          ))}
        </div>
        <div className="skeleton h-12 rounded-full" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-4">
        <div className="h-14 w-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <p className="font-bold text-foreground">{fetchError}</p>
          <p className="text-sm text-muted-foreground mt-1">Check your connection and try again.</p>
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
      {/* ── Summary Pills ── */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="glass-premium rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(245,158,11,0.1)" }}>
            <Clock className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#f59e0b" }} />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-light tabular-nums leading-none" style={{ color: "#f59e0b" }}>{pending.length}</p>
            <p className="text-[9px] sm:text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium leading-tight mt-0.5">Pending</p>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground/60 truncate">{formatCurrency(totalPendingAmount)}</p>
          </div>
        </div>

        <div className="glass-premium rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(244,63,94,0.1)" }}>
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#f43f5e" }} />
            {overdue.length > 0 && <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive animate-pulse-overdue" />}
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-light tabular-nums leading-none" style={{ color: "#f43f5e" }}>{overdue.length}</p>
            <p className="text-[9px] sm:text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium leading-tight mt-0.5">Overdue</p>
            <p className="text-[9px] sm:text-[10px] truncate" style={{ color: "rgba(244,63,94,0.6)" }}>{formatCurrency(totalOverdueAmount)}</p>
          </div>
        </div>

        <div className="glass-premium rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(124,58,237,0.1)" }}>
            <Users className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#7c3aed" }} />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-light tabular-nums leading-none" style={{ color: "#7c3aed" }}>{uniqueMembers}</p>
            <p className="text-[9px] sm:text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium leading-tight mt-0.5">Members</p>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground/60">{verification.length} verifying</p>
          </div>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {filtered.length} payment{filtered.length !== 1 ? "s" : ""} pending
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            aria-label="Refresh"
            className="h-9 w-9 flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-muted-foreground hover:text-white transition-colors touch-manipulation"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {isAdmin && filtered.length > 0 && (
            <button
              onClick={handleBulkPay}
              disabled={isBulkPaying}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              style={{ background: "linear-gradient(to right, #7c3aed, #6d28d9)", boxShadow: "0 4px 15px rgba(124,58,237,0.3)" }}
            >
              {isBulkPaying
                ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />Paying...</>
                : <><Zap className="h-4 w-4" />Mark All Paid</>}
            </button>
          )}
        </div>
      </div>

      {/* ── Search & Filter ── */}
      <div className="flex gap-2.5">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full py-3 pl-10 pr-4 text-sm transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          />
        </div>
        <div className="relative shrink-0">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className="select-premium rounded-full py-3 pl-9 pr-8 text-sm transition-all max-w-[140px] sm:max-w-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <option value="all">All Members</option>
            {members.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* ── Empty State ── */}
      {filtered.length === 0 ? (
        <div className="relative flex flex-col items-center justify-center py-20 overflow-hidden rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
          <div className="flex flex-col items-center gap-4">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <defs>
                <linearGradient id="checkGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <circle cx="40" cy="40" r="36" stroke="url(#checkGrad2)" strokeWidth="3" fill="rgba(124,58,237,0.06)" />
              <polyline points="24,40 35,52 56,28" stroke="url(#checkGrad2)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                All Clear!
              </p>
              <p className="text-sm text-muted-foreground mt-1">Everyone is paid up</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ── Cards ── */}
          <div className="space-y-3">
            {paginatedItems.map((item, i) => {
              const initials = getInitials(item.memberName);
              const avatarGradient = getAvatarGradient(item.memberName);
              const statusStyle = STATUS_STYLES[item.status] || STATUS_STYLES.PENDING;
              const cleanPhone = adminPhone.replace(/\D/g, "");
              const whatsappPhone = cleanPhone.startsWith("91") && cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone}`;

              return (
                <div
                  key={`${item.rideId}-${item.memberName}-${i}`}
                  className="glass-premium rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 animate-fade-in-up transition-all duration-200"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  {/* Avatar + Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient} text-white text-xs sm:text-sm font-bold shadow-md`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between sm:justify-start gap-2">
                        <p className="font-extrabold text-sm sm:text-base text-white truncate">{item.memberName}</p>
                        <span className={`inline-flex sm:hidden items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide shrink-0 ${statusStyle}`}>
                          {item.status === "OVERDUE" && <AlertTriangle className="h-2.5 w-2.5" />}
                          {item.status === "VERIFICATION" && <ShieldCheck className="h-2.5 w-2.5" />}
                          {item.status === "PENDING" && <Clock className="h-2.5 w-2.5" />}
                          {item.status === "PAID" && <CheckCircle2 className="h-2.5 w-2.5" />}
                          {item.status}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{formatDate(item.rideDate)}</p>
                    </div>
                  </div>

                  <div className="block sm:hidden h-px bg-white/5 w-full" />

                  {/* Amount + Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-left sm:text-right shrink-0">
                      <p className="text-[9px] sm:hidden text-muted-foreground uppercase font-bold tracking-wider">Amount Due</p>
                      <p className="font-extrabold text-base sm:text-sm tabular-nums" style={{ color: "#06b6d4" }}>
                        {formatCurrency(item.amount)}
                      </p>
                    </div>

                    <span className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide shrink-0 ${statusStyle}`}>
                      {item.status === "OVERDUE" && <AlertTriangle className="h-3 w-3" />}
                      {item.status === "VERIFICATION" && <ShieldCheck className="h-3 w-3" />}
                      {item.status === "PENDING" && <Clock className="h-3 w-3" />}
                      {item.status === "PAID" && <CheckCircle2 className="h-3 w-3" />}
                      {item.status}
                    </span>

                    {isAdmin ? (
                      <button
                        onClick={() => setPaymentDialog({ open: true, rideId: item.rideId, memberName: item.memberName, amount: item.amount, rideDate: item.rideDate, status: item.status })}
                        className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 sm:py-2 text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95 cursor-pointer shadow-md shadow-primary/10 touch-manipulation"
                        style={{ background: "linear-gradient(to right, #7c3aed, #6d28d9)" }}
                      >
                        {item.status === "VERIFICATION" ? "Verify" : "Mark Paid"}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : item.status === "VERIFICATION" ? (
                      <a
                        href={`https://api.whatsapp.com/send?phone=${whatsappPhone}&text=${encodeURIComponent(`Hi, please verify my payment of ₹${item.amount} for the ride on ${new Date(item.rideDate).toLocaleDateString("en-IN")}.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 sm:py-2 text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95 touch-manipulation"
                        style={{ background: "linear-gradient(to right, #10b981, #059669)" }}
                      >
                        Ask to Review
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <button
                        onClick={() => setPaymentDialog({ open: true, rideId: item.rideId, memberName: item.memberName, amount: item.amount, rideDate: item.rideDate, status: item.status })}
                        className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 sm:py-2 text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95 cursor-pointer touch-manipulation"
                        style={{ background: "linear-gradient(to right, #7c3aed, #6d28d9)" }}
                      >
                        Pay Now
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between glass-premium rounded-2xl px-4 py-3 text-sm">
              <p className="text-muted-foreground">
                {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm transition-all hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                <span className="flex items-center text-muted-foreground text-xs px-1">{page}/{totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm transition-all hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

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
        onSuccess={() => { fetchData(); router.refresh(); }}
      />
    </div>
  );
}

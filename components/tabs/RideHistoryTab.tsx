"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Copy,
  Trash2,
  CheckCircle2,
  Clock,
  Loader2,
  ArrowRight,
  Fuel,
  AlertTriangle,
  PlusCircle,
} from "lucide-react";
import { format } from "date-fns";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getRides, deleteRide, duplicateRide } from "@/app/actions/ride.actions";
import PaymentDialog from "@/components/dialogs/PaymentDialog";

interface RideAttendee {
  id: string;
  member: { name: string };
  share: number;
  status: string;
  weight: number;
}

interface Expense {
  id: string;
  type: string;
  amount: number;
  description: string | null;
}

interface Ride {
  id: string;
  date: Date;
  petrolPrice: number;
  fuelCost: number;
  totalCost: number;
  status: string;
  notes: string | null;
  attendees: RideAttendee[];
  expenses: Expense[];
}

function parseRoute(notes: string | null): { from: string; to: string } {
  if (notes && notes.includes("→")) {
    const parts = notes.split("→");
    return { from: parts[0].trim(), to: parts[1].trim() };
  }
  return { from: "Home", to: "MITE" };
}

export default function RideHistoryTab({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicateDialog, setDuplicateDialog] = useState<{
    open: boolean;
    rideId: string;
    date: string;
  }>({ open: false, rideId: "", date: "" });
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
    const data = await getRides({ page, limit: 10 });
    setRides(data.rides as unknown as Ride[]);
    setTotal(data.total);
    setIsLoading(false);
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (rideId: string) => {
    setDeleting(rideId);
    setError(null);
    const result = await deleteRide(rideId);
    if (result.success) {
      fetchData();
      router.refresh();
    } else {
      setError(result.error ?? "Failed to delete ride.");
    }
    setDeleting(null);
  };

  const handleDuplicate = async () => {
    if (!duplicateDialog.open) return;
    const result = await duplicateRide(duplicateDialog.rideId, new Date(duplicateDialog.date));
    if (result.success) {
      setDuplicateDialog({ open: false, rideId: "", date: "" });
      fetchData();
      router.refresh();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-1 text-xs font-semibold text-success border border-success/20">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </span>
        );
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-warning/10 px-3 py-1 text-xs font-semibold text-warning border border-warning/20">
            <Clock className="h-3 w-3" />
            Active
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1 text-xs font-semibold text-muted-foreground">
            {status}
          </span>
        );
    }
  };

  const getPaymentIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "VERIFICATION":
        return <Clock className="h-4 w-4 text-verification" />;
      case "OVERDUE":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-5 py-3 text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#7c3aed" }} />
            <p className="text-sm text-muted-foreground">Loading rides...</p>
          </div>
        </div>
      ) : rides.length === 0 ? (
        /* Empty State */
        <div className="relative flex flex-col items-center justify-center py-20 overflow-hidden rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
          <div className="flex flex-col items-center gap-4">
            {/* Animated calendar SVG */}
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <defs>
                <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <rect x="8" y="14" width="64" height="58" rx="8" stroke="url(#calGrad)" strokeWidth="2.5" fill="rgba(124,58,237,0.06)" style={{ animation: "fadeInScale 0.4s ease-out" }} />
              <line x1="8" y1="30" x2="72" y2="30" stroke="url(#calGrad)" strokeWidth="2" />
              <rect x="22" y="6" width="6" height="16" rx="3" fill="url(#calGrad)" style={{ animation: "fadeInUp 0.4s ease-out 0.1s both" }} />
              <rect x="52" y="6" width="6" height="16" rx="3" fill="url(#calGrad)" style={{ animation: "fadeInUp 0.4s ease-out 0.2s both" }} />
              <rect x="20" y="40" width="10" height="10" rx="2" fill="url(#calGrad)" opacity="0.5" />
              <rect x="35" y="40" width="10" height="10" rx="2" fill="url(#calGrad)" opacity="0.7" />
              <rect x="50" y="40" width="10" height="10" rx="2" fill="url(#calGrad)" />
              <rect x="20" y="55" width="10" height="10" rx="2" fill="url(#calGrad)" opacity="0.3" />
              <rect x="35" y="55" width="10" height="10" rx="2" fill="url(#calGrad)" opacity="0.5" />
            </svg>
            <div className="text-center">
              <p className="text-xl font-bold" style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                No rides yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">Create your first ride to see history</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  const tabEvent = new CustomEvent("tabchange", { detail: "create" });
                  window.dispatchEvent(tabEvent);
                }}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white mt-2 transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
                style={{ background: "linear-gradient(to right, #7c3aed, #6d28d9)", boxShadow: "0 4px 15px rgba(124,58,237,0.3)" }}
              >
                <PlusCircle className="h-4 w-4" />
                Create First Ride
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="relative space-y-4">
          {/* Timeline vertical line */}
          <div className="absolute left-[27px] top-8 bottom-0 w-0.5" style={{ background: "linear-gradient(to bottom, rgba(124,58,237,0.4), rgba(124,58,237,0.1), transparent)" }} />

          {rides.map((ride, rideIndex) => {
            const isExpanded = expandedId === ride.id;
            const route = parseRoute(ride.notes);
            const rideDate = new Date(ride.date);

            return (
              <div
                key={ride.id}
                className="relative pl-14 animate-fade-in-up"
                style={{ animationDelay: `${rideIndex * 0.05}s` }}
              >
                {/* Timeline dot */}
                <div
                  className="absolute left-[8px] top-4 h-10 w-10 rounded-full border-4 z-10 flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                    borderColor: "#08090d",
                    boxShadow: "0 0 12px rgba(124,58,237,0.4)",
                  }}
                >
                  <span className="text-[10px] font-bold text-white">
                    {format(rideDate, "d")}
                  </span>
                </div>

                {/* Timeline Card */}
                <div
                  className="glass-premium rounded-2xl overflow-hidden transition-all duration-300"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ""; }}
                >
                  {/* Card Header — always visible */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : ride.id)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
                  >
                    {/* Date badge */}
                    <div
                      className="flex flex-col items-center justify-center rounded-xl px-3 py-2 shrink-0"
                      style={{
                        minWidth: "52px",
                        background: "rgba(124,58,237,0.1)",
                        border: "1px solid rgba(124,58,237,0.2)",
                      }}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#7c3aed" }}>
                        {format(rideDate, "MMM")}
                      </span>
                      <span className="text-xl font-extrabold text-white leading-none">
                        {format(rideDate, "d")}
                      </span>
                    </div>

                    {/* Route + passenger chips */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{route.from}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm font-semibold">{route.to}</span>
                        {getStatusBadge(ride.status)}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {ride.attendees.slice(0, 5).map((a) => (
                          <span
                            key={a.id}
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium text-white/70"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                          >
                            {a.member.name.split(" ")[0]}
                          </span>
                        ))}
                        {ride.attendees.length > 5 && (
                          <span className="text-[10px] text-muted-foreground">+{ride.attendees.length - 5}</span>
                        )}
                      </div>
                    </div>

                    {/* Cost block */}
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Total</p>
                      <p className="text-base font-extrabold tabular-nums" style={{ color: "#06b6d4" }}>
                        {formatCurrency(ride.totalCost)}
                      </p>
                    </div>

                    <div className={`transition-transform duration-300 shrink-0 ${isExpanded ? "rotate-180" : ""}`}>
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-white/[0.06] animate-slide-down">
                      <div className="p-4 sm:p-5">
                        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                          {/* Trip Details */}
                          <div className="space-y-3">
                            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Trip Details</h4>
                            <div className="rounded-xl p-4 space-y-2.5" style={{ background: "rgba(255,255,255,0.03)" }}>
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                  <Fuel className="h-3.5 w-3.5" /> Petrol Price
                                </span>
                                <span className="font-medium">₹{ride.petrolPrice}/L</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Fuel Cost</span>
                                <span className="font-medium">{formatCurrency(ride.fuelCost)}</span>
                              </div>
                              {ride.expenses.map((exp) => (
                                <div key={exp.id} className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    {exp.type.charAt(0) + exp.type.slice(1).toLowerCase()}
                                  </span>
                                  <span className="font-medium">{formatCurrency(exp.amount)}</span>
                                </div>
                              ))}
                              <div className="border-t border-white/[0.06] pt-2 flex items-center justify-between text-sm font-bold">
                                <span>Total</span>
                                <span className="gradient-text">{formatCurrency(ride.totalCost)}</span>
                              </div>
                            </div>
                            {ride.notes && !ride.notes.includes("→") && (
                              <div className="rounded-xl p-3 text-xs text-muted-foreground italic" style={{ background: "rgba(255,255,255,0.03)" }}>
                                &ldquo;{ride.notes}&rdquo;
                              </div>
                            )}
                          </div>

                          {/* Attendees */}
                          <div className="space-y-3">
                            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Attendees & Payments</h4>
                            <div className="space-y-1.5">
                              {ride.attendees.map((a) => (
                                <div
                                  key={a.id}
                                  className="flex items-center justify-between rounded-xl px-4 py-2.5 transition-colors hover:bg-white/[0.04]"
                                  style={{ background: "rgba(255,255,255,0.03)" }}
                                >
                                  <div className="flex items-center gap-2.5">
                                    {getPaymentIcon(a.status)}
                                    <div>
                                      <span className="text-sm font-medium">{a.member.name}</span>
                                      <span className="ml-2 text-[10px] text-muted-foreground">
                                        w:{a.weight.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-sm font-semibold">{formatCurrency(a.share)}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPaymentDialog({
                                          open: true,
                                          rideId: ride.id,
                                          memberName: a.member.name,
                                          amount: a.share,
                                          rideDate: ride.date,
                                          status: a.status,
                                        });
                                      }}
                                      className="rounded-lg px-2.5 py-1 text-xs font-medium transition-all hover:shadow-sm"
                                      style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}
                                    >
                                      {a.status === "PAID" ? "View" : "Pay"}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
                          <button
                            onClick={() =>
                              setDuplicateDialog({
                                open: true,
                                rideId: ride.id,
                                date: new Date().toISOString().slice(0, 10),
                              })
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-medium transition-all hover:bg-white/[0.06]"
                            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Duplicate
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (confirm("Delete this ride permanently?")) {
                                  handleDelete(ride.id);
                                }
                              }}
                              disabled={deleting === ride.id}
                              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-medium text-destructive transition-all hover:bg-destructive/10 disabled:opacity-50"
                              style={{ border: "1px solid rgba(244,63,94,0.3)" }}
                            >
                              {deleting === ride.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Load More */}
          {total > rides.length && (
            <button
              onClick={() => setPage((p) => p + 1)}
              className="group relative w-full overflow-hidden rounded-2xl px-4 py-4 text-sm font-medium transition-all hover:bg-white/[0.04] hover:shadow-md"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span className="flex items-center justify-center gap-2">
                Load More ({total - rides.length} remaining)
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          )}
        </div>
      )}

      {/* Duplicate Dialog */}
      {duplicateDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setDuplicateDialog({ open: false, rideId: "", date: "" })} />
          <div className="relative w-full max-w-sm animate-fade-in-scale rounded-2xl glass-premium p-6 shadow-2xl">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Copy className="h-4 w-4" style={{ color: "#7c3aed" }} />
              Duplicate Ride
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">Create a copy for a new date.</p>
            <div className="mt-4 space-y-2">
              <label className="text-xs font-medium text-muted-foreground">New Date</label>
              <input
                type="date"
                value={duplicateDialog.date}
                onChange={(e) => setDuplicateDialog({ ...duplicateDialog, date: e.target.value })}
                className="w-full rounded-xl px-4 py-3 text-sm transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setDuplicateDialog({ open: false, rideId: "", date: "" })}
                className="flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all hover:bg-white/[0.06]"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDuplicate}
                disabled={!duplicateDialog.date}
                className="flex-1 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                style={{ background: "linear-gradient(to right, #7c3aed, #6d28d9)" }}
              >
                Create Copy
              </button>
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

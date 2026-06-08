"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  CalendarDays,
  ArrowRight,
  Fuel,
  IndianRupee,
  Users,
  ExternalLink,
  AlertTriangle,
  PlusCircle,
} from "lucide-react";
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

export default function RideHistoryTab({
  isAdmin,
}: {
  isAdmin: boolean;
}) {
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
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading rides...</p>
          </div>
        </div>
      ) : rides.length === 0 ? (
        <div className="relative flex flex-col items-center justify-center py-20 text-muted-foreground overflow-hidden rounded-2xl border border-dashed bg-gradient-to-br from-muted/30 to-muted/10">
          <div className="absolute inset-0 dot-grid opacity-20" />
          <div className="relative flex flex-col items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/30 border border-muted animate-fade-in-scale">
              <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold gradient-text">No rides yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first ride to see history</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                const tabEvent = new CustomEvent("tabchange", { detail: "create" });
                window.dispatchEvent(tabEvent);
              }}
              className="fab animate-bounce-in"
            >
              <PlusCircle className="h-6 w-6 text-white" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative space-y-6">
          {/* Timeline connector */}
          <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" />
          
          {rides.map((ride, rideIndex) => {
            const isExpanded = expandedId === ride.id;
            return (
              <div
                key={ride.id}
                className="group relative pl-14 animate-fade-in-up"
                style={{ animationDelay: `${rideIndex * 0.05}s` }}
              >
                {/* Timeline dot */}
                <div className="absolute left-2 top-4 h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-600 border-4 border-card shadow-lg shadow-primary/20 z-10" />
                
                <div className="group overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : ride.id)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-muted/20"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/[0.08] to-purple-500/[0.08] border border-primary/10">
                        <CalendarDays className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold">{formatDate(ride.date)}</span>
                          {getStatusBadge(ride.status)}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" /> {ride.attendees.length}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" /> {formatCurrency(ride.totalCost)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </button>

                  {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t animate-slide-down">
                    <div className="p-5">
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Trip Details */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trip Details</h4>
                          <div className="rounded-xl bg-muted/20 p-4 space-y-2.5">
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
                            <div className="border-t pt-2 flex items-center justify-between text-sm font-bold">
                              <span>Total</span>
                              <span className="gradient-text">{formatCurrency(ride.totalCost)}</span>
                            </div>
                          </div>
                          {ride.notes && (
                            <div className="rounded-xl bg-muted/20 p-3 text-xs text-muted-foreground italic">
                              &ldquo;{ride.notes}&rdquo;
                            </div>
                          )}
                        </div>

                        {/* Attendees */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attendees & Payments</h4>
                          <div className="space-y-1.5">
                            {ride.attendees.map((a) => (
                              <div
                                key={a.id}
                                className="flex items-center justify-between rounded-xl bg-muted/20 px-4 py-2.5 transition-colors hover:bg-muted/40"
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
                                    className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-all hover:bg-primary/20 hover:shadow-sm"
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
                      <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                        <button
                          onClick={() =>
                            setDuplicateDialog({
                              open: true,
                              rideId: ride.id,
                              date: new Date().toISOString().slice(0, 10),
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-4 py-2.5 text-xs font-medium transition-all hover:bg-muted hover:shadow-sm hover:border-primary/30"
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
                            className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 px-4 py-2.5 text-xs font-medium text-destructive transition-all hover:bg-destructive/10 hover:shadow-sm disabled:opacity-50"
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
              className="group relative w-full overflow-hidden rounded-2xl border bg-card px-4 py-4 text-sm font-medium transition-all hover:bg-muted/50 hover:shadow-md"
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
          <div className="relative w-full max-w-sm animate-fade-in-scale rounded-2xl border bg-card p-6 shadow-2xl">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Copy className="h-4 w-4 text-primary" />
              Duplicate Ride
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">Create a copy for a new date.</p>
            <div className="mt-4 space-y-2">
              <label className="text-xs font-medium text-muted-foreground">New Date</label>
              <input
                type="date"
                value={duplicateDialog.date}
                onChange={(e) => setDuplicateDialog({ ...duplicateDialog, date: e.target.value })}
                className="w-full rounded-xl border bg-card px-4 py-3 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setDuplicateDialog({ open: false, rideId: "", date: "" })}
                className="flex-1 rounded-xl border bg-card px-4 py-3 text-sm font-medium transition-all hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleDuplicate}
                disabled={!duplicateDialog.date}
                className="flex-1 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50"
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

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, Eye, Fuel, Users, CalendarDays, FileText,
  ArrowRight, Zap, IndianRupee, CheckCircle2,
} from "lucide-react";
import { ALL_MEMBERS, EXPENSE_TYPES } from "@/lib/constants";
import { calculateShares } from "@/lib/calculations";
import { formatCurrency } from "@/lib/utils";
import { createRide } from "@/app/actions/ride.actions";
import { getTodayPetrolPrice } from "@/app/actions/settings.actions";
import { useToast } from "@/components/shared/Toast";
import { queueAction } from "@/lib/offline-storage";

export default function CreateRideTab() {
  const router = useRouter();
  const { addToast } = useToast();
  const todayStr = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(todayStr);
  const [petrolPrice, setPetrolPrice] = useState<number>(0);
  const [suggestedPrice, setSuggestedPrice] = useState<number>(0);
  const [attendees, setAttendees] = useState<string[]>(["Shameek"]);
  const [expenses, setExpenses] = useState<Array<{
    type: "TOLL" | "PARKING" | "MAINTENANCE" | "FASTAG" | "OTHER";
    amount: number;
    description: string;
  }>>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    getTodayPetrolPrice()
      .then((p) => {
        setSuggestedPrice(p.price);
        setPetrolPrice(p.price);
      })
      .catch((err) => {
        console.error("Failed to fetch today's petrol price:", err);
        addToast("error", "Failed to fetch today's petrol price. Please enter it manually.");
      });
  }, [addToast]);

  const toggleAttendee = useCallback((name: string) => {
    if (name === "Shameek") return;
    setAttendees((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name],
    );
  }, []);

  const addExpense = useCallback(() => {
    setExpenses((prev) => [
      ...prev,
      { type: "TOLL" as const, amount: 0, description: "" },
    ]);
  }, []);

  const updateExpense = useCallback(
    (index: number, field: string, value: string | number) => {
      setExpenses((prev) =>
        prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)),
      );
    },
    [],
  );

  const removeExpense = useCallback((index: number) => {
    setExpenses((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const resetForm = useCallback(() => {
    setDate(todayStr);
    setAttendees(["Shameek"]);
    setExpenses([]);
    setNotes("");
    setPetrolPrice(suggestedPrice);
  }, [todayStr, suggestedPrice]);

  const calculationResult = useMemo(() => {
    try {
      return calculateShares({
        attendees,
        petrolPrice: petrolPrice || 0,
        additionalExpenses: expenses.map((e) => ({ type: e.type, amount: e.amount })),
      });
    } catch {
      return null;
    }
  }, [attendees, petrolPrice, expenses]);

  const canSubmit =
    attendees.length >= 2 &&
    attendees.includes("Shameek") &&
    petrolPrice > 0 &&
    !isSubmitting &&
    !success;

  const doCreateRide = useCallback(
    async (forceDuplicate = false) => {
      setIsSubmitting(true);
      try {
        let result: { success: boolean; error?: string; rideId?: string; isOffline?: boolean };
        const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

        if (isOffline) {
          const actionId = `create-ride-${Date.now()}`;
          await queueAction({
            id: actionId,
            type: "CREATE_RIDE",
            data: {
              date: new Date(date),
              petrolPrice,
              attendees,
              additionalExpenses: expenses.filter((e) => e.amount > 0),
              notes: notes.trim() || undefined,
              forceDuplicate,
            },
          });
          result = { success: true, isOffline: true };
        } else {
          result = await createRide({
            date: new Date(date),
            petrolPrice,
            attendees,
            additionalExpenses: expenses.filter((e) => e.amount > 0),
            notes: notes.trim() || undefined,
            forceDuplicate,
          });
        }

        if (result.success) {
          setSuccess(true);
          setShowDuplicateWarning(null);
          if (result.isOffline) {
            addToast("warning", "Offline! Ride logged locally and will sync when online.");
          } else {
            addToast("success", "Ride logged! Wallet damage recorded.");
          }
          router.refresh();
          setTimeout(() => {
            setSuccess(false);
            resetForm();
          }, 2000);
        } else if (!forceDuplicate && "error" in result && result.error?.startsWith("DUPLICATE:")) {
          setShowDuplicateWarning(result.error);
        } else {
          addToast("error", ("error" in result ? result.error : null) ?? "Failed to create ride. Try again.");
        }
      } catch (err) {
        console.error("createRide error:", err);
        addToast("error", "Unexpected error. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [date, petrolPrice, attendees, expenses, notes, addToast, router, resetForm],
  );

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    doCreateRide(false);
  }, [canSubmit, doCreateRide]);

  const handleDuplicateConfirm = useCallback(() => {
    doCreateRide(true);
  }, [doCreateRide]);

  return (
    <div className="animate-fade-in">
      <div className="grid gap-6 lg:grid-cols-5">
        {/* ── Form ── */}
        <div className="space-y-6 lg:col-span-3">

          {/* Date & Petrol Price */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                Date of Chariot Expedition
              </label>
              <input
                type="date"
                value={date}
                max={todayStr}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border bg-card px-4 py-3 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Fuel className="h-4 w-4" />
                Liquid Gold Price (₹/L)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number"
                    value={petrolPrice || ""}
                    onChange={(e) => setPetrolPrice(Number(e.target.value))}
                    min={1}
                    step={0.01}
                    placeholder="0.00"
                    className="w-full rounded-xl border bg-card py-3 pl-9 pr-3 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setPetrolPrice(suggestedPrice)}
                  disabled={suggestedPrice === 0}
                  className="shrink-0 rounded-xl border bg-card px-4 py-3 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground hover:border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Use today's suggested price"
                >
                  <Zap className="h-3.5 w-3.5" />
                </button>
              </div>
              {suggestedPrice > 0 && (
                <p className="text-xs text-muted-foreground">
                  Today: <span className="font-medium text-foreground">₹{suggestedPrice.toFixed(2)}</span>/L
                </p>
              )}
            </div>
          </div>

          {/* Attendees */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4" />
              Select Passengers
              <span className="ml-auto text-xs text-muted-foreground">{attendees.length}/6</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {ALL_MEMBERS.map((name) => {
                const isSelected = attendees.includes(name);
                const isShameek = name === "Shameek";
                const initials = name.slice(0, 2).toUpperCase();
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleAttendee(name)}
                    disabled={isShameek}
                    className={`group relative flex flex-col items-center justify-center gap-2 rounded-2xl border py-4 px-2 text-center transition-all duration-300 select-none touch-manipulation ${
                      isSelected
                        ? "border-primary/50 bg-gradient-to-b from-primary/[0.06] to-purple-500/[0.06] text-white shadow-lg shadow-primary/5 scale-[1.02]"
                        : "border-white/5 bg-card text-muted-foreground hover:border-white/10 hover:bg-white/[0.02] active:scale-95"
                    } ${isShameek ? "opacity-95 cursor-default" : "cursor-pointer"}`}
                  >
                    <div className={`relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br transition-all duration-300 ${
                      isSelected
                        ? "from-primary to-purple-600 shadow-md shadow-primary/25 text-white font-extrabold"
                        : "from-white/5 to-white/10 text-white/50 border border-white/5 font-semibold"
                    } text-xs group-hover:scale-105`}>
                      {initials}
                      {isSelected && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-success text-[9px] font-black text-white border-2 border-card shadow-sm animate-spring-in">✓</span>
                      )}
                    </div>
                    <span className={`text-xs font-bold transition-colors ${isSelected ? "text-white" : "text-muted-foreground"}`}>{name}</span>
                    {isShameek && <span className="text-[8px] text-primary/80 font-bold uppercase tracking-widest leading-none">Always</span>}
                  </button>
                );
              })}
            </div>
            {attendees.length < 2 && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse-soft" />
                Need at least 2 members to split the cost
              </p>
            )}
          </div>

          {/* Additional Expenses */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="h-4 w-4" />
              Additional Expenses
              <span className="ml-auto text-xs text-muted-foreground">Optional</span>
            </label>
            <div className="space-y-2">
              {expenses.map((exp, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-2 animate-fade-in">
                  <div className="flex gap-2">
                    <select
                      value={exp.type}
                      onChange={(e) => updateExpense(i, "type", e.target.value)}
                      className="flex-1 sm:w-28 sm:flex-none rounded-xl border bg-card px-3 py-3 text-sm"
                    >
                      {EXPENSE_TYPES.map((t) => (
                        <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                      ))}
                    </select>
                    <div className="relative w-28 shrink-0">
                      <IndianRupee className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="number"
                        placeholder="Amount"
                        value={exp.amount || ""}
                        onChange={(e) => updateExpense(i, "amount", Number(e.target.value))}
                        min={0}
                        className="w-full rounded-xl border bg-card py-3 pl-8 pr-3 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={exp.description}
                      onChange={(e) => updateExpense(i, "description", e.target.value)}
                      className="flex-1 rounded-xl border bg-card px-4 py-3 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeExpense(i)}
                      className="flex items-center justify-center rounded-xl border px-3 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 shrink-0 touch-manipulation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addExpense}
                className="flex items-center gap-1.5 rounded-xl border border-dashed bg-card/50 px-4 py-3 text-xs font-medium text-muted-foreground transition-all hover:bg-muted/50 hover:border-primary/30 hover:text-primary w-full justify-center touch-manipulation"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Extra Damage (Tolls, Parking, etc.)
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="h-4 w-4" />
              Notes
              <span className="ml-auto text-xs text-muted-foreground">Optional</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this ride..."
              rows={2}
              maxLength={500}
              className="w-full resize-none rounded-xl border bg-card px-4 py-3 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {/* Success message */}
          {success && (
            <div className="rounded-xl bg-success/10 border border-success/20 px-4 py-3 text-sm text-success flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Ride created! Wallet damage logged successfully.
            </div>
          )}

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 touch-manipulation"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Logging Expedition...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Log Expedition & Divide Damage
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>
        </div>

        {/* ── Live Preview ── */}
        <div className="lg:col-span-2">
          <button
            type="button"
            onClick={() => setShowPreview((p) => !p)}
            className="flex w-full items-center justify-between rounded-xl border bg-card p-4 text-sm font-medium lg:hidden hover:bg-muted/50 transition-all touch-manipulation"
          >
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              {showPreview ? "Hide" : "Show"} Preview
            </span>
            <span className={`transition-transform ${showPreview ? "rotate-180" : ""}`}>▼</span>
          </button>

          <div className={`mt-3 ${showPreview ? "block" : "hidden lg:block"}`}>
            <div className="sticky top-24 rounded-2xl border bg-gradient-to-b from-card to-card/50 shadow-lg">
              <div className="border-b bg-gradient-to-r from-primary/[0.03] to-purple-500/[0.03] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
                    <Eye className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Live Preview</h3>
                    <p className="text-[10px] text-muted-foreground">Real-time calculation</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                {calculationResult ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      {attendees.map((name, i) => {
                        const share = calculationResult.finalShares[name];
                        const weight = calculationResult.weights[name];
                        return (
                          <div
                            key={name}
                            className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-2.5 transition-colors hover:bg-muted/50 animate-fade-in-up"
                            style={{ animationDelay: `${i * 0.03}s` }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{name}</span>
                              <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">w:{weight.toFixed(2)}</span>
                            </div>
                            <span className="text-sm font-bold">{formatCurrency(share)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="rounded-xl bg-gradient-to-br from-primary/[0.03] to-purple-500/[0.03] border border-primary/10 p-4 space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fuel Cost</span>
                        <span className="font-medium">{formatCurrency(calculationResult.fuelCost)}</span>
                      </div>
                      {calculationResult.additionalTotal > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Additional</span>
                          <span className="font-medium">{formatCurrency(calculationResult.additionalTotal)}</span>
                        </div>
                      )}
                      <div className="border-t pt-1.5 flex justify-between text-base font-bold">
                        <span>Total</span>
                        <span className="gradient-text">{formatCurrency(calculationResult.totalCost)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Eye className="h-8 w-8 mb-2 text-muted-foreground/30" />
                    <p className="text-xs">Select attendees and enter price</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Duplicate Warning Dialog ── */}
      {showDuplicateWarning && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowDuplicateWarning(null)} />
          <div className="relative w-full max-w-sm animate-fade-in-scale rounded-2xl border bg-card p-6 shadow-2xl">
            <h3 className="text-lg font-semibold">Duplicate Ride</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              A ride already exists for this date. Do you want to create another one anyway?
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDuplicateWarning(null)}
                className="flex-1 rounded-xl border bg-card px-4 py-3 text-sm font-medium transition-all hover:bg-muted touch-manipulation"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDuplicateConfirm}
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-4 py-3 text-sm font-medium text-white shadow-lg disabled:opacity-50 touch-manipulation"
              >
                {isSubmitting ? "Creating..." : "Create Anyway"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

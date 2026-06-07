"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Eye, Send, Fuel, Users, CalendarDays, FileText, ArrowRight, Zap, IndianRupee, CheckCircle2 } from "lucide-react";
import { ALL_MEMBERS, EXPENSE_TYPES } from "@/lib/constants";
import { calculateShares } from "@/lib/calculations";
import { formatCurrency } from "@/lib/utils";
import { createRide } from "@/app/actions/ride.actions";
import { getTodayPetrolPrice } from "@/app/actions/settings.actions";

export default function CreateRideTab() {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [petrolPrice, setPetrolPrice] = useState<number>(110);
  const [suggestedPrice, setSuggestedPrice] = useState<number>(110);
  const [attendees, setAttendees] = useState<string[]>(["Shameek"]);
  const [expenses, setExpenses] = useState<Array<{ type: "TOLL" | "PARKING" | "MAINTENANCE" | "FASTAG" | "OTHER"; amount: number; description: string }>>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    getTodayPetrolPrice().then((p) => {
      setSuggestedPrice(p.price);
      setPetrolPrice(p.price);
    });
  }, []);

  const toggleAttendee = (name: string) => {
    if (name === "Shameek") return;
    setAttendees((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name],
    );
  };

  const addExpense = () => {
    setExpenses((prev) => [...prev, { type: "TOLL" as const, amount: 0, description: "" }]);
  };

  const updateExpense = (index: number, field: string, value: string | number) => {
    setExpenses((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)),
    );
  };

  const removeExpense = (index: number) => {
    setExpenses((prev) => prev.filter((_, i) => i !== index));
  };

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
    !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);

    const result = await createRide({
      date: new Date(date),
      petrolPrice,
      attendees,
      additionalExpenses: expenses.filter((e) => e.amount > 0),
      notes: notes || undefined,
    });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDate(new Date().toISOString().slice(0, 10));
        setAttendees(["Shameek"]);
        setExpenses([]);
        setNotes("");
        router.refresh();
      }, 2000);
    } else if (result.error?.startsWith("DUPLICATE:")) {
      setShowDuplicateWarning(result.error);
    } else {
      setError(result.error ?? "Failed to create ride.");
    }
    setIsSubmitting(false);
  };

  const handleDuplicateConfirm = async () => {
    if (!showDuplicateWarning) return;
    setIsSubmitting(true);
    setError(null);

    const result = await createRide({
      date: new Date(date),
      petrolPrice,
      attendees,
      additionalExpenses: expenses.filter((e) => e.amount > 0),
      notes: notes || undefined,
    });

    if (result.success) {
      setSuccess(true);
      setShowDuplicateWarning(null);
      setTimeout(() => {
        setSuccess(false);
        setDate(new Date().toISOString().slice(0, 10));
        setAttendees(["Shameek"]);
        setExpenses([]);
        setNotes("");
      }, 2000);
    } else {
      setError(result.error ?? "Failed to create ride.");
    }
    setIsSubmitting(false);
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="animate-fade-in">
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form */}
        <div className="space-y-6 lg:col-span-3">
          {/* Date & Petrol Price */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                Trip Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  max={todayStr}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border bg-card px-4 py-3 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Fuel className="h-4 w-4" />
                Petrol Price (₹/L)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number"
                    value={petrolPrice}
                    onChange={(e) => setPetrolPrice(Number(e.target.value))}
                    min={1}
                    step={0.01}
                    className="w-full rounded-xl border bg-card py-3 pl-9 pr-3 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <button
                  onClick={() => setPetrolPrice(suggestedPrice)}
                  className="shrink-0 rounded-xl border bg-card px-4 py-3 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground hover:border-primary/30"
                  title="Use today's suggested price"
                >
                  <Zap className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Today: <span className="font-medium text-foreground">₹{suggestedPrice.toFixed(2)}</span>/L
              </p>
            </div>
          </div>

          {/* Attendees */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4" />
              Select Attendees
              <span className="ml-auto text-xs text-muted-foreground">{attendees.length}/6</span>
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ALL_MEMBERS.map((name) => {
                const isSelected = attendees.includes(name);
                const isShameek = name === "Shameek";
                return (
                  <button
                    key={name}
                    onClick={() => toggleAttendee(name)}
                    disabled={isShameek}
                    className={`group relative flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                      isSelected
                        ? "border-primary/50 bg-gradient-to-r from-primary/[0.08] to-purple-500/[0.08] text-primary shadow-sm"
                        : "border bg-card text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/50"
                    } ${isShameek ? "cursor-not-allowed opacity-80" : ""}`}
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-lg border text-xs font-bold transition-all ${
                        isSelected
                          ? "border-primary bg-gradient-to-br from-primary to-purple-600 text-white shadow-sm"
                          : "border"
                      }`}
                    >
                      {isSelected ? "✓" : ""}
                    </div>
                    <span>{name}</span>
                    {isShameek && (
                      <span className="ml-auto text-[10px] text-muted-foreground/60">Always</span>
                    )}
                  </button>
                );
              })}
            </div>
            {attendees.length < 2 && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-destructive" />
                Minimum 2 members required (including Shameek)
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
                <div key={i} className="flex gap-2 animate-fade-in">
                  <select
                    value={exp.type}
                    onChange={(e) => updateExpense(i, "type", e.target.value)}
                    className="w-28 rounded-xl border bg-card px-3 py-3 text-sm"
                  >
                    {EXPENSE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={exp.amount || ""}
                      onChange={(e) => updateExpense(i, "amount", Number(e.target.value))}
                      className="w-28 rounded-xl border bg-card py-3 pl-8 pr-3 text-sm"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Description"
                    value={exp.description}
                    onChange={(e) => updateExpense(i, "description", e.target.value)}
                    className="flex-1 rounded-xl border bg-card px-4 py-3 text-sm"
                  />
                  <button
                    onClick={() => removeExpense(i)}
                    className="flex items-center justify-center rounded-xl border px-3 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={addExpense}
                className="flex items-center gap-1.5 rounded-xl border border-dashed bg-card/50 px-4 py-3 text-xs font-medium text-muted-foreground transition-all hover:bg-muted/50 hover:border-primary/30 hover:text-primary w-full justify-center"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Expense
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
              className="w-full resize-none rounded-xl border bg-card px-4 py-3 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {/* Messages */}
          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse-soft" />
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl bg-success/10 border border-success/20 px-4 py-3 text-sm text-success flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Ride created successfully!
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating Ride...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Create Ride
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex w-full items-center justify-between rounded-xl border bg-card p-4 text-sm font-medium lg:hidden hover:bg-muted/50 transition-all"
          >
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              Preview Shares
            </span>
            <span className={`transition-transform ${showPreview ? "rotate-180" : ""}`}>▼</span>
          </button>

          <div className={`mt-3 ${showPreview ? "block" : "hidden lg:block"}`}>
            <div className="sticky top-24 rounded-2xl border bg-gradient-to-b from-card to-card/50 shadow-lg">
              {/* Header */}
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

              {/* Content */}
              <div className="p-5">
                {calculationResult ? (
                  <div className="space-y-4">
                    {/* Member Shares */}
                    <div className="space-y-1.5">
                      {attendees.map((name, i) => {
                        const share = calculationResult.finalShares[name];
                        const weight = calculationResult.weights[name];
                        const points = calculationResult.points[name];
                        return (
                          <div
                            key={name}
                            className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-2.5 transition-colors hover:bg-muted/50 animate-fade-in-up"
                            style={{ animationDelay: `${i * 0.03}s` }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{name}</span>
                              <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                w:{weight.toFixed(2)}
                              </span>
                            </div>
                            <span className="text-sm font-bold">{formatCurrency(share)}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Totals */}
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

      {/* Duplicate Warning Dialog */}
      {showDuplicateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowDuplicateWarning(null)} />
          <div className="relative w-full max-w-sm animate-fade-in-scale rounded-2xl border bg-card p-6 shadow-2xl">
            <h3 className="text-lg font-semibold">Duplicate Ride</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              A ride already exists for this date. Do you want to create another ride for the same date?
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowDuplicateWarning(null)}
                className="flex-1 rounded-xl border bg-card px-4 py-3 text-sm font-medium transition-all hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleDuplicateConfirm}
                className="flex-1 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
              >
                Create Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

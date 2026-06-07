"use client";

import { AlertTriangle, Clock, ExternalLink, ArrowRight, Zap } from "lucide-react";
import { formatCurrency, formatDate, isOverdue, daysPending } from "@/lib/utils";

interface PaymentItem {
  rideId: string;
  rideDate: Date;
  memberName: string;
  amount: number;
  status: string;
  createdAt: Date;
}

export default function OverdueBanner({
  pendingPayments,
  onPayClick,
}: {
  pendingPayments: PaymentItem[];
  onPayClick: (item: PaymentItem) => void;
}) {
  const overdue = pendingPayments.filter((p) => p.status === "OVERDUE" || isOverdue(p.createdAt));
  const pending = pendingPayments.filter(
    (p) => p.status === "PENDING" && !isOverdue(p.createdAt),
  );

  if (overdue.length === 0 && pending.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Overdue Section */}
      {overdue.length > 0 && (
        <div className="group relative overflow-hidden rounded-2xl border border-destructive/30 bg-gradient-to-br from-destructive/[0.03] to-destructive/[0.07]">
          {/* Animated glow line */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-destructive via-destructive/50 to-destructive rounded-full" />

          <div className="flex items-center gap-3 border-b border-destructive/10 px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 animate-pulse-soft">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-destructive">
                OVERDUE PAYMENTS
              </h3>
              <p className="text-xs text-destructive/70">
                {overdue.length} payment{overdue.length !== 1 ? "s" : ""} past due
              </p>
            </div>
          </div>

          <div className="divide-y divide-destructive/5">
            {overdue.map((item, i) => (
              <div
                key={`${item.rideId}-${item.memberName}-${i}`}
                className="flex items-center justify-between px-5 py-3 text-sm transition-colors hover:bg-destructive/[0.02]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/5">
                    <Zap className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">{item.memberName}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-medium text-destructive">
                        {daysPending(item.createdAt)} days overdue
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{formatDate(item.rideDate)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-destructive">{formatCurrency(item.amount)}</span>
                  <button
                    onClick={() => onPayClick(item)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-destructive px-3.5 py-2 text-xs font-semibold text-destructive-foreground shadow-lg shadow-destructive/20 transition-all hover:shadow-xl hover:shadow-destructive/30 hover:brightness-110 active:scale-95"
                  >
                    Pay Now
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Section */}
      {pending.length > 0 && (
        <div className="group relative overflow-hidden rounded-2xl border border-warning/30 bg-gradient-to-br from-warning/[0.03] to-warning/[0.07]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-warning via-warning/50 to-warning rounded-full" />

          <div className="flex items-center gap-3 border-b border-warning/10 px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="h-4 w-4 text-warning" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-warning">
                PENDING PAYMENTS
              </h3>
              <p className="text-xs text-warning/70">
                {pending.length} payment{pending.length !== 1 ? "s" : ""} awaiting payment
              </p>
            </div>
          </div>

          <div className="divide-y divide-warning/5">
            {pending.map((item, i) => (
              <div
                key={`${item.rideId}-${item.memberName}-${i}`}
                className="flex items-center justify-between px-5 py-3 text-sm transition-colors hover:bg-warning/[0.02]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/5">
                    <Clock className="h-3.5 w-3.5 text-warning" />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">{item.memberName}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(item.rideDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">{formatCurrency(item.amount)}</span>
                  <button
                    onClick={() => onPayClick(item)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-95"
                  >
                    Pay Now
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

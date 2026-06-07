"use client";

import { useState, useEffect } from "react";
import { X, Upload, Check, QrCode, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { markPayment, verifyPayment, adminMarkPaid } from "@/app/actions/payment.actions";
import { getSetting } from "@/app/actions/settings.actions";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rideId: string;
  memberName: string;
  amount: number;
  rideDate: Date;
  currentStatus?: string;
  isAdmin?: boolean;
  onSuccess?: () => void;
}

export default function PaymentDialog({
  isOpen,
  onClose,
  rideId,
  memberName,
  amount,
  rideDate,
  currentStatus,
  isAdmin,
  onSuccess,
}: PaymentDialogProps) {
  const [qrImageUrl, setQrImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<"upload" | "done">("upload");

  useEffect(() => {
    if (isOpen) {
      getSetting("qrImageUrl").then((url) => {
        if (typeof url === "string" && url) {
          setQrImageUrl(url);
        }
      });
      setError(null);
      setSuccess(false);
      setStep("upload");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkPaid = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let result;
      if (isAdmin) {
        result = await adminMarkPaid({ rideId, memberName });
      } else {
        result = await markPayment({ rideId, memberName });
      }

      if (result.success) {
        setSuccess(true);
        setStep("done");
        onSuccess?.();
        setTimeout(onClose, 1500);
      } else {
        setError(result.error ?? "Failed to process payment.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await verifyPayment({ rideId, memberName });
      if (result.success) {
        setSuccess(true);
        setStep("done");
        onSuccess?.();
        setTimeout(onClose, 1500);
      } else {
        setError(result.error ?? "Failed to verify payment.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-fade-in-scale">
        <div className="rounded-2xl border bg-card shadow-2xl shadow-primary/10 overflow-hidden">
          {/* Gradient top bar */}
          <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_100%] animate-[border-flow_3s_linear_infinite]" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
                {currentStatus === "VERIFICATION" ? (
                  <ShieldCheck className="h-5 w-5 text-primary" />
                ) : (
                  <QrCode className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {currentStatus === "VERIFICATION" ? "Verify Payment" : "Pay Your Share"}
                </h2>
                <p className="text-xs text-muted-foreground">{memberName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-muted hover:text-foreground hover:rotate-90"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {step === "done" ? (
            <div className="flex flex-col items-center gap-4 px-6 py-12">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 animate-fade-in-scale">
                  <Check className="h-10 w-10 text-success" />
                </div>
                <div className="absolute inset-0 rounded-full bg-success/20 animate-ping" style={{ animationDuration: "1.5s" }} />
              </div>
              <p className="text-xl font-bold gradient-text">
                {isAdmin ? "Payment Verified!" : "Payment Submitted!"}
              </p>
              <p className="text-center text-sm text-muted-foreground max-w-xs">
                {isAdmin
                  ? "The payment has been marked as paid successfully."
                  : "Your payment is pending verification by the admin. You'll be notified once confirmed."}
              </p>
            </div>
          ) : (
            <div className="space-y-5 px-6 pb-6">
              {/* Amount Card */}
              <div className="relative rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10 p-5 overflow-hidden">
                <div className="absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-gradient-to-br from-primary/5 to-transparent" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Trip Date</p>
                    <p className="text-sm font-medium">{formatDate(rideDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Amount Due</p>
                    <p className="text-2xl font-bold gradient-text">{formatCurrency(amount)}</p>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-3">
                {qrImageUrl ? (
                  <div className="rounded-2xl border-2 border-primary/20 bg-white p-4 shadow-lg shadow-primary/5">
                    <img
                      src={qrImageUrl}
                      alt="Payment QR Code"
                      className="h-48 w-48 object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-48 w-48 items-center justify-center rounded-2xl border-2 border-dashed bg-muted/30">
                    <div className="text-center">
                      <QrCode className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                      <p className="mt-2 text-xs text-muted-foreground">No QR configured</p>
                    </div>
                  </div>
                )}
                {qrImageUrl && (
                  <p className="text-sm font-medium text-muted-foreground">
                    Scan to pay <span className="text-foreground font-semibold">{formatCurrency(amount)}</span>
                  </p>
                )}
              </div>

              {/* Screenshot Upload */}
              {!isAdmin && currentStatus !== "VERIFICATION" && (
                <div className="rounded-xl border border-dashed border-primary/20 bg-primary/[0.02] p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Upload className="h-4 w-4" />
                    <span>Upload payment screenshot</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-primary/10 file:to-purple-500/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary hover:file:from-primary/20 hover:file:to-purple-500/20 file:transition-all file:cursor-pointer"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Admin will verify within 24 hours
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse-soft" />
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border bg-card px-4 py-3 text-sm font-medium transition-all hover:bg-muted hover:shadow-sm"
                >
                  Cancel
                </button>

                {currentStatus === "VERIFICATION" && isAdmin ? (
                  <button
                    onClick={handleVerify}
                    disabled={isLoading}
                    className="flex-1 rounded-xl bg-gradient-to-r from-success to-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-success/20 transition-all hover:shadow-xl hover:shadow-success/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Verify Payment
                        <ShieldCheck className="h-4 w-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleMarkPaid}
                    disabled={isLoading}
                    className="flex-1 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {isAdmin ? "Mark as Paid" : "Mark as Paid"}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

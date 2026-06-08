"use client";

import { useState, useEffect, useRef } from "react";
import {
  X, Check, QrCode, Loader2, ArrowRight, ShieldCheck,
  Download, Copy, Upload,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { markPayment, verifyPayment, adminMarkPaid } from "@/app/actions/payment.actions";
import { getSetting } from "@/app/actions/settings.actions";
import { useToast } from "@/components/shared/Toast";
import { queueAction } from "@/lib/offline-storage";

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
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"pay" | "done">("pay");

  const [upiPhonePe, setUpiPhonePe]     = useState("7338603959@ybl");
  const [upiGPay, setUpiGPay]           = useState("shameekyogiofficial@oksbi");
  const [upiPaytm, setUpiPaytm]         = useState("7338603959@ptyes");
  const [phonepeUrl, setPhonepeUrl]     = useState("");
  const [gpayUrl, setGpayUrl]           = useState("");
  const [paytmUrl, setPaytmUrl]         = useState("");
  const [qrImageUrl, setQrImageUrl]     = useState("");
  const [copiedKey, setCopiedKey]       = useState<string | null>(null);

  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [screenshotData, setScreenshotData] = useState<string>("");

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronously reset state when isOpen transitions
  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setStep("pay");
      setError(null);
      setScreenshotName(null);
      setScreenshotData("");
    }
  }

  const handleClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setScreenshotData(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setScreenshotName(null);
      setScreenshotData("");
    }
  };

  // ── Scroll lock ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => { html.style.overflow = prev; };
  }, [isOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // ── Load settings & build UPI deep links ────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setStep("pay");

    const amountStr = amount.toFixed(2);

    (async () => {
      const [ph, gp, pt, qr] = await Promise.all([
        getSetting("upiPhonePe"),
        getSetting("upiGPay"),
        getSetting("upiPaytm"),
        getSetting("qrImageUrl"),
      ]);

      const phonePe   = (ph as string) || "7338603959@ybl";
      const gPay      = (gp as string) || "shameekyogiofficial@oksbi";
      const paytm     = (pt as string) || "7338603959@ptyes";
      const payeeName = "SHAMEEK YOGI";

      setUpiPhonePe(phonePe);
      setUpiGPay(gPay);
      setUpiPaytm(paytm);
      if (typeof qr === "string" && qr) setQrImageUrl(qr);

      const enc = encodeURIComponent(payeeName);
      setPhonepeUrl(`phonepe://pay?pa=${phonePe}&pn=${enc}&am=${amountStr}&cu=INR`);
      setGpayUrl(`tez://upi/pay?pa=${gPay}&pn=${enc}&am=${amountStr}&cu=INR`);
      setPaytmUrl(`paytmmp://upi/pay?pa=${paytm}&pn=${enc}&am=${amountStr}&cu=INR`);
    })();
  }, [isOpen, amount]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleMarkPaid = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let result: { success: boolean; error?: string; isOffline?: boolean };
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
      if (isOffline) {
        const actionId = `mark-paid-${Date.now()}`;
        await queueAction({
          id: actionId,
          type: isAdmin ? "VERIFY_PAYMENT" : "MARK_PAYMENT",
          data: {
            rideId,
            memberName,
            screenshotName: screenshotName ?? undefined,
            screenshotData: screenshotData || undefined,
          },
        });
        result = { success: true, isOffline: true };
      } else {
        result = isAdmin
          ? await adminMarkPaid({ rideId, memberName })
          : await markPayment({
              rideId,
              memberName,
              screenshotName: screenshotName ?? undefined,
              screenshotData: screenshotData || undefined,
            });
      }

      if (result.success) {
        setStep("done");
        onSuccess?.();
        if (result.isOffline) {
          addToast("warning", "Offline! Payment queued locally.");
        }
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(handleClose, 1800);
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
      let result: { success: boolean; error?: string; isOffline?: boolean };
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
      if (isOffline) {
        const actionId = `verify-payment-${Date.now()}`;
        await queueAction({
          id: actionId,
          type: "VERIFY_PAYMENT",
          data: { rideId, memberName },
        });
        result = { success: true, isOffline: true };
      } else {
        result = await verifyPayment({ rideId, memberName });
      }

      if (result.success) {
        setStep("done");
        onSuccess?.();
        if (result.isOffline) {
          addToast("warning", "Offline! Verification queued locally.");
        }
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(handleClose, 1800);
      } else {
        setError(result.error ?? "Failed to verify payment.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadQr = () => {
    if (!qrImageUrl) return;
    const a = document.createElement("a");
    a.href = qrImageUrl;
    a.download = "shameek-upi-qr.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  return (
    /*
     * OVERLAY
     * – z-[200] clears everything (nav z-50, header z-50, panchayat z-[70], toast z-[110])
     * – Mobile  : items-end  → sheet slides up from the bottom
     * – Desktop : items-center → sheet floats in the middle
     * – `isolation: isolate` creates a new stacking context so nothing bleeds through
     */
    <div
      className="fixed inset-0 z-[200] flex flex-col items-stretch sm:flex-row sm:items-center sm:justify-center"
      style={{ isolation: "isolate" }}
      role="dialog"
      aria-modal="true"
      aria-label={currentStatus === "VERIFICATION" ? "Verify Payment" : "Pay Your Share"}
    >
      {/* ── Backdrop ── */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/*
       * ── Sheet wrapper ──
       *
       * MOBILE (default, < sm):
       *   • `mt-auto` pushes the sheet to the bottom of the flex-col container
       *   • `max-h-[92dvh]` uses dynamic viewport height so the address bar
       *     resize on scroll doesn't cause jumpiness; fallback 92vh for older
       *   • rounded only on top corners
       *
       * DESKTOP (sm+):
       *   • `relative sm:max-w-md` — centered by the parent justify-center
       *   • `max-h-[85vh]` — leave breathing room above/below
       *   • rounded on all corners
       *
       * BOTH:
       *   • `flex flex-col` — header shrink-0 / body flex-1 min-h-0 / footer shrink-0
       *   • The "sticky footer" pattern: action buttons live OUTSIDE the scroll area,
       *     pinned at the bottom of the sheet, always visible without scrolling.
       */}
      <div
        className="
          relative w-full mt-auto
          sm:mt-0 sm:max-w-md sm:mx-auto sm:mx-4
          flex flex-col
          rounded-t-[28px] sm:rounded-2xl
          overflow-hidden
          border border-white/[0.10]
          bg-[#0d0f17]
          shadow-[0_-8px_60px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.06)]
          sm:shadow-[0_25px_80px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.06)]
          animate-slide-up sm:animate-fade-in-scale
        "
        style={{
          maxHeight: "min(92dvh, 92vh)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Drag handle (mobile only) ── */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 sm:hidden" aria-hidden="true">
          <div className="h-[5px] w-10 rounded-full bg-white/20" />
        </div>

        {/* ── Gradient accent line ── */}
        <div className="h-px shrink-0 bg-gradient-to-r from-transparent via-[#7c3aed] to-transparent opacity-70" />

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shrink-0">
              {currentStatus === "VERIFICATION"
                ? <ShieldCheck className="h-5 w-5 text-primary" />
                : <QrCode className="h-5 w-5 text-primary" />
              }
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                {currentStatus === "VERIFICATION" ? "Verify Payment" : "Pay Your Share"}
              </h2>
              <p className="text-xs text-muted-foreground font-semibold">{memberName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="h-9 w-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-colors touch-manipulation flex-shrink-0"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/*
         * ── Scrollable body ──
         * flex-1 + min-h-0 is the critical combo: allows this child to shrink
         * below its natural content height, enabling overflow-y-auto to work
         * inside a flex column container.
         */}
        {step === "done" ? (
          <div className="flex flex-col items-center justify-center gap-5 px-6 py-16 flex-1">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-success/10 border border-success/20 flex items-center justify-center animate-bounce-in">
                <Check className="h-10 w-10 text-success" />
              </div>
              <span className="absolute inset-0 rounded-full bg-success/20 animate-ping" style={{ animationDuration: "1.5s" }} />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xl font-bold gradient-text">
                {isAdmin ? "Payment Verified!" : "Payment Submitted!"}
              </p>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                {isAdmin
                  ? "Marked as paid successfully."
                  : "Pending admin verification. You'll be notified once confirmed."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Scrollable content area */}
            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
              style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
            >
              <div className="px-5 pt-4 pb-5 space-y-4">

                {/* ── Amount receipt ticket ── */}
                <div className="relative rounded-2xl bg-white/[0.03] border border-white/[0.08] px-5 py-4 overflow-hidden">
                  {/* ticket notch left */}
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-[#0d0f17] border-r border-white/[0.08]" />
                  {/* ticket notch right */}
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-[#0d0f17] border-l border-white/[0.08]" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Trip Date</p>
                      <p className="text-sm font-semibold mt-0.5">{formatDate(rideDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Share Due</p>
                      <p className="text-2xl font-extrabold gradient-text mt-0.5 tabular-nums">{formatCurrency(amount)}</p>
                    </div>
                  </div>
                </div>

                {/* ── UPI payment buttons ── */}
                <div className="space-y-2.5">
                  {/* PhonePe */}
                  <div className="flex gap-2">
                    <a
                      href={phonepeUrl}
                      className="flex-1 flex items-center justify-center gap-2 h-14 rounded-xl text-sm font-bold text-white shadow-lg active:opacity-75 touch-manipulation select-none"
                      style={{ background: "linear-gradient(135deg, #5f259f, #4c1d80)" }}
                    >
                      Pay with PhonePe <ArrowRight className="h-4 w-4 shrink-0" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(upiPhonePe, "phonepe")}
                      className="h-14 w-14 shrink-0 flex items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.10] hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors touch-manipulation"
                      aria-label="Copy PhonePe UPI ID"
                    >
                      {copiedKey === "phonepe"
                        ? <Check className="h-4 w-4 text-success" />
                        : <Copy className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </div>

                  {/* GPay */}
                  <div className="flex gap-2">
                    <a
                      href={gpayUrl}
                      className="flex-1 flex items-center justify-center gap-2 h-14 rounded-xl text-sm font-bold text-white shadow-lg active:opacity-75 touch-manipulation select-none"
                      style={{ background: "linear-gradient(135deg, #1a73e8, #1557b0)" }}
                    >
                      Pay with Google Pay <ArrowRight className="h-4 w-4 shrink-0" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(upiGPay, "gpay")}
                      className="h-14 w-14 shrink-0 flex items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.10] hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors touch-manipulation"
                      aria-label="Copy GPay UPI ID"
                    >
                      {copiedKey === "gpay"
                        ? <Check className="h-4 w-4 text-success" />
                        : <Copy className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </div>

                  {/* Paytm */}
                  <div className="flex gap-2">
                    <a
                      href={paytmUrl}
                      className="flex-1 flex items-center justify-center gap-2 h-14 rounded-xl text-sm font-bold text-white shadow-lg active:opacity-75 touch-manipulation select-none"
                      style={{ background: "linear-gradient(135deg, #00baf2, #008fc2)" }}
                    >
                      Pay with Paytm <ArrowRight className="h-4 w-4 shrink-0" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(upiPaytm, "paytm")}
                      className="h-14 w-14 shrink-0 flex items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.10] hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors touch-manipulation"
                      aria-label="Copy Paytm UPI ID"
                    >
                      {copiedKey === "paytm"
                        ? <Check className="h-4 w-4 text-success" />
                        : <Copy className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                {/* ── QR Code ── */}
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold px-1">Or Scan QR</span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                  </div>
                  {qrImageUrl ? (
                    <>
                      <div className="relative rounded-2xl border border-white/10 bg-white p-4 shadow-xl overflow-hidden">
                        <img
                          src={qrImageUrl}
                          alt="Payment QR Code"
                          className="h-44 w-44 object-contain"
                        />
                        <div className="absolute left-4 right-4 top-4 h-0.5 bg-primary/60 shadow-[0_0_8px_rgba(124,58,237,0.8)] animate-scan pointer-events-none" />
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadQr}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/20 active:bg-primary/20 touch-manipulation"
                      >
                        <Download className="h-3.5 w-3.5" /> Save QR Code
                      </button>
                    </>
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02]">
                      <div className="text-center">
                        <QrCode className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                        <p className="mt-1 text-[10px] text-muted-foreground">No QR set</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Screenshot upload (non-admin only) ── */}
                {!isAdmin && currentStatus !== "VERIFICATION" && (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-4">
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <Upload className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-semibold">Upload payment screenshot</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary touch-manipulation"
                    />
                    {screenshotName ? (
                      <div className="mt-2 flex items-center justify-between rounded-xl bg-success/10 border border-success/20 px-3 py-2 text-xs text-success">
                        <span className="truncate font-semibold flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5" />
                          {screenshotName}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setScreenshotName(null);
                            setScreenshotData("");
                          }}
                          className="text-muted-foreground hover:text-white transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">Admin will verify within 24 hours</p>
                    )}
                  </div>
                )}

                {/* ── Error ── */}
                {error && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0 animate-pulse" />
                    {error}
                  </div>
                )}

              </div>
            </div>

            {/*
             * ── Sticky action footer ──
             * Lives OUTSIDE the scroll area so it's always visible.
             * safe-area-inset-bottom ensures buttons clear the home indicator
             * on iPhones and notched Android devices.
             */}
            <div
              className="shrink-0 px-5 pt-3 pb-4 border-t border-white/[0.07] bg-[#0d0f17]"
              style={{ paddingBottom: "max(1rem, calc(env(safe-area-inset-bottom) + 0.75rem))" }}
            >
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 h-14 rounded-xl border border-white/[0.10] bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.07] active:bg-white/[0.10] transition-colors touch-manipulation"
                >
                  Cancel
                </button>

                {currentStatus === "VERIFICATION" && isAdmin ? (
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={isLoading}
                    className="flex-1 h-14 rounded-xl text-sm font-bold text-white shadow-lg active:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation transition-opacity"
                    style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                  >
                    {isLoading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <><ShieldCheck className="h-4 w-4" /> Verify Payment</>}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleMarkPaid}
                    disabled={isLoading}
                    className="flex-1 h-14 rounded-xl text-sm font-bold text-white shadow-lg active:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation transition-opacity"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
                  >
                    {isLoading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <>{isAdmin ? "Mark Paid" : "Mark as Paid"} <ArrowRight className="h-4 w-4" /></>}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

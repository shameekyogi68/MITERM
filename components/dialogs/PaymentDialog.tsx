"use client";

import { useState, useEffect, useRef } from "react";
import { X, Check, QrCode, Loader2, ArrowRight, ShieldCheck, Download, Copy, AlertTriangle, Upload } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"pay" | "done">("pay");

  const [upiPhonePe, setUpiPhonePe] = useState("7338603959@ybl");
  const [upiGPay, setUpiGPay] = useState("shameekyogiofficial@oksbi");
  const [upiPaytm, setUpiPaytm] = useState("7338603959@ptyes");
  const [payeeNameState, setPayeeNameState] = useState("SHAMEEK YOGI");
  const [phonepeUrl, setPhonepeUrl] = useState("");
  const [gpayUrl, setGpayUrl] = useState("");
  const [paytmUrl, setPaytmUrl] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Scroll lock: safest cross-browser approach ──────────────────────────────
  // We set overflow:hidden on <html> (not body). This is the most reliable
  // method across iOS Safari, Chrome Android, and PWA contexts.
  // We do NOT use position:fixed (breaks PWA layout on Android WebView).
  useEffect(() => {
    if (!isOpen) return;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // ── Load settings & build UPI deep links ────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setStep("pay");

    const amountStr = amount.toFixed(2);

    (async () => {
      const [ph, gp, pt, pn, qr] = await Promise.all([
        getSetting("upiPhonePe"),
        getSetting("upiGPay"),
        getSetting("upiPaytm"),
        getSetting("payeeName"),
        getSetting("qrImageUrl"),
      ]);

      const phonePe   = (ph as string) || "7338603959@ybl";
      const gPay      = (gp as string) || "shameekyogiofficial@oksbi";
      const paytm     = (pt as string) || "7338603959@ptyes";
      const payeeName = (pn as string) || "SHAMEEK YOGI";

      setUpiPhonePe(phonePe);
      setUpiGPay(gPay);
      setUpiPaytm(paytm);
      setPayeeNameState(payeeName);
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
      const result = isAdmin
        ? await adminMarkPaid({ rideId, memberName })
        : await markPayment({ rideId, memberName });
      if (result.success) {
        setStep("done");
        onSuccess?.();
        setTimeout(onClose, 1800);
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
        setStep("done");
        onSuccess?.();
        setTimeout(onClose, 1800);
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
    a.download = `shameek-upi-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Don't render at all when closed — keeps DOM clean
  if (!isOpen) return null;

  return (
    /**
     * Full-screen overlay. z-[100] beats everything (nav z-50, header z-50, panchayat z-[70]).
     * On mobile: sheet anchored to bottom via `items-end`.
     * On desktop: centered via `sm:items-center`.
     */
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      style={{ isolation: "isolate" }}
    >
      {/* ── Backdrop ── */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Sheet ──
          Key layout rules for mobile scrollable sheet:
          1. `relative` so z-index is its own stacking context above backdrop.
          2. `flex flex-col` — header is shrink-0, body is flex-1 with min-h-0.
          3. min-h-0 on the scroll child is REQUIRED for overflow to work in a flex col.
          4. max-h uses vh (not dvh) for max compatibility with Android 4.4+.
      */}
      <div
        className="relative w-full sm:max-w-md flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0d0f17] animate-slide-up sm:animate-fade-in-scale"
        style={{ maxHeight: "90vh" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 shrink-0 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Purple gradient accent */}
        <div className="h-0.5 shrink-0 bg-gradient-to-r from-[#7c3aed] via-purple-400 to-[#7c3aed]" />

        {/* ── Fixed Header ── */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
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
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-colors touch-manipulation"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable Body ──
            `flex-1 min-h-0` is the critical pattern:
            - flex-1 → take remaining height
            - min-h-0 → allow shrinking below content natural size (required for overflow)
            - overflow-y-auto → enable scroll
        */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto"
          style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" as any }}
        >
          {step === "done" ? (
            /* ── Success Screen ── */
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-16">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center animate-bounce-in">
                  <Check className="h-10 w-10 text-success" />
                </div>
                <div className="absolute inset-0 rounded-full bg-success/20 animate-ping" style={{ animationDuration: "1.5s" }} />
              </div>
              <p className="text-xl font-bold gradient-text">
                {isAdmin ? "Payment Verified!" : "Payment Submitted!"}
              </p>
              <p className="text-center text-sm text-muted-foreground max-w-xs">
                {isAdmin
                  ? "Marked as paid successfully."
                  : "Pending admin verification. You'll be notified once confirmed."}
              </p>
            </div>
          ) : (
            /* ── Payment Content ── */
            <div className="px-5 pt-4 pb-8 space-y-4">

              {/* Amount receipt card */}
              <div className="relative rounded-2xl bg-white/[0.03] border border-white/[0.07] p-5 overflow-hidden">
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#0d0f17] border-r border-white/10" />
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#0d0f17] border-l border-white/10" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Trip Date</p>
                    <p className="text-sm font-semibold mt-0.5">{formatDate(rideDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Share Due</p>
                    <p className="text-2xl font-extrabold gradient-text mt-0.5">{formatCurrency(amount)}</p>
                  </div>
                </div>
              </div>

              {/* UPI Buttons */}
              <div className="space-y-2.5">
                {/* PhonePe */}
                <div className="flex gap-2">
                  <a
                    href={phonepeUrl}
                    className="flex-1 flex items-center justify-center gap-2 h-14 rounded-xl bg-gradient-to-r from-[#5f259f] to-[#4c1d80] text-sm font-bold text-white shadow-lg active:opacity-80 touch-manipulation"
                  >
                    Pay with PhonePe <ArrowRight className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(upiPhonePe, "phonepe")}
                    className="h-14 w-14 shrink-0 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 active:bg-white/15 touch-manipulation"
                    aria-label="Copy PhonePe UPI ID"
                  >
                    {copiedKey === "phonepe" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>

                {/* GPay */}
                <div className="flex gap-2">
                  <a
                    href={gpayUrl}
                    className="flex-1 flex items-center justify-center gap-2 h-14 rounded-xl bg-gradient-to-r from-[#1a73e8] to-[#1557b0] text-sm font-bold text-white shadow-lg active:opacity-80 touch-manipulation"
                  >
                    Pay with Google Pay <ArrowRight className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(upiGPay, "gpay")}
                    className="h-14 w-14 shrink-0 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 active:bg-white/15 touch-manipulation"
                    aria-label="Copy GPay UPI ID"
                  >
                    {copiedKey === "gpay" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>

                {/* Paytm */}
                <div className="flex gap-2">
                  <a
                    href={paytmUrl}
                    className="flex-1 flex items-center justify-center gap-2 h-14 rounded-xl bg-gradient-to-r from-[#00baf2] to-[#008fc2] text-sm font-bold text-white shadow-lg active:opacity-80 touch-manipulation"
                  >
                    Pay with Paytm <ArrowRight className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(upiPaytm, "paytm")}
                    className="h-14 w-14 shrink-0 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 active:bg-white/15 touch-manipulation"
                    aria-label="Copy Paytm UPI ID"
                  >
                    {copiedKey === "paytm" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>

              {/* Self-payment warning */}
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs flex gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-500">Self-Payment Restriction</p>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed">
                    UPI apps block payments to your own UPI ID. This is normal when testing on Shameek's device — works perfectly for other members.
                  </p>
                </div>
              </div>

              {/* Payee addresses info */}
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 space-y-1.5 text-xs">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider text-center">Payee</p>
                <div className="space-y-1 font-mono text-[11px] text-muted-foreground">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="font-sans font-bold">Name:</span>
                    <span className="text-primary font-bold">{payeeNameState}</span>
                  </div>
                  <div className="flex justify-between"><span>PhonePe:</span><span className="text-white/80 select-all">{upiPhonePe}</span></div>
                  <div className="flex justify-between"><span>GPay:</span><span className="text-white/80 select-all">{upiGPay}</span></div>
                  <div className="flex justify-between"><span>Paytm:</span><span className="text-white/80 select-all">{upiPaytm}</span></div>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 w-full">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold">Or Scan QR</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                {qrImageUrl ? (
                  <>
                    <div className="relative rounded-2xl border border-white/10 bg-white p-4 shadow-xl overflow-hidden">
                      <img src={qrImageUrl} alt="Payment QR Code" className="h-44 w-44 object-contain" />
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

              {/* Screenshot upload (non-admin, non-verification) */}
              {!isAdmin && currentStatus !== "VERIFICATION" && (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-4">
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <Upload className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">Upload payment screenshot</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary touch-manipulation"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">Admin will verify within 24 hours</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                  {error}
                </div>
              )}

              {/* Action buttons — sticky at bottom */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-14 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold active:bg-white/10 transition-colors touch-manipulation"
                >
                  Cancel
                </button>

                {currentStatus === "VERIFICATION" && isAdmin ? (
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={isLoading}
                    className="flex-1 h-14 rounded-xl bg-gradient-to-r from-success to-emerald-600 text-sm font-bold text-white shadow-lg active:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldCheck className="h-4 w-4" /> Verify</>}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleMarkPaid}
                    disabled={isLoading}
                    className="flex-1 h-14 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-sm font-bold text-white shadow-lg active:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{isAdmin ? "Mark Paid" : "Mark as Paid"} <ArrowRight className="h-4 w-4" /></>}
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

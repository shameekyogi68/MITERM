"use client";

import { useState, useEffect } from "react";
import { X, Upload, Check, QrCode, Loader2, ArrowRight, ShieldCheck, Download, Copy, AlertTriangle } from "lucide-react";
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
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<"upload" | "done">("upload");
  
  // UPI ID states from settings
  const [upiPhonePe, setUpiPhonePe] = useState("7338603959@ybl");
  const [upiGPay, setUpiGPay] = useState("shameekyogiofficial@oksbi");
  const [upiPaytm, setUpiPaytm] = useState("7338603959@ptyes");
  const [payeeNameState, setPayeeNameState] = useState("SHAMEEK YOGI");

  // Deep Link URL states
  const [phonepeUrl, setPhonepeUrl] = useState<string>("");
  const [gpayUrl, setGpayUrl] = useState<string>("");
  const [paytmUrl, setPaytmUrl] = useState<string>("");
  const [qrImageUrl, setQrImageUrl] = useState<string>("");

  // Copy success indicator
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Support iOS Safari elastic scrolling lock
      document.body.style.position = "relative";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setSuccess(false);
    setStep("upload");

    const amountStr = amount.toFixed(2);

    const loadSettingsAndBuildLinks = async () => {
      // Fetch setting values in parallel
      const [phSetting, gpSetting, ptSetting, pnSetting, qrSetting] = await Promise.all([
        getSetting("upiPhonePe"),
        getSetting("upiGPay"),
        getSetting("upiPaytm"),
        getSetting("payeeName"),
        getSetting("qrImageUrl"),
      ]);

      const activePhonePe = (phSetting as string) || "7338603959@ybl";
      const activeGPay = (gpSetting as string) || "shameekyogiofficial@oksbi";
      const activePaytm = (ptSetting as string) || "7338603959@ptyes";
      const activePayeeName = (pnSetting as string) || "SHAMEEK YOGI";

      setUpiPhonePe(activePhonePe);
      setUpiGPay(activeGPay);
      setUpiPaytm(activePaytm);
      setPayeeNameState(activePayeeName);

      if (typeof qrSetting === "string" && qrSetting) {
        setQrImageUrl(qrSetting);
      }

      const encodedPayeeName = encodeURIComponent(activePayeeName);

      // PhonePe Deep Link
      // Using phonepe:// custom scheme — opens the app with the user's full session
      // intent:// bypasses the session and causes "Add bank account" prompt
      const phonepeQuery = `pa=${activePhonePe}&pn=${encodedPayeeName}&am=${amountStr}&cu=INR`;
      setPhonepeUrl(`phonepe://pay?${phonepeQuery}`);

      // Google Pay Deep Link
      // GPay's internal scheme is "tez" (from Google Tez era) — opens with bank account intact
      // intent://...nbu.paisa.user opens in isolated mode causing "Could not load banking name"
      const gpayQuery = `pa=${activeGPay}&pn=${encodedPayeeName}&am=${amountStr}&cu=INR`;
      setGpayUrl(`tez://upi/pay?${gpayQuery}`);

      // Paytm Deep Link
      // paytmmp:// is the correct scheme for Paytm UPI payments
      const paytmQuery = `pa=${activePaytm}&pn=${encodedPayeeName}&am=${amountStr}&cu=INR`;
      setPaytmUrl(`paytmmp://upi/pay?${paytmQuery}`);
    };

    loadSettingsAndBuildLinks();
  }, [isOpen, amount]);

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

  const handleDownloadQr = () => {
    if (!qrImageUrl) return;
    const a = document.createElement("a");
    a.href = qrImageUrl;
    a.download = `shameek-upi-qr-${memberName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mt-auto sm:mt-0 animate-slide-up sm:animate-fade-in-scale max-h-[100dvh] sm:max-h-[90vh] flex flex-col">
        <div className="glass-premium rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl shadow-primary/15 relative z-10 flex flex-col max-h-[100dvh] sm:max-h-[90vh]">
          {/* Gradient top bar */}
          <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_100%] animate-[border-flow_3s_linear_infinite] shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 shrink-0 border-b border-white/5 bg-black/10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-violet-500/15 border border-primary/25">
                {currentStatus === "VERIFICATION" ? (
                  <ShieldCheck className="h-5 w-5 text-primary" />
                ) : (
                  <QrCode className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold">
                  {currentStatus === "VERIFICATION" ? "Verify Payment" : "Pay Your Share"}
                </h2>
                <p className="text-xs text-muted-foreground font-semibold">{memberName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-white/5 hover:text-foreground hover:rotate-90 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable Container */}
          <div className="overflow-y-auto flex-1 scrollbar-thin">
            {step === "done" ? (
              <div className="flex flex-col items-center gap-4 px-6 pt-12 pb-[calc(3rem+env(safe-area-inset-bottom))] sm:pb-12">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 animate-fade-in-scale">
                    <Check className="h-10 w-10 text-success" />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-success/20 animate-ping" style={{ animationDuration: "1.5s" }} />
                </div>
                <p className="text-xl font-bold gradient-text">
                  {isAdmin ? "Payment Verified!" : "Payment Submitted!"}
                </p>
                <p className="text-center text-sm text-muted-foreground max-w-xs font-medium">
                  {isAdmin
                    ? "The payment has been marked as paid successfully."
                    : "Your payment is pending verification by the admin. You'll be notified once confirmed."}
                </p>
              </div>
            ) : (
              <div className="space-y-5 px-6 pt-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:pb-8">
                {/* Amount Card (Receipt Style) */}
                <div className="relative rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 overflow-hidden shadow-inner backdrop-blur-sm">
                  {/* Decorative Ticket Notch holes on left & right borders */}
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#0d0f14] border-r border-white/10 z-20" />
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#0d0f14] border-l border-white/10 z-20" />
                  
                  <div className="relative flex items-center justify-between">
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

                {/* Payment Options */}
                <div className="flex flex-col gap-3">
                  {/* PhonePe */}
                  <div className="flex gap-2 items-center">
                    <a
                      href={phonepeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5f259f] to-[#4c1d80] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-purple-950/20 transition-all hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
                    >
                      <span>Pay with PhonePe</span>
                      <ArrowRight className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => handleCopy(upiPhonePe, "phonepe")}
                      className="h-11 w-11 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-muted-foreground hover:text-white cursor-pointer"
                      title="Copy UPI ID"
                      type="button"
                    >
                      {copiedKey === "phonepe" ? (
                        <Check className="h-4 w-4 text-success animate-fade-in-scale" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Google Pay */}
                  <div className="flex gap-2 items-center">
                    <a
                      href={gpayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1a73e8] to-[#1557b0] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/20 transition-all hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
                    >
                      <span>Pay with Google Pay</span>
                      <ArrowRight className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => handleCopy(upiGPay, "gpay")}
                      className="h-11 w-11 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-muted-foreground hover:text-white cursor-pointer"
                      title="Copy UPI ID"
                      type="button"
                    >
                      {copiedKey === "gpay" ? (
                        <Check className="h-4 w-4 text-success animate-fade-in-scale" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Paytm */}
                  <div className="flex gap-2 items-center">
                    <a
                      href={paytmUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00baf2] to-[#008fc2] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-sky-950/20 transition-all hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
                    >
                      <span>Pay with Paytm</span>
                      <ArrowRight className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => handleCopy(upiPaytm, "paytm")}
                      className="h-11 w-11 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-muted-foreground hover:text-white cursor-pointer"
                      title="Copy UPI ID"
                      type="button"
                    >
                      {copiedKey === "paytm" ? (
                        <Check className="h-4 w-4 text-success animate-fade-in-scale" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Self-Payment Testing Warning */}
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs flex gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-amber-500">Self-Payment Restriction</p>
                      <p className="text-muted-foreground leading-normal">
                        UPI apps block self-payments. If testing using your own phone/UPI apps (paying to your own UPI ID), GPay and PhonePe will fail. It works perfectly for other members paying you!
                      </p>
                    </div>
                  </div>

                  {/* Address Verification Info */}
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 text-xs space-y-1.5">
                    <p className="text-muted-foreground font-semibold text-center text-[10px] uppercase tracking-wider">Configured Payee Addresses</p>
                    <div className="space-y-1 font-mono text-[11px] text-muted-foreground">
                      <div className="flex justify-between border-b border-white/5 pb-1 mb-1">
                        <span className="font-sans text-muted-foreground font-bold">Account Name:</span>
                        <span className="text-primary font-bold">{payeeNameState}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PhonePe VPA:</span>
                        <span className="text-white/80 select-all">{upiPhonePe}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GPay VPA:</span>
                        <span className="text-white/80 select-all">{upiGPay}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Paytm VPA:</span>
                        <span className="text-white/80 select-all">{upiPaytm}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold">Or Scan QR Code</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center gap-3">
                  {qrImageUrl ? (
                    <div className="relative group rounded-2xl border border-white/10 bg-white p-4 shadow-xl transition-all duration-300 overflow-hidden">
                      <img
                        src={qrImageUrl}
                        alt="Payment QR Code"
                        className="h-48 w-48 object-contain relative z-10"
                      />
                      {/* Scanning laser effect */}
                      <div className="absolute left-4 right-4 top-4 h-[2px] bg-primary/60 shadow-[0_0_8px_rgba(244,63,94,0.8)] z-20 animate-scan pointer-events-none" />
                      
                      {/* Custom scanner corner borders */}
                      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl animate-pulse-soft z-20" />
                      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr animate-pulse-soft z-20" />
                      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl animate-pulse-soft z-20" />
                      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br animate-pulse-soft z-20" />
                    </div>
                  ) : (
                    <div className="flex h-48 w-48 items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02]">
                      <div className="text-center">
                        <QrCode className="h-10 w-10 text-muted-foreground/50 mx-auto animate-pulse-soft" />
                        <p className="mt-2 text-xs text-muted-foreground">No QR configured</p>
                      </div>
                    </div>
                  )}
                  {qrImageUrl && (
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-semibold text-muted-foreground">
                        Scan to pay <span className="text-foreground font-extrabold tabular-nums">{formatCurrency(amount)}</span>
                      </p>
                      <button
                        onClick={handleDownloadQr}
                        type="button"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-rose-400 transition-colors cursor-pointer bg-primary/10 hover:bg-primary/20 px-3.5 py-1.5 rounded-full border border-primary/20"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Save QR Code
                      </button>
                    </div>
                  )}
                  </div>
                </div>

                {/* Screenshot Upload */}
                {!isAdmin && currentStatus !== "VERIFICATION" && (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Upload className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">Upload payment screenshot</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-primary/15 file:to-violet-600/15 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary hover:file:from-primary/25 hover:file:to-violet-600/25 file:transition-all file:cursor-pointer"
                    />
                    <p className="mt-2 text-xs text-muted-foreground font-medium">
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
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold transition-all hover:bg-white/10 hover:shadow-inner cursor-pointer"
                  >
                    Cancel
                  </button>

                  {currentStatus === "VERIFICATION" && isAdmin ? (
                    <button
                      onClick={handleVerify}
                      disabled={isLoading}
                      className="flex-1 rounded-xl bg-gradient-to-r from-success to-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-success/25 transition-all hover:shadow-xl hover:shadow-success/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
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
                      className="flex-1 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/45 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
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
    </div>
  );
}

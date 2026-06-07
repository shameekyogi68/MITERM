"use client";

import React, { useState, useEffect } from "react";
import {
  Settings2,
  QrCode,
  Shield,
  Download,
  Upload,
  RefreshCw,
  Edit3,
  Check,
  X,
  ArrowDownToLine,
  Route,
  Gauge,
  User,
  Copy,
  Save,
  Image,
  IndianRupee,
} from "lucide-react";
import {
  getAllSettings,
  getAllMembers,
  updateSetting,
  updateMemberDistance,
} from "@/app/actions/settings.actions";
import { exportRides } from "@/app/actions/export.actions";

interface Member {
  id: string;
  name: string;
  distance: number;
}

export default function SettingsTab() {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editDistance, setEditDistance] = useState(0);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string>("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const [s, m] = await Promise.all([getAllSettings(), getAllMembers()]);
      setSettings(s);
      setMembers(m as Member[]);
      setQrPreview((s.qrImageUrl as string) || "");
      setIsLoading(false);
    };
    load();
  }, []);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveSetting = async (key: string, value: unknown) => {
    const result = await updateSetting(key, value);
    if (result.success) {
      setSettings((prev) => ({ ...prev, [key]: value }));
      showMessage("success", `${key} updated successfully`);
    } else {
      showMessage("error", result.error ?? "Failed to update setting");
    }
  };

  const handleSaveMemberDistance = async (name: string) => {
    const result = await updateMemberDistance(name, editDistance);
    if (result.success) {
      setMembers((prev) =>
        prev.map((m) => (m.name === name ? { ...m, distance: editDistance } : m)),
      );
      setEditingMember(null);
      showMessage("success", `Distance updated for ${name}`);
    } else {
      showMessage("error", result.error ?? "Failed to update distance");
    }
  };

  const handleExport = async (format: "json" | "csv") => {
    const result = await exportRides(format);
    const blob = new Blob([result.data], { type: result.contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
    showMessage("success", `${format.toUpperCase()} exported successfully`);
  };

  const handleQrUpload = async () => {
    if (!qrFile) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const result = await updateSetting("qrImageUrl", dataUrl);
      if (result.success) {
        setQrPreview(dataUrl);
        showMessage("success", "QR code uploaded successfully");
      } else {
        showMessage("error", "Failed to upload QR code");
      }
    };
    reader.readAsDataURL(qrFile);
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  const SettingCard = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
    <div className="overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-md">
      <div className="flex items-center gap-3 border-b bg-gradient-to-r from-primary/[0.03] to-purple-500/[0.03] px-6 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {message && (
        <div
          className={`rounded-xl border px-5 py-3 text-sm flex items-center gap-2 animate-slide-down ${
            message.type === "success"
              ? "bg-success/10 border-success/20 text-success"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          <div className={`h-1.5 w-1.5 rounded-full ${message.type === "success" ? "bg-success" : "bg-destructive"} animate-pulse-soft`} />
          {message.text}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {/* Configuration */}
        <SettingCard icon={Settings2} title="Configuration">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Route className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Route Distance</p>
                  <p className="text-[10px] text-muted-foreground">Round trip in km</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={(settings.routeDistance as number) ?? 252}
                  onChange={(e) => handleSaveSetting("routeDistance", Number(e.target.value))}
                  className="w-20 rounded-xl border bg-card px-3 py-2 text-sm text-right transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
                <span className="text-xs text-muted-foreground">km</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Mileage</p>
                  <p className="text-[10px] text-muted-foreground">km per liter</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={(settings.mileage as number) ?? 16}
                  onChange={(e) => handleSaveSetting("mileage", Number(e.target.value))}
                  className="w-20 rounded-xl border bg-card px-3 py-2 text-sm text-right transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
                <span className="text-xs text-muted-foreground">km/L</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Petrol Price Offset</p>
                  <p className="text-[10px] text-muted-foreground">Manual correction to API price</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={(settings.petrolPriceOffset as number) ?? 0}
                  onChange={(e) => handleSaveSetting("petrolPriceOffset", Number(e.target.value))}
                  className="w-20 rounded-xl border bg-card px-3 py-2 text-sm text-right transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
                <span className="text-xs text-muted-foreground">₹</span>
              </div>
            </div>
          </div>
        </SettingCard>

        {/* Admin Access */}
        <SettingCard icon={Shield} title="Admin Access">
          <div className="space-y-3">
            <div className="rounded-xl bg-muted/30 p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Secret URL</p>
              <p className="text-sm font-mono text-primary break-all">
                /?admin={String(settings.adminSecretUrl ?? "mite-admin-2026")}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5">
              <Shield className="h-3.5 w-3.5 text-destructive shrink-0" />
              <p className="text-xs text-destructive">Anyone with this URL can manage rides</p>
            </div>
          </div>
        </SettingCard>
      </div>

      {/* Member Distances */}
      <SettingCard icon={User} title="Member Distances">
        <div className="divide-y">
          {members.map((member, i) => (
            <div
              key={member.id}
              className={`flex items-center justify-between py-3 ${i === 0 ? "pt-0" : ""} ${i === members.length - 1 ? "pb-0" : ""}`}
            >
              <span className="text-sm font-medium">{member.name}</span>
              {editingMember === member.name ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editDistance}
                    onChange={(e) => setEditDistance(Number(e.target.value))}
                    className="w-20 rounded-xl border bg-card px-3 py-1.5 text-sm text-right transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveMemberDistance(member.name)}
                    className="rounded-lg bg-success/10 p-2 text-success hover:bg-success/20 transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingMember(null)}
                    className="rounded-lg bg-destructive/10 p-2 text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm tabular-nums text-muted-foreground">{member.distance} km</span>
                  <button
                    onClick={() => {
                      setEditingMember(member.name);
                      setEditDistance(member.distance);
                    }}
                    className="rounded-lg bg-muted/50 p-2 text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </SettingCard>

      {/* QR Code */}
      <SettingCard icon={QrCode} title="QR Code Settings">
        <div className="space-y-4">
          {qrPreview ? (
            <div className="flex justify-center">
              <div className="rounded-2xl border-2 border-primary/20 bg-white p-4 shadow-lg shadow-primary/5">
                <img src={qrPreview} alt="Payment QR" className="h-40 w-40 object-contain" />
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed bg-muted/30">
                <div className="text-center">
                  <QrCode className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                  <p className="mt-1 text-[10px] text-muted-foreground">No QR configured</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Image className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setQrFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-xl border bg-card py-2.5 pl-9 pr-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-primary/10 file:to-purple-500/10 file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary hover:file:from-primary/20 hover:file:to-purple-500/20 file:transition-all file:cursor-pointer"
              />
            </div>
            <button
              onClick={handleQrUpload}
              disabled={!qrFile}
              className="rounded-xl bg-gradient-to-r from-primary to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SettingCard>

      {/* Data Management */}
      <SettingCard icon={Download} title="Data Management">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleExport("json")}
            className="inline-flex items-center gap-2 rounded-xl border bg-card px-5 py-3 text-sm font-medium transition-all hover:bg-muted hover:shadow-sm hover:border-primary/30"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Export JSON
          </button>
          <button
            onClick={() => handleExport("csv")}
            className="inline-flex items-center gap-2 rounded-xl border bg-card px-5 py-3 text-sm font-medium transition-all hover:bg-muted hover:shadow-sm hover:border-primary/30"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </SettingCard>
    </div>
  );
}

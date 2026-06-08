"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  Clock,
  History,
  List,
  Settings,
} from "lucide-react";
import DashboardTab from "@/components/tabs/DashboardTab";
import CreateRideTab from "@/components/tabs/CreateRideTab";
import PendingPaymentsTab from "@/components/tabs/PendingPaymentsTab";
import PaymentHistoryTab from "@/components/tabs/PaymentHistoryTab";
import RideHistoryTab from "@/components/tabs/RideHistoryTab";
import SettingsTab from "@/components/tabs/SettingsTab";

const TAB_GLOW: Record<string, string> = {
  dashboard: "rgba(124,58,237,0.6)",
  create: "rgba(16,185,129,0.6)",
  pending: "rgba(245,158,11,0.6)",
  history: "rgba(124,58,237,0.6)",
  rides: "rgba(6,182,212,0.6)",
  settings: "rgba(100,116,139,0.6)",
};

const tabs = [
  { id: "dashboard", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard, adminOnly: false },
  { id: "create", label: "Create Ride", shortLabel: "Create", icon: PlusCircle, adminOnly: true },
  { id: "pending", label: "Pending", shortLabel: "Pending", icon: Clock, adminOnly: false },
  { id: "history", label: "History", shortLabel: "Paid", icon: History, adminOnly: false },
  { id: "rides", label: "Rides", shortLabel: "Rides", icon: List, adminOnly: false },
  { id: "settings", label: "Settings", shortLabel: "More", icon: Settings, adminOnly: true },
];

const TAB_SUBTITLES: Record<string, string> = {
  dashboard: "Behold the holy grail of fuel stats, debts & mileage.",
  create: "Log a journey and divide the fuel damage among passengers.",
  pending: "Track and collect pending payments.",
  history: "View complete payment history.",
  rides: "Chronicle of past road trips and mileage adventures.",
  settings: "Adjust the secret parameters of the Petrol Pandit universe.",
};

export default function TabRouter({
  isAdmin,
  adminToken,
}: {
  isAdmin: boolean;
  adminToken: string | null;
}) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [contentKey, setContentKey] = useState(0);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const navRef = useRef<HTMLDivElement>(null);



  // Read initial tab from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && tabs.find((t) => t.id === tab && (!t.adminOnly || isAdmin))) {
      setActiveTab(tab);
    }
  }, [isAdmin]);

  // Handle browser back/forward with admin-only tab protection
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab") || "dashboard";
      const targetTab = tabs.find((t) => t.id === tab);
      if (targetTab && (!targetTab.adminOnly || isAdmin)) {
        setActiveTab(tab);
      } else {
        setActiveTab("dashboard");
      }
      setContentKey((k) => k + 1);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isAdmin]);

  // Update indicator position — uses requestAnimationFrame for smoothness
  const updateIndicator = useCallback(() => {
    const el = tabRefs.current.get(activeTab);
    if (el) {
      setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [activeTab]);

  useEffect(() => {
    updateIndicator();
    const id = requestAnimationFrame(updateIndicator);
    window.addEventListener("resize", updateIndicator, { passive: true });
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [updateIndicator]);

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin);

  // Instant tab switch ── no ViewTransition API (causes jank on mobile)
  const switchTab = useCallback((tabId: string) => {
    // Tapping the active tab triggers a refresh of its content
    if (tabId === activeTab) {
      setContentKey((k) => k + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setActiveTab(tabId);
    setContentKey((k) => k + 1);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabId);
    window.history.pushState({}, "", url.toString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  // Listen to tabchange custom events from child components
  useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        switchTab(customEvent.detail);
      }
    };
    window.addEventListener("tabchange", handleTabChange);
    return () => window.removeEventListener("tabchange", handleTabChange);
  }, [switchTab]);

  const renderTabContent = () => {
    const activeTabData = tabs.find((t) => t.id === activeTab);
    const Icon = activeTabData?.icon || LayoutDashboard;
    return (
      <div key={contentKey} className="tab-content-enter">
        {/* Page header — compact on mobile */}
        <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-2xl font-bold tracking-tight leading-tight">
              {activeTabData?.label}
            </h2>
            <p className="text-[11px] sm:text-sm text-muted-foreground leading-snug line-clamp-1">
              {TAB_SUBTITLES[activeTab]}
            </p>
          </div>
        </div>
        {activeTab === "dashboard" && <DashboardTab isAdmin={isAdmin} />}
        {activeTab === "create" && isAdmin && <CreateRideTab />}
        {activeTab === "pending" && <PendingPaymentsTab isAdmin={isAdmin} />}
        {activeTab === "history" && <PaymentHistoryTab />}
        {activeTab === "rides" && <RideHistoryTab isAdmin={isAdmin} />}
        {activeTab === "settings" && isAdmin && <SettingsTab />}
      </div>
    );
  };

  return (
    <div className="pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6">
      {/* ── Floating Bottom Nav (Mobile) / Top Nav (Desktop) ── */}
      <div
        ref={navRef}
        className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-3 right-3 z-50 md:relative md:bottom-auto md:left-auto md:right-auto md:mb-6 max-w-4xl md:mx-auto"
      >
        <nav
          className="relative rounded-2xl bg-[#0d0f17]/90 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)] p-1"
          role="tablist"
          aria-label="Main navigation"
        >
          {/* Tab buttons */}
          <div className="flex relative z-10">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => { if (el) tabRefs.current.set(tab.id, el); }}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={tab.label}
                  // onPointerDown for instant response — no 300ms delay
                  onPointerDown={(e) => {
                    e.preventDefault(); // prevent ghost click
                    switchTab(tab.id);
                  }}
                  className={`
                    relative flex flex-col items-center justify-center gap-0.5
                    flex-1 min-w-0 min-h-[52px] sm:min-h-[48px]
                    py-2 px-1 rounded-xl z-10
                    select-none touch-manipulation
                    transition-colors duration-150
                    ${isActive
                      ? "text-white"
                      : "text-white/40 active:text-white/70 active:bg-white/5"
                    }
                  `}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isActive ? "scale-110" : "scale-100"}`}
                    style={isActive ? { filter: `drop-shadow(0 0 8px ${TAB_GLOW[tab.id]})` } : undefined}
                  />
                  <span className="text-[9px] xs:text-[10px] font-bold leading-none block md:hidden">
                    {tab.shortLabel}
                  </span>
                  <span className="text-xs font-bold leading-none hidden md:block">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sliding indicator — GPU composited via transform */}
          {indicatorStyle.width > 0 && (
            <div
              className="absolute inset-y-1 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] z-0 pointer-events-none"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
                boxShadow: "0 0 12px rgba(124,58,237,0.4), 0 0 24px rgba(109,40,217,0.2)",
                willChange: "left, width",
                transition: "left 320ms cubic-bezier(0.34, 1.2, 0.64, 1), width 320ms cubic-bezier(0.34, 1.2, 0.64, 1)",
              }}
            />
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="relative">
        {renderTabContent()}
      </div>
    </div>
  );
}

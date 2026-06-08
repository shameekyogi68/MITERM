"use client";

import { useState, useEffect, useRef } from "react";
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
  { id: "dashboard", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard, adminOnly: false, color: "from-blue-500 to-blue-600" },
  { id: "create", label: "Create Ride", shortLabel: "Create", icon: PlusCircle, adminOnly: true, color: "from-emerald-500 to-emerald-600" },
  { id: "pending", label: "Pending", shortLabel: "Pending", icon: Clock, adminOnly: false, color: "from-orange-500 to-orange-600" },
  { id: "history", label: "History", shortLabel: "Paid", icon: History, adminOnly: false, color: "from-purple-500 to-purple-600" },
  { id: "rides", label: "Rides", shortLabel: "Rides", icon: List, adminOnly: false, color: "from-pink-500 to-pink-600" },
  { id: "settings", label: "Settings", shortLabel: "Settings", icon: Settings, adminOnly: true, color: "from-slate-500 to-slate-600" },
];

export default function TabRouter({
  isAdmin,
  adminToken,
}: {
  isAdmin: boolean;
  adminToken: string | null;
}) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && tabs.find((t) => t.id === tab && (!t.adminOnly || isAdmin))) {
      setActiveTab(tab);
    }

    const handleTabChange = (e: CustomEvent) => {
      const changeState = () => setActiveTab(e.detail);
      if (typeof document !== "undefined" && "startViewTransition" in document) {
        (document as any).startViewTransition(changeState);
      } else {
        changeState();
      }
    };
    window.addEventListener("tabchange", handleTabChange as EventListener);

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab) {
        const changeState = () => setActiveTab(tab);
        if (typeof document !== "undefined" && "startViewTransition" in document) {
          (document as any).startViewTransition(changeState);
        } else {
          changeState();
        }
      }
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("tabchange", handleTabChange as EventListener);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isAdmin]);

  // Update indicator position with resize and load checks
  useEffect(() => {
    const updateIndicator = () => {
      const el = tabRefs.current.get(activeTab);
      if (el) {
        setIndicatorStyle({
          left: el.offsetLeft,
          width: el.offsetWidth,
        });
      }
    };

    updateIndicator();
    // Run after a small delay to make sure rendering and fonts are fully settled
    const timer = setTimeout(updateIndicator, 50);

    window.addEventListener("resize", updateIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeTab]);

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin);

  const switchTab = (tabId: string) => {
    const changeState = () => {
      setActiveTab(tabId);
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tabId);
      window.history.pushState({}, "", url.toString());
    };

    if (typeof document !== "undefined" && "startViewTransition" in document) {
      (document as any).startViewTransition(changeState);
    } else {
      changeState();
    }
  };

  const getTabIcon = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    return tab?.icon || LayoutDashboard;
  };

  const renderTabContent = () => {
    const Icon = getTabIcon(activeTab);
    return (
      <div key={activeTab} className="animate-slide-up-fade">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 animate-spring-in">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h2>
            <p className="text-sm text-muted-foreground">
              {activeTab === "dashboard" && "Overview of rides, payments, and statistics"}
              {activeTab === "create" && "Record a new trip and calculate shares"}
              {activeTab === "pending" && "Track and manage pending payments"}
              {activeTab === "history" && "View complete payment history"}
              {activeTab === "rides" && "Browse all past rides"}
              {activeTab === "settings" && "Configure system settings"}
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
    <div className="space-y-6 pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:pb-6 animate-fade-in">
      {/* Floating Bottom Tab Navigation on Mobile, original Top Navigation on Desktop */}
      <div className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-3.5 right-3.5 z-50 md:relative md:bottom-auto md:left-auto md:right-auto bg-transparent border-0 rounded-2xl p-0 max-w-4xl mx-auto">
        <div className="relative rounded-2xl glass-premium p-1.5 shadow-2xl border-white/10 backdrop-blur-2xl">
          <div className="flex gap-0.5 relative z-10">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    if (el) tabRefs.current.set(tab.id, el);
                  }}
                  onClick={() => switchTab(tab.id)}
                  className={`relative flex flex-col items-center justify-center gap-0.5 sm:gap-1 rounded-xl py-1.5 px-0.5 text-center transition-all duration-300 min-w-0 flex-1 z-10 select-none cursor-pointer ${
                    isActive
                      ? "text-white font-extrabold"
                      : "text-white/35 hover:text-white/60 hover:bg-white/5"
                  }`}
                >
                  <Icon
                    className={`h-4.5 w-4.5 shrink-0 transition-all duration-300 ${isActive ? "scale-110 text-white" : "text-white/60"}`}
                    style={isActive ? { filter: `drop-shadow(0 0 10px ${TAB_GLOW[tab.id]})` } : undefined}
                  />
                  <span className="text-[9px] xs:text-[10px] md:text-xs block md:hidden truncate max-w-full font-bold">{tab.shortLabel}</span>
                  <span className="text-xs font-bold hidden md:block truncate max-w-full">{tab.label}</span>
                </button>
              );
            })}
          </div>
          {/* Animated sliding indicator with spring physics */}
          {indicatorStyle.width > 0 && (
            <div
              className="absolute bottom-1.5 top-1.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] z-0"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
                boxShadow: "0 0 15px rgba(124,58,237,0.35), 0 0 30px rgba(109,40,217,0.15)",
              }}
            />
          )}
        </div>
      </div>

      {/* Tab Content with animated transitions */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent rounded-3xl pointer-events-none" />
        <div className="relative">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

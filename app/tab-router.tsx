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

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false, color: "from-blue-500 to-blue-600" },
  { id: "create", label: "Create Ride", icon: PlusCircle, adminOnly: true, color: "from-emerald-500 to-emerald-600" },
  { id: "pending", label: "Pending", icon: Clock, adminOnly: false, color: "from-orange-500 to-orange-600" },
  { id: "history", label: "History", icon: History, adminOnly: false, color: "from-purple-500 to-purple-600" },
  { id: "rides", label: "Rides", icon: List, adminOnly: false, color: "from-pink-500 to-pink-600" },
  { id: "settings", label: "Settings", icon: Settings, adminOnly: true, color: "from-slate-500 to-slate-600" },
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
      setActiveTab(e.detail);
    };
    window.addEventListener("tabchange", handleTabChange as EventListener);

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab) setActiveTab(tab);
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("tabchange", handleTabChange as EventListener);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isAdmin]);

  // Update indicator position
  useEffect(() => {
    const el = tabRefs.current.get(activeTab);
    if (el) {
      setIndicatorStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
      });
    }
  }, [activeTab]);

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin);

  const switchTab = (tabId: string) => {
    setActiveTab(tabId);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabId);
    window.history.pushState({}, "", url.toString());
  };

  const getTabIcon = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    return tab?.icon || LayoutDashboard;
  };

  const renderTabContent = () => {
    const Icon = getTabIcon(activeTab);
    return (
      <div key={activeTab} className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
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
    <div className="space-y-6">
      {/* Premium Tab Navigation */}
      <div className="relative rounded-2xl glass-strong shadow-lg shadow-primary/5 p-1.5">
        <div className="flex gap-1">
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
                className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 min-w-0 z-10 ${
                  isActive
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isActive ? "scale-110" : ""}`} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
        {/* Animated sliding indicator */}
        <div
          className="absolute bottom-1.5 top-1.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 shadow-lg shadow-primary/30 transition-all duration-300 ease-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />
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

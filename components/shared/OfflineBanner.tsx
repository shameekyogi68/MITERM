"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi, RefreshCw, CloudOff, Cloud } from "lucide-react";
import { getPendingCount } from "@/lib/offline-storage";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const checkOnline = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        getPendingCount().then(setPendingCount);
      }
    };

    const handleOnline = async () => {
      setIsOnline(true);
      const count = await getPendingCount();
      setPendingCount(count);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    checkOnline();
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const interval = setInterval(async () => {
      if (navigator.onLine) {
        const count = await getPendingCount();
        setPendingCount(count);
      }
    }, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="relative overflow-hidden">
      {isOnline ? (
        <div className="bg-gradient-to-r from-verification to-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white shadow-lg shadow-verification/20">
          <div className="flex items-center justify-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
              <RefreshCw className="h-3 w-3 animate-spin" />
            </div>
            <span>
              {pendingCount} pending action{pendingCount !== 1 ? "s" : ""} — syncing...
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-destructive to-red-600 px-4 py-2.5 text-center text-sm font-medium text-white shadow-lg shadow-destructive/20">
          <div className="flex items-center justify-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
              <WifiOff className="h-3 w-3" />
            </div>
            <span>You are offline. Changes will sync when reconnected.</span>
          </div>
        </div>
      )}
    </div>
  );
}

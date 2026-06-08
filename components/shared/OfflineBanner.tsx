"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { getPendingCount, getPendingActions, removeAction, incrementRetry } from "@/lib/offline-storage";
import { createRide } from "@/app/actions/ride.actions";
import { markPayment, verifyPayment } from "@/app/actions/payment.actions";

async function syncOfflineActions() {
  if (typeof window === "undefined" || !navigator.onLine) return;

  try {
    const actions = await getPendingActions();
    if (actions.length === 0) return;

    for (const action of actions) {
      if (action.retryCount >= 5) {
        console.warn("Offline action failed too many times, skipping:", action);
        continue;
      }

      try {
        let result: { success: boolean; error?: string } = { success: false };
        
        if (action.type === "CREATE_RIDE") {
          result = await createRide(action.data as any);
        } else if (action.type === "MARK_PAYMENT") {
          result = await markPayment(action.data as any);
        } else if (action.type === "VERIFY_PAYMENT") {
          result = await verifyPayment(action.data as any);
        }

        if (result.success) {
          await removeAction(action.id);
        } else {
          console.error("Action sync returned failure:", result.error);
          await incrementRetry(action.id);
        }
      } catch (err) {
        console.error("Action sync exception:", err);
        await incrementRetry(action.id);
      }
    }
  } catch (err) {
    console.error("Failed to read pending actions from IndexedDB:", err);
  }
}

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const checkOnline = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) {
        syncOfflineActions().then(() => {
          getPendingCount().then(setPendingCount).catch(() => {});
        }).catch(() => {});
      }
    };

    const handleOnline = async () => {
      setIsOnline(true);
      await syncOfflineActions();
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
        await syncOfflineActions();
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

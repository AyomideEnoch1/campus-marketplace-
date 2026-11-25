"use client";

import * as React from "react";
import { Bell, BellRing, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BGUYmBJlFhHTxcRc7PGjlgQ9xsXYEIqvcxhFa7uzLjrvR7jTqxha1TQk0kPqyaXIx6dXorerGKrMZwg-Z8m5q30";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function DeviceNotificationPrompt({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  const [isSupported, setIsSupported] = React.useState<boolean>(false);
  const [permission, setPermission] = React.useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [testing, setTesting] = React.useState<boolean>(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Check if already subscribed
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => {
          if (sub) {
            setIsSubscribed(true);
          }
        })
        .catch(() => null);
    }
  }, []);

  const handleSubscribe = async () => {
    if (!isSupported) {
      setMessage({ type: "error", text: "Push notifications are not supported on this browser." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // 1. Request permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        setMessage({
          type: "error",
          text: result === "denied"
            ? "Notifications blocked in your browser settings. Please click the padlock in your URL bar and allow notifications."
            : "Notification permission was dismissed.",
        });
        setLoading(false);
        return;
      }

      // 2. Register service worker
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      // 3. Subscribe to push manager
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
        });
      }

      // 4. Save subscription to backend
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to register device subscription on server");
      }

      setIsSubscribed(true);
      setMessage({
        type: "success",
        text: "Device notifications enabled! You will receive drop-down alerts for new orders & messages.",
      });

      // Automatically trigger a test drop-down alert
      setTimeout(() => {
        handleSendTest();
      }, 1000);
    } catch (err: any) {
      console.error("[Subscribe Error]:", err);
      setMessage({ type: "error", text: err.message || "Failed to enable notifications" });
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send test push notification");
      }
      setMessage({
        type: "success",
        text: "Test notification sent! Check the top drop-down banner on your device.",
      });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Could not deliver test notification" });
    } finally {
      setTesting(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  // If compact mode (for headers or toolbars)
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {isSubscribed && permission === "granted" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSendTest}
            disabled={testing}
            className="text-xs h-8 gap-1.5 rounded-xl border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
          >
            <BellRing className="w-3.5 h-3.5 text-emerald-600" />
            <span>{testing ? "Testing..." : "Test Dropdown Alert"}</span>
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={handleSubscribe}
            disabled={loading}
            className="text-xs h-8 gap-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white shadow-xs"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{loading ? "Enabling..." : "Enable Device Alerts"}</span>
          </Button>
        )}
      </div>
    );
  }

  // Full banner mode (for Dashboard overview, messages, and orders)
  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
        isSubscribed && permission === "granted"
          ? "bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-white border-emerald-200"
          : "bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white border-purple-200"
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              isSubscribed && permission === "granted"
                ? "bg-emerald-600 text-white"
                : "bg-purple-700 text-white"
            }`}
          >
            {isSubscribed && permission === "granted" ? (
              <BellRing className="w-5 h-5 animate-pulse" />
            ) : (
              <Smartphone className="w-5 h-5" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-neutral-900">
                {isSubscribed && permission === "granted"
                  ? "Device Drop-Down Notifications: Active"
                  : "Get Instant Drop-Down Alerts on Your Device"}
              </h4>
              {isSubscribed && permission === "granted" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Enabled
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-600 max-w-xl leading-relaxed">
              {isSubscribed && permission === "granted"
                ? "Your phone or computer will drop down a notification the moment a student places an order or sends an in-app message, even when ọjà is closed."
                : "Never miss a sale or inquiry! Receive real-time push banners outside the browser on your phone lock screen or desktop whenever an order or message arrives."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
          {isSubscribed && permission === "granted" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSendTest}
              disabled={testing}
              className="w-full sm:w-auto text-xs font-bold rounded-xl border-emerald-300 hover:bg-emerald-100/70 text-emerald-900 gap-1.5 h-10"
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BellRing className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{testing ? "Sending Dropdown..." : "Test Device Dropdown"}</span>
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full sm:w-auto text-xs font-bold rounded-xl bg-purple-700 hover:bg-purple-800 text-white gap-2 h-10 shadow-md shadow-purple-700/20"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
              <span>{loading ? "Activating..." : "Enable Device Notifications"}</span>
            </Button>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`mt-3 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-100/80 text-emerald-900 border border-emerald-200"
              : message.type === "error"
              ? "bg-rose-100/80 text-rose-900 border border-rose-200"
              : "bg-blue-100/80 text-blue-900 border border-blue-200"
          }`}
        >
          {message.type === "success" ? (
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}

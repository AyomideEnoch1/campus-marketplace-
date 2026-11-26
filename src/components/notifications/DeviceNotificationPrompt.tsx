"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  BellRing,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Smartphone,
  LogIn,
  X,
  Sparkles,
  MessageCircle,
} from "lucide-react";
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
  variant = "banner",
  mode = "vendor",
  className = "",
}: {
  compact?: boolean;
  variant?: "banner" | "popup" | "compact";
  mode?: "vendor" | "user";
  className?: string;
}) {
  const [isSupported, setIsSupported] = React.useState<boolean>(false);
  const [permission, setPermission] = React.useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [testing, setTesting] = React.useState<boolean>(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  const effectiveVariant = compact ? "compact" : variant;

  React.useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window) {
      setIsSupported(true);
      const perm = Notification.permission;
      setPermission(perm);

      // If already granted, ensure sw registration and sync subscription to backend
      if (perm === "granted") {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((reg) => reg.pushManager.getSubscription())
          .then(async (sub) => {
            if (sub) {
              setIsSubscribed(true);
              const subJson = typeof sub.toJSON === "function" ? sub.toJSON() : sub;
              // Auto-sync subscription with current user on server
              await fetch("/api/push/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscription: subJson }),
              }).catch(() => null);
            }
          })
          .catch(() => null);
      } else if (effectiveVariant === "popup" && perm === "default") {
        // If popup mode and permission is default, check if user dismissed recently
        try {
          const dismissed = localStorage.getItem("oja_push_prompt_dismissed");
          if (dismissed && Date.now() - parseInt(dismissed, 10) < 7 * 24 * 60 * 60 * 1000) {
            return;
          }
        } catch {}

        // Delay popup slightly (2.5s) to avoid interrupting initial render
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [effectiveVariant]);

  // Handle ESC key to dismiss modal when in popup mode
  React.useEffect(() => {
    if (effectiveVariant !== "popup" || !isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [effectiveVariant, isOpen]);

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      localStorage.setItem("oja_push_prompt_dismissed", Date.now().toString());
    } catch {}
  };

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

      // 3. Renew subscription to ensure clean match with current VAPID key
      let sub = await reg.pushManager.getSubscription();
      if (sub) {
        try {
          await sub.unsubscribe();
        } catch {}
      }

      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
      });

      const subJson = typeof sub.toJSON === "function" ? sub.toJSON() : sub;

      // 4. Save subscription to backend
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subJson }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        if (res.status === 401 || data.error?.toLowerCase().includes("unauthorized")) {
          throw new Error("You must be logged in to enable device notifications. Please sign in to your account first.");
        }
        throw new Error(data.error || "Failed to register device subscription on server");
      }

      setIsSubscribed(true);
      setMessage({
        type: "success",
        text: "Device notifications enabled! Triggering test drop-down alert...",
      });

      // Show immediate native device drop-down alert
      try {
        await reg.showNotification("🎉 Device Notification Active!", {
          body: "You will now receive instant drop-down alerts on this device whenever an order is placed, a message arrives, or new products drop.",
          icon: "/images/logo.png",
          badge: "/images/logo.png",
          tag: "oja-welcome-alert",
        });
      } catch {}

      // Also trigger server-side test
      setTimeout(() => {
        handleSendTest();
      }, 800);
    } catch (err: any) {
      console.error("[Subscribe Error]:", err);
      const errText = err?.message || "";
      if (errText.includes("push service not available") || errText.includes("AbortError")) {
        setMessage({
          type: "error",
          text: "Google Push Service is restricted on your device. This occurs when Android Battery Saver is active (restricting Google Play Services) or in Incognito mode. Please disable Battery Saver, plug in your phone, or switch to a normal tab and try again.",
        });
      } else {
        setMessage({ type: "error", text: errText || "Failed to enable notifications" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
        });
      }

      // Show immediate native drop-down alert on the device screen
      try {
        await reg.showNotification("🎉 Device Notification Active!", {
          body: "You will now receive instant drop-down alerts on this device whenever an order is placed, a message arrives, or new products drop.",
          icon: "/images/logo.png",
          badge: "/images/logo.png",
          tag: "oja-test-alert",
        });
      } catch {}

      const subJson = typeof sub.toJSON === "function" ? sub.toJSON() : sub;

      // Deliver via backend web-push with subscription payload included
      const res = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subJson }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        if (res.status === 401 || data.error?.toLowerCase().includes("unauthorized")) {
          throw new Error("You must be logged in to test device notifications. Please sign in to your account first.");
        }
        throw new Error(data.error || "Failed to send test push notification");
      }

      setIsSubscribed(true);
      setMessage({
        type: "success",
        text: "Test notification sent! Check the top drop-down banner on your device.",
      });
    } catch (err: any) {
      const errText = err?.message || "";
      if (errText.includes("push service not available") || errText.includes("AbortError")) {
        setMessage({
          type: "error",
          text: "Google Push Service is restricted on your device. Please disable Battery Saver or plug in your phone to allow Google Play Services to connect.",
        });
      } else {
        setMessage({ type: "error", text: errText || "Could not deliver test notification" });
      }
    } finally {
      setTesting(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  // 1. Popup mode (e.g. for Shop / Buyer pages)
  if (effectiveVariant === "popup") {
    // If modal is not open, render nothing to keep page completely clean
    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-950/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleDismiss();
          }
        }}
      >
        <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl border border-neutral-100 space-y-5 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
          {/* Mobile drag handle */}
          <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto sm:hidden -mt-2 mb-1" />

          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {isSubscribed && permission === "granted" ? (
            /* Subscribed Success View inside Popup */
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-extrabold text-neutral-900">
                  Device Alerts Active! 🎉
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-sm mx-auto">
                  Your device is connected! You will now receive instant drop-down alerts whenever a seller replies or new items drop on campus.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendTest}
                  disabled={testing}
                  className="w-full h-11 rounded-2xl border-emerald-300 text-emerald-900 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold gap-2"
                >
                  {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4 text-emerald-600" />}
                  <span>{testing ? "Sending alert..." : "Test Device Dropdown"}</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full h-11 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          ) : (
            /* Unsubscribed / Default Prompt View inside Popup */
            <div className="space-y-5">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-inner">
                  <BellRing className="w-7 h-7 text-purple-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-neutral-900">
                    Never Miss Deals & Replies 🔔
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 mt-1 leading-relaxed">
                    Turn on instant drop-down alerts so you know the moment a seller answers your questions or new products arrive on campus.
                  </p>
                </div>
              </div>

              <div className="bg-neutral-50 rounded-2xl p-3.5 space-y-2.5 text-xs text-neutral-700 border border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Instant alerts when sellers reply to your chats</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Be first to catch fresh campus deals and price cuts</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Works even when ọjà is closed &bull; 100% spam-free</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <Button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full h-11 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm shadow-md shadow-purple-700/25 flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                  <span>{loading ? "Activating..." : "Turn On Notifications"}</span>
                </Button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full py-2.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          )}

          {message && (
            <div
              className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between gap-3 ${
                message.type === "success"
                  ? "bg-emerald-100/80 text-emerald-900 border border-emerald-200"
                  : message.type === "error"
                  ? "bg-rose-100/80 text-rose-900 border border-rose-200"
                  : "bg-blue-100/80 text-blue-900 border border-blue-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {message.type === "success" ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{message.text}</span>
              </div>

              {message.text.toLowerCase().includes("sign in") || message.text.toLowerCase().includes("logged in") ? (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 transition-colors shadow-2xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In</span>
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Compact mode (for headers or toolbars)
  if (effectiveVariant === "compact") {
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
                  : mode === "user"
                  ? "Get Instant Chat & New Arrival Alerts on Your Device"
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
                ? mode === "user"
                  ? "Your phone or computer will drop down an instant notification whenever a vendor replies to you or new products arrive on campus, even when ọjà is closed."
                  : "Your phone or computer will drop down a notification the moment a student places an order or sends an in-app message, even when ọjà is closed."
                : mode === "user"
                ? "Never miss a seller reply or hot new arrival! Receive real-time push banners outside the browser on your phone lock screen or desktop whenever a vendor chats with you or new items drop."
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
          className={`mt-3 p-3 rounded-xl text-xs font-medium flex items-center justify-between gap-3 ${
            message.type === "success"
              ? "bg-emerald-100/80 text-emerald-900 border border-emerald-200"
              : message.type === "error"
              ? "bg-rose-100/80 text-rose-900 border border-rose-200"
              : "bg-blue-100/80 text-blue-900 border border-blue-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>

          {message.text.toLowerCase().includes("sign in") || message.text.toLowerCase().includes("logged in") ? (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 transition-colors shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}

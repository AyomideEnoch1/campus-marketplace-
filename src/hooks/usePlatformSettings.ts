"use client";

import * as React from "react";

export interface PlatformSettingsState {
  enableStandardVendorAccess: boolean;
  enableFoundingVendorCoupon: boolean;
  enableFlutterwaveCheckout: boolean;
  isFlutterwaveLocked: boolean;
  requireVendorPayment: boolean;
  vendorAccessFee: number;
  vendorAccessDurationDays: number;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function usePlatformSettings(): PlatformSettingsState {
  const initialLocked = process.env.NEXT_PUBLIC_FLUTTERWAVE_LOCKED !== "false";

  const [settings, setSettings] = React.useState({
    enableStandardVendorAccess: true,
    enableFoundingVendorCoupon: true,
    enableFlutterwaveCheckout: !initialLocked,
    isFlutterwaveLocked: initialLocked,
    requireVendorPayment: true,
    vendorAccessFee: 15000,
    vendorAccessDurationDays: 365,
    loading: true,
  });

  const fetchSettings = React.useCallback(async () => {
    try {
      const res = await fetch("/api/platform-settings", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setSettings({
        enableStandardVendorAccess: data.enableStandardVendorAccess !== false,
        enableFoundingVendorCoupon: data.enableFoundingVendorCoupon !== false,
        enableFlutterwaveCheckout: Boolean(data.enableFlutterwaveCheckout),
        isFlutterwaveLocked: Boolean(data.isFlutterwaveLocked),
        requireVendorPayment: data.requireVendorPayment !== false,
        vendorAccessFee: Number(data.vendorAccessFee) || 15000,
        vendorAccessDurationDays: Number(data.vendorAccessDurationDays) || 365,
        loading: false,
      });
    } catch {
      setSettings((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  React.useEffect(() => {
    fetchSettings();

    // Re-check when user focuses window or returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchSettings();
      }
    };

    window.addEventListener("focus", fetchSettings);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", fetchSettings);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchSettings]);

  return {
    ...settings,
    refetch: fetchSettings,
  };
}

"use client";

import * as React from "react";
import { ShoppingBag, ArrowRightLeft, Loader2 } from "lucide-react";
import { SignoutModal } from "@/components/ui/SignoutModal";

interface SwitchRoleButtonProps {
  targetRole: "BUYER" | "VENDOR";
  variant?: "dropdown" | "pill" | "sidebar";
  className?: string;
  onSuccess?: () => void;
}

export function SwitchRoleButton({
  targetRole,
  variant = "dropdown",
  className,
  onSuccess,
}: SwitchRoleButtonProps) {
  const [isSwitching, setIsSwitching] = React.useState(false);

  const isSwitchingToVendor = targetRole === "VENDOR";

  const handleSwitch = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSwitching) return;

    setIsSwitching(true);

    try {
      const res = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to switch role");
      }

      if (onSuccess) onSuccess();
      window.location.href = data.redirectUrl || (isSwitchingToVendor ? "/dashboard" : "/shop");
    } catch (err: any) {
      console.error("Account switch error:", err);
      alert(err.message || "Failed to switch account mode. Please try again.");
      setIsSwitching(false);
    }
  };

  const label = isSwitchingToVendor ? "Switch to Seller" : "Switch to Buyer";
  const modalMessage = isSwitchingToVendor
    ? "Switching to Seller..."
    : "Switching to Buyer...";
  const modalSubmessage = isSwitchingToVendor
    ? "Loading your seller dashboard..."
    : "Loading your campus shopping session...";

  if (variant === "pill") {
    return (
      <>
        <button
          type="button"
          onClick={handleSwitch}
          disabled={isSwitching}
          className={
            className ||
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs border cursor-pointer " +
            (isSwitchingToVendor
              ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
              : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-200")
          }
        >
          {isSwitching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ArrowRightLeft className="w-3.5 h-3.5" />
          )}
          <span>{isSwitching ? "Switching..." : label}</span>
        </button>

        <SignoutModal
          isOpen={isSwitching}
          message={modalMessage}
          submessage={modalSubmessage}
          onClose={() => setIsSwitching(false)}
        />
      </>
    );
  }

  if (variant === "sidebar") {
    return (
      <>
        <button
          type="button"
          onClick={handleSwitch}
          disabled={isSwitching}
          className={
            className ||
            "w-full flex items-center justify-center gap-1.5 p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/60 text-emerald-800 text-xs font-bold transition-colors cursor-pointer"
          }
        >
          {isSwitching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
          ) : (
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
          )}
          <span>{isSwitching ? "Switching..." : label}</span>
        </button>

        <SignoutModal
          isOpen={isSwitching}
          message={modalMessage}
          submessage={modalSubmessage}
          onClose={() => setIsSwitching(false)}
        />
      </>
    );
  }

  // Default: dropdown item
  return (
    <>
      <button
        type="button"
        onClick={handleSwitch}
        disabled={isSwitching}
        className={
          className ||
          "flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-semibold transition-colors text-left cursor-pointer " +
          (isSwitchingToVendor
            ? "text-emerald-700 hover:bg-emerald-50 bg-emerald-50/50"
            : "text-neutral-700 hover:bg-neutral-50")
        }
      >
        {isSwitching ? (
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
        ) : (
          <ArrowRightLeft className="w-4 h-4 text-emerald-600 shrink-0" />
        )}
        <span>{isSwitching ? "Switching Mode..." : label}</span>
      </button>

      <SignoutModal
        isOpen={isSwitching}
        message={modalMessage}
        submessage={modalSubmessage}
        onClose={() => setIsSwitching(false)}
      />
    </>
  );
}

export default SwitchRoleButton;

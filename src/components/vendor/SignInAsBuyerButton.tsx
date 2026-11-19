"use client";

import * as React from "react";
import { ShoppingBag, Loader2 } from "lucide-react";
import { SignoutModal } from "@/components/ui/SignoutModal";

interface SignInAsBuyerButtonProps {
  className?: string;
  variant?: "sidebar" | "dropdown";
  collapsed?: boolean;
}

export function SignInAsBuyerButton({
  className,
  variant = "sidebar",
  collapsed = false,
}: SignInAsBuyerButtonProps) {
  const [isSwitching, setIsSwitching] = React.useState(false);

  const handleSwitch = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSwitching) return;

    setIsSwitching(true);

    try {
      const res = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole: "BUYER" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to switch account mode");
      }

      window.location.href = data.redirectUrl || "/shop";
    } catch (err: any) {
      console.error("Sign in as buyer error:", err);
      alert(err.message || "Failed to switch to buyer mode. Please try again.");
      setIsSwitching(false);
    }
  };

  if (collapsed) {
    return (
      <>
        <button
          type="button"
          onClick={handleSwitch}
          disabled={isSwitching}
          title="Switch to Buyer"
          className={
            className ||
            "w-10 h-10 mx-auto flex items-center justify-center rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/60 text-emerald-800 transition-colors cursor-pointer group relative"
          }
        >
          {isSwitching ? (
            <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
          ) : (
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          )}
          <span className="sr-only">Switch to Buyer</span>
        </button>

        <SignoutModal
          isOpen={isSwitching}
          message="Switching to Buyer..."
          submessage="Loading your campus shopping session..."
          onClose={() => setIsSwitching(false)}
        />
      </>
    );
  }

  if (variant === "dropdown") {
    return (
      <>
        <button
          type="button"
          onClick={handleSwitch}
          disabled={isSwitching}
          className={
            className ||
            "flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors text-left cursor-pointer"
          }
        >
          {isSwitching ? (
            <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
          ) : (
            <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{isSwitching ? "Switching..." : "Switch to Buyer"}</span>
        </button>

        <SignoutModal
          isOpen={isSwitching}
          message="Switching to Buyer..."
          submessage="Loading your campus shopping session..."
          onClose={() => setIsSwitching(false)}
        />
      </>
    );
  }

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
          <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
        ) : (
          <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
        )}
        <span>{isSwitching ? "Switching..." : "Switch to Buyer"}</span>
      </button>

      <SignoutModal
        isOpen={isSwitching}
        message="Switching to Buyer..."
        submessage="Loading your campus shopping session..."
        onClose={() => setIsSwitching(false)}
      />
    </>
  );
}

export default SignInAsBuyerButton;

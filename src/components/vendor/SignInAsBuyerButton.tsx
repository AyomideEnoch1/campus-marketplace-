"use client";

import * as React from "react";
import { ShoppingBag } from "lucide-react";
import { SignoutModal } from "@/components/ui/SignoutModal";

interface SignInAsBuyerButtonProps {
  className?: string;
  variant?: "sidebar" | "dropdown";
}

export function SignInAsBuyerButton({
  className,
  variant = "sidebar",
}: SignInAsBuyerButtonProps) {
  const [isSwitching, setIsSwitching] = React.useState(false);

  const handleSwitch = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isSwitching) return;

    setIsSwitching(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Sign in as buyer error:", err);
    } finally {
      window.location.href = "/auth/login?role=buyer";
    }
  };

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
          <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Sign in as a Buyer</span>
        </button>

        <SignoutModal
          isOpen={isSwitching}
          message="Switching to Student Buyer..."
          submessage="Clearing vendor session and redirecting to buyer sign-in..."
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
        <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
        <span>Sign in as a Buyer</span>
      </button>

      <SignoutModal
        isOpen={isSwitching}
        message="Switching to Student Buyer..."
        submessage="Clearing vendor session and redirecting to buyer sign-in..."
        onClose={() => setIsSwitching(false)}
      />
    </>
  );
}

export default SignInAsBuyerButton;

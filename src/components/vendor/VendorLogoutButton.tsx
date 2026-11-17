"use client";

import * as React from "react";
import { LogOut } from "lucide-react";
import { SignoutModal } from "@/components/ui/SignoutModal";

interface VendorLogoutButtonProps {
  className?: string;
  variant?: "vendor" | "admin";
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function VendorLogoutButton({
  className = "text-rose-600 hover:underline text-[11px] font-medium cursor-pointer transition-colors",
  variant = "vendor",
  showIcon = false,
  children,
}: VendorLogoutButtonProps) {
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isSigningOut) return;

    setIsSigningOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Force full window reload/navigation to clear all memory state & session cookies
      window.location.href = variant === "admin" ? "/admin/login" : "/auth/login";
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isSigningOut}
        className={className}
      >
        {children ? (
          children
        ) : showIcon ? (
          <span className="flex items-center gap-1.5">
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </span>
        ) : (
          <span>Logout</span>
        )}
      </button>

      <SignoutModal onClose={() => setIsSigningOut(false)}
        isOpen={isSigningOut}
        message={
          variant === "admin"
            ? "Signing Out of Admin Portal..."
            : "Signing Out of Vendor Dashboard..."
        }
        submessage={
          variant === "admin"
            ? "Please wait while we secure your administrative session."
            : "Please wait while we secure your storefront session."
        }
      />
    </>
  );
}

export default VendorLogoutButton;

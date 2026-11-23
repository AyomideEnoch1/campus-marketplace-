"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface GoogleSignInButtonProps {
  role?: "BUYER" | "VENDOR";
  sellerType?: "student" | "guest";
  redirect?: string;
  text?: string;
  className?: string;
  disabled?: boolean;
}

export function GoogleSignInButton({
  role,
  sellerType,
  redirect,
  text = "Continue with Google",
  className = "",
  disabled = false,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = React.useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (loading || disabled) return;

    setLoading(true);

    const query = new URLSearchParams();
    if (role) query.set("role", role);
    if (sellerType) query.set("sellerType", sellerType);
    if (redirect) query.set("redirect", redirect);

    const targetUrl = `/api/auth/google${query.toString() ? `?${query.toString()}` : ""}`;
    window.location.href = targetUrl;
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={loading || disabled}
      variant="outline"
      className={cn(
        "w-full h-11 bg-white hover:bg-neutral-50/90 text-neutral-700 font-medium text-xs rounded-2xl border border-neutral-200/90 shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
    >
      {loading ? (
        <div className="flex items-center gap-2 text-neutral-600">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Connecting to Google...</span>
        </div>
      ) : (
        <>
          {/* Official Google 'G' Logo SVG */}
          <svg
            className="w-4 h-4 shrink-0"
            viewBox="0 0 24 24"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
          <span>{text}</span>
        </>
      )}
    </Button>
  );
}

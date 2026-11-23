"use client";

import * as React from "react";
import { Clock, Flame } from "lucide-react";

interface PromoCountdownProps {
  endAt: string | Date;
  serverNow?: string | Date;
  onExpire?: () => void;
  compact?: boolean;
  className?: string;
  showIcon?: boolean;
}

export function PromoCountdown({
  endAt,
  serverNow,
  onExpire,
  compact = false,
  className = "",
  showIcon = true,
}: PromoCountdownProps) {
  // Anti-cheat: calculate server time offset relative to client's performance clock
  const offsetRef = React.useRef<number>(0);
  const onExpireCalledRef = React.useRef<boolean>(false);

  // Initialize offset once per serverNow update
  React.useEffect(() => {
    if (serverNow) {
      const serverMs = new Date(serverNow).getTime();
      const clientMs = Date.now();
      offsetRef.current = serverMs - clientMs;
    } else {
      offsetRef.current = 0;
    }
    onExpireCalledRef.current = false;
  }, [serverNow]);

  const calculateRemainingSeconds = React.useCallback(() => {
    const endMs = new Date(endAt).getTime();
    const currentServerMs = Date.now() + offsetRef.current;
    const remainingMs = endMs - currentServerMs;
    return Math.max(0, Math.floor(remainingMs / 1000));
  }, [endAt]);

  const [secondsRemaining, setSecondsRemaining] = React.useState<number>(
    calculateRemainingSeconds
  );

  React.useEffect(() => {
    // Initial compute
    const initial = calculateRemainingSeconds();
    setSecondsRemaining(initial);

    if (initial <= 0) {
      if (!onExpireCalledRef.current) {
        onExpireCalledRef.current = true;
        onExpire?.();
      }
      return;
    }

    const interval = setInterval(() => {
      const remaining = calculateRemainingSeconds();
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (!onExpireCalledRef.current) {
          onExpireCalledRef.current = true;
          onExpire?.();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateRemainingSeconds, onExpire]);

  if (secondsRemaining <= 0) {
    return null;
  }

  const isEndsSoon = secondsRemaining <= 3600; // Less than 1 hour

  const days = Math.floor(secondsRemaining / 86400);
  const hours = Math.floor((secondsRemaining % 86400) / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  let formattedTime = "";
  if (days > 0) {
    formattedTime = `${pad(days)}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  } else {
    formattedTime = `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-mono font-bold text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md border tracking-tight transition-colors ${
          isEndsSoon
            ? "bg-rose-50 border-rose-200 text-rose-700 animate-pulse"
            : "bg-amber-50 border-amber-200/80 text-amber-900"
        } ${className}`}
        title={isEndsSoon ? "Ends in less than 1 hour!" : "Limited time promo"}
      >
        {showIcon &&
          (isEndsSoon ? (
            <Flame className="w-3 h-3 text-rose-600 shrink-0 fill-rose-500 animate-bounce" />
          ) : (
            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
          ))}
        <span>{formattedTime}</span>
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold shadow-xs transition-all ${
        isEndsSoon
          ? "bg-rose-50/90 border-rose-300 text-rose-700 animate-pulse ring-1 ring-rose-200"
          : "bg-amber-50 border-amber-300 text-amber-950"
      } ${className}`}
    >
      {showIcon &&
        (isEndsSoon ? (
          <Flame className="w-3.5 h-3.5 text-rose-600 shrink-0 fill-rose-500" />
        ) : (
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        ))}
      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
        {isEndsSoon ? "Ends soon:" : "Ends in:"}
      </span>
      <span className="font-mono font-black text-xs tracking-tight">
        {formattedTime}
      </span>
    </div>
  );
}

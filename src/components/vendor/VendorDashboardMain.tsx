"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

export function VendorDashboardMain({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMessagesPage = pathname?.startsWith("/dashboard/messages");

  if (isMessagesPage) {
    return (
      <main className="flex-1 min-w-0 w-full h-[calc(100dvh-57px)] md:h-screen overflow-hidden flex flex-col p-2 sm:p-3 md:p-4 bg-neutral-100/60">
        {children}
      </main>
    );
  }

  return (
    <main className="flex-1 min-w-0 p-6 md:p-10 overflow-y-auto max-w-6xl">
      {children}
    </main>
  );
}

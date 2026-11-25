"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

export function AnnouncementBarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) {
    return null;
  }
  return <>{children}</>;
}

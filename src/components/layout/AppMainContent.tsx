"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

interface AppMainContentProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export function AppMainContent({
  children,
  isAdmin: initialIsAdmin = false,
}: AppMainContentProps) {
  const pathname = usePathname();
  const isAdmin = pathname ? pathname.startsWith("/admin") : initialIsAdmin;

  React.useEffect(() => {
    if (isAdmin) {
      document.body.classList.add("bg-neutral-950", "text-neutral-100");
      document.body.classList.remove("bg-white", "text-neutral-900");
      document.documentElement.classList.add("dark");
      document.documentElement.style.backgroundColor = "#0a0a0a";
      document.body.style.backgroundColor = "#0a0a0a";
    } else {
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("bg-neutral-950", "text-neutral-100");
      document.body.classList.add("bg-white", "text-neutral-900");
    }
  }, [isAdmin]);

  return (
    <main
      className={`flex-grow ${
        isAdmin ? "pb-0 bg-neutral-950" : "pb-16 md:pb-0"
      }`}
    >
      {children}
    </main>
  );
}

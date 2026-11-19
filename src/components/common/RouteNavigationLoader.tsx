"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader } from "@/components/ui/Loader";

function NavigationLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = React.useState(false);

  // When pathname or searchParams change, navigation to Page B has completed!
  React.useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Find the closest anchor tag
      const anchor = (e.target as HTMLElement)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignore external links, mailto, tel, target="_blank", downloads
      if (
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        (href.startsWith("http") && !href.startsWith(window.location.origin))
      ) {
        return;
      }

      // Ignore modified clicks (Ctrl, Cmd, Shift, Alt click to open in new tab)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      // Ignore hash-only anchors
      if (href.startsWith("#")) {
        return;
      }

      try {
        const targetUrl = new URL(anchor.href, window.location.href);
        const currentUrl = new URL(window.location.href);

        // Same page with exact same query string? Don't trigger loader
        if (
          targetUrl.pathname === currentUrl.pathname &&
          targetUrl.search === currentUrl.search
        ) {
          return;
        }

        // Active navigation from Page A to Page B: show modal loader!
        setIsNavigating(true);
      } catch {
        // Ignore URL parsing errors
      }
    };

    const handlePopState = () => {
      setIsNavigating(true);
    };

    const handleCustomNavigation = () => {
      setIsNavigating(true);
    };

    document.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("ct:start-navigation", handleCustomNavigation);

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("ct:start-navigation", handleCustomNavigation);
    };
  }, []);

  // Safety fallback: if navigation takes more than 7 seconds, auto-dismiss
  React.useEffect(() => {
    if (!isNavigating) return;

    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 7000);

    return () => clearTimeout(timer);
  }, [isNavigating]);

  if (!isNavigating) return null;

  return <Loader isModal={true} />;
}

export function RouteNavigationLoader() {
  return (
    <React.Suspense fallback={null}>
      <NavigationLoaderInner />
    </React.Suspense>
  );
}

export default RouteNavigationLoader;

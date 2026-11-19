"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  Layers,
  MapPin,
  ShoppingBag,
  Sliders,
  FileText,
  Activity,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Star,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VendorLogoutButton } from "@/components/vendor/VendorLogoutButton";

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Vendors & Approval", href: "/admin/vendors", icon: Users },
  { label: "Product Moderation", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: Layers },
  { label: "Campuses", href: "/admin/campuses", icon: MapPin },
  { label: "Orders Overview", href: "/admin/orders", icon: ShoppingBag },
  { label: "Review Moderation", href: "/admin/reviews", icon: Star },
  { label: "Users & Roles", href: "/admin/users", icon: ShieldCheck },
  { label: "CMS Homepage", href: "/admin/cms/homepage", icon: FileText },
  { label: "Static Pages", href: "/admin/cms/pages", icon: FileText },
  { label: "Platform Settings", href: "/admin/settings", icon: Sliders },
  { label: "Activity Logs", href: "/admin/activity", icon: Activity },
];

export interface AdminSidebarProps {
  session: {
    fullName: string;
    email?: string;
    role?: string;
  };
}

export function AdminSidebar({ session }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = React.useState<boolean>(false);

  // Restore saved collapse state from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("admin_sidebar_collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  // Keyboard shortcut Ctrl+B or Cmd+B
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed((prev) => {
          const next = !prev;
          try {
            localStorage.setItem("admin_sidebar_collapsed", String(next));
          } catch {}
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("admin_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between bg-neutral-900 border-b border-neutral-800 px-4 py-3 sticky top-0 z-30 shadow-md">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
            CT
          </div>
          <div>
            <h2 className="font-extrabold text-sm tracking-tight text-white leading-none">
              Admin <span className="text-emerald-400">CMS</span>
            </h2>
            <span className="text-[9px] text-neutral-400 font-semibold uppercase tracking-wider">
              CampusTrade HQ
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
          aria-label="Open admin navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-neutral-900 text-neutral-100 h-full shadow-2xl flex flex-col justify-between p-5 overflow-y-auto z-10 animate-in slide-in-from-left duration-200 border-r border-neutral-800">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                    CT
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm tracking-tight text-white leading-none">
                      Admin <span className="text-emerald-400">CMS</span>
                    </h2>
                    <span className="text-[9px] text-neutral-400 font-semibold uppercase tracking-wider">
                      CampusTrade HQ
                    </span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Nav Links */}
              <nav className="space-y-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        isActive
                          ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-900/50"
                          : "text-neutral-300 hover:text-white hover:bg-neutral-800/80"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? "text-white" : "text-emerald-400"
                        }`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Mobile Footer */}
            <div className="pt-4 border-t border-neutral-800 space-y-3 mt-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0">
                  {session.fullName?.[0]?.toUpperCase() || "A"}
                </div>
                <div className="truncate flex-1">
                  <p className="text-xs font-bold text-white truncate">
                    {session.fullName}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-semibold">
                    Super Administrator
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Live Site</span>
                </Link>
                <VendorLogoutButton
                  variant="admin"
                  showIcon
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-medium border border-rose-900/50 transition-colors cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Collapsible Left Sidebar */}
      <aside
        className={`hidden md:flex flex-col justify-between shrink-0 bg-neutral-900 border-r border-neutral-800 transition-all duration-300 ease-in-out select-none ${
          collapsed ? "w-20 p-3" : "w-64 p-4"
        }`}
      >
        <div className="space-y-5">
          {/* Header */}
          {collapsed ? (
            <div className="flex flex-col items-center gap-2.5 pb-4 border-b border-neutral-800">
              {/* Logo with Popover */}
              <div className="relative group flex justify-center">
                <Link
                  href="/admin"
                  className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md hover:bg-emerald-500 transition-colors"
                >
                  CT
                </Link>

                {/* Tooltip */}
                <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex items-center">
                  <div className="bg-neutral-800 border border-neutral-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                    Admin CMS (PROD)
                  </div>
                </div>
              </div>

              {/* Expand Toggle */}
              <button
                type="button"
                onClick={toggleCollapsed}
                title="Expand sidebar (Ctrl+B)"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 transition-all cursor-pointer group relative"
              >
                <PanelLeftOpen className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span className="sr-only">Expand sidebar</span>

                {/* Tooltip */}
                <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex items-center">
                  <div className="bg-neutral-800 border border-neutral-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                    Expand sidebar (Ctrl+B)
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <Link href="/admin" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-extrabold shadow-md">
                  CT
                </div>
                <div>
                  <h2 className="font-extrabold text-base tracking-tight text-white leading-none">
                    Admin <span className="text-emerald-400">CMS</span>
                  </h2>
                  <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                    CampusTrade HQ
                  </span>
                </div>
              </Link>

              <div className="flex items-center gap-1.5">
                <Badge
                  variant="dark"
                  className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800"
                >
                  PROD
                </Badge>
                {/* Collapse Toggle */}
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  title="Collapse sidebar (Ctrl+B)"
                  className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  <PanelLeftClose className="w-4 h-4" />
                  <span className="sr-only">Collapse sidebar</span>
                </button>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-none">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              if (collapsed) {
                return (
                  <div
                    key={item.label}
                    className="relative group flex justify-center"
                  >
                    <Link
                      href={item.href}
                      aria-label={item.label}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        isActive
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/50"
                          : "text-neutral-400 hover:text-white hover:bg-neutral-800/80"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? "text-white" : "text-emerald-400"
                        }`}
                      />
                    </Link>

                    {/* Tooltip */}
                    <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden md:group-hover:flex items-center">
                      <div className="bg-neutral-800 border border-neutral-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                        {item.label}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-900/50"
                      : "text-neutral-300 hover:text-white hover:bg-neutral-800/80"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? "text-white" : "text-emerald-400"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / User Profile & Exit */}
        <div
          className={`pt-4 border-t border-neutral-800 space-y-3 ${
            collapsed ? "flex flex-col items-center" : ""
          }`}
        >
          {collapsed ? (
            <div className="flex flex-col items-center gap-2.5 w-full">
              {/* User Avatar with Tooltip */}
              <div className="relative group flex justify-center">
                <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-xs font-bold cursor-default">
                  {session.fullName?.[0]?.toUpperCase() || "A"}
                </div>
                <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex items-center">
                  <div className="bg-neutral-800 border border-neutral-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                    {session.fullName} (Super Administrator)
                  </div>
                </div>
              </div>

              {/* Live Site */}
              <div className="relative group flex justify-center w-full">
                <Link
                  href="/"
                  target="_blank"
                  title="Live Site"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="sr-only">Live Site</span>
                </Link>
                <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex items-center">
                  <div className="bg-neutral-800 border border-neutral-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                    Live Site
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <div className="relative group flex justify-center w-full">
                <VendorLogoutButton
                  variant="admin"
                  title="Logout"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </VendorLogoutButton>
                <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex items-center">
                  <div className="bg-rose-950 border border-rose-800 text-rose-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                    Logout
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0">
                  {session.fullName?.[0]?.toUpperCase() || "A"}
                </div>
                <div className="truncate flex-1">
                  <p className="text-xs font-bold text-white truncate">
                    {session.fullName}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-semibold">
                    Super Administrator
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Live Site</span>
                </Link>
                <VendorLogoutButton
                  variant="admin"
                  showIcon
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-medium border border-rose-900/50 transition-colors cursor-pointer"
                />
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;

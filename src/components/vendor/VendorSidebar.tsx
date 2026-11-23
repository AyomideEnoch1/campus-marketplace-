"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ExternalLink,
  MapPin,
  AlertCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VendorLogoutButton } from "@/components/vendor/VendorLogoutButton";
import { VendorSidebarNav } from "@/components/vendor/VendorSidebarNav";
import { SignInAsBuyerButton } from "@/components/vendor/SignInAsBuyerButton";

export interface VendorSidebarProps {
  vendor: {
    id: string;
    storeName: string;
    slug: string;
    status: string;
    logo?: string | null;
    brandColor?: string | null;
    campus?: {
      name: string;
    } | null;
  };
  session: {
    fullName: string;
    email: string;
  };
}

export function VendorSidebar({ vendor, session }: VendorSidebarProps) {
  const [collapsed, setCollapsed] = React.useState<boolean>(false);
  const [isMounted, setIsMounted] = React.useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = React.useState<boolean>(false);

  // Read saved collapsed preference from localStorage after mounting
  React.useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem("vendor_sidebar_collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, []);

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar collapse
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed((prev) => {
          const next = !prev;
          try {
            localStorage.setItem("vendor_sidebar_collapsed", String(next));
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
        localStorage.setItem("vendor_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const campusShortName = vendor.campus?.name?.split(" ")[0] || "Campus";

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-neutral-200 px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
            {vendor.logo ? (
              <img
                src={vendor.logo}
                alt={vendor.storeName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center font-bold text-base text-white"
                style={{ backgroundColor: vendor.brandColor || "#059669" }}
              >
                {vendor.storeName[0]}
              </div>
            )}
          </div>
          <div>
            <h2 className="font-bold text-sm text-neutral-950 truncate max-w-[160px] leading-tight">
              {vendor.storeName}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge
                variant={
                  vendor.status === "APPROVED"
                    ? "default"
                    : vendor.status === "PENDING"
                    ? "warning"
                    : "destructive"
                }
                className="text-[9px] px-1 py-0 shrink-0"
              >
                {vendor.status}
              </Badge>
              <span className="text-[10px] text-neutral-500 flex items-center">
                <MapPin className="w-2.5 h-2.5 text-emerald-600 mr-0.5" />
                {campusShortName}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-white h-full h-[100dvh] max-h-[100dvh] shadow-2xl flex flex-col justify-between p-5 overflow-y-auto overscroll-contain [scrollbar-width:thin] z-10 animate-in slide-in-from-left duration-200">
            <div className="space-y-5 shrink-0">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
                    {vendor.logo ? (
                      <img
                        src={vendor.logo}
                        alt={vendor.storeName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center font-bold text-sm text-white"
                        style={{
                          backgroundColor: vendor.brandColor || "#059669",
                        }}
                      >
                        {vendor.storeName[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-neutral-950 truncate max-w-[140px]">
                      {vendor.storeName}
                    </h3>
                    <span className="text-[11px] text-neutral-500 flex items-center">
                      <MapPin className="w-3 h-3 text-emerald-600 mr-0.5" />
                      {campusShortName}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Pending Approval Notice */}
              {vendor.status === "PENDING" && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Store Awaiting Approval
                  </p>
                  <p className="text-amber-700 leading-snug">
                    You can add and edit products now. Once verified by campus
                    admins, your items will go live!
                  </p>
                </div>
              )}

              {/* Mobile Nav Links */}
              <VendorSidebarNav onItemClick={() => setMobileOpen(false)} />
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-neutral-100 space-y-2 mt-6 shrink-0">
              <Link
                href={`/store/${vendor.slug}`}
                target="_blank"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-100 text-emerald-900 text-xs font-bold transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-700" />
                  View Public Store
                </span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <SignInAsBuyerButton />

              <div className="flex items-center justify-between pt-1 px-1 text-xs text-neutral-500">
                <span className="truncate max-w-[120px] font-medium">
                  {session.fullName}
                </span>
                <VendorLogoutButton />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Collapsible Left Sidebar */}
      <aside
        className={`hidden md:flex flex-col justify-between shrink-0 bg-white border-r border-neutral-200/80 transition-all duration-300 ease-in-out shadow-xs select-none sticky top-0 h-screen max-h-screen overflow-y-auto overscroll-contain [scrollbar-width:thin] ${
          collapsed ? "w-20 p-3" : "w-64 p-5"
        }`}
      >
        <div className="space-y-6 shrink-0">
          {/* Store Brand Header */}
          {collapsed ? (
            <div className="flex flex-col items-center gap-2.5 pb-4 border-b border-neutral-100">
              {/* Store Avatar with hover popover */}
              <div className="relative group flex justify-center">
                <div className="w-10 h-10 rounded-2xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 cursor-pointer shadow-xs">
                  {vendor.logo ? (
                    <img
                      src={vendor.logo}
                      alt={vendor.storeName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center font-bold text-base text-white"
                      style={{
                        backgroundColor: vendor.brandColor || "#059669",
                      }}
                    >
                      {vendor.storeName[0]}
                    </div>
                  )}
                </div>

                {/* Status Dot */}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                    vendor.status === "APPROVED"
                      ? "bg-emerald-500"
                      : vendor.status === "PENDING"
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                />

                {/* Hover Details Tooltip */}
                <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex items-center">
                  <div className="bg-neutral-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl whitespace-nowrap space-y-1">
                    <p className="font-bold text-sm text-neutral-100">
                      {vendor.storeName}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-300">
                      <span className="uppercase text-[10px] font-semibold text-emerald-400">
                        {vendor.status}
                      </span>
                      <span>•</span>
                      <span>{campusShortName}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expand Toggle Button */}
              <button
                type="button"
                onClick={toggleCollapsed}
                title="Expand sidebar (Ctrl+B)"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-neutral-500 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200/60 transition-all cursor-pointer group relative"
              >
                <PanelLeftOpen className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span className="sr-only">Expand sidebar</span>

                {/* Tooltip */}
                <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex items-center">
                  <div className="bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                    Expand sidebar (Ctrl+B)
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-11 h-11 rounded-2xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
                  {vendor.logo ? (
                    <img
                      src={vendor.logo}
                      alt={vendor.storeName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center font-bold text-lg text-white"
                      style={{
                        backgroundColor: vendor.brandColor || "#059669",
                      }}
                    >
                      {vendor.storeName[0]}
                    </div>
                  )}
                </div>
                <div className="truncate">
                  <h2 className="font-bold text-sm text-neutral-950 truncate leading-snug">
                    {vendor.storeName}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge
                      variant={
                        vendor.status === "APPROVED"
                          ? "default"
                          : vendor.status === "PENDING"
                          ? "warning"
                          : "destructive"
                      }
                      className="text-[10px] px-1.5 py-0 shrink-0 whitespace-nowrap"
                    >
                      {vendor.status}
                    </Badge>
                    <span className="text-[11px] text-neutral-400 flex items-center">
                      <MapPin className="w-3 h-3 text-emerald-600 mr-0.5" />
                      {campusShortName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Collapse Toggle Button */}
              <button
                type="button"
                onClick={toggleCollapsed}
                title="Collapse sidebar (Ctrl+B)"
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 border border-transparent hover:border-neutral-200 transition-all cursor-pointer shrink-0"
              >
                <PanelLeftClose className="w-4 h-4" />
                <span className="sr-only">Collapse sidebar</span>
              </button>
            </div>
          )}

          {/* Pending Approval Notice */}
          {vendor.status === "PENDING" &&
            (collapsed ? (
              <div className="relative group flex justify-center">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center cursor-pointer">
                  <AlertCircle className="w-4 h-4 text-amber-600 animate-pulse" />
                </div>
                <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex items-center">
                  <div className="bg-amber-950 text-amber-100 text-xs rounded-xl p-3 shadow-xl max-w-xs space-y-1 border border-amber-800">
                    <p className="font-bold text-amber-300 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Store Awaiting Approval
                    </p>
                    <p className="text-[11px] leading-snug text-amber-200">
                      You can add and edit products now. Once verified by campus
                      admins, your items will go live!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Store Awaiting Approval
                </p>
                <p className="text-amber-700 leading-snug">
                  You can add and edit products now. Once verified by campus
                  admins, your items will go live!
                </p>
              </div>
            ))}

          {/* Navigation Links */}
          <VendorSidebarNav collapsed={collapsed} />
        </div>

        {/* Bottom Store Link & User */}
        <div
          className={`shrink-0 pt-4 border-t border-neutral-100 space-y-2 mt-6 ${
            collapsed ? "flex flex-col items-center" : ""
          }`}
        >
          {/* View Public Store */}
          {collapsed ? (
            <div className="relative group flex justify-center w-full">
              <Link
                href={`/store/${vendor.slug}`}
                target="_blank"
                title="View Public Store"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-100 text-emerald-800 transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-700" />
                <span className="sr-only">View Public Store</span>
              </Link>
              <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex items-center">
                <div className="bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap flex items-center gap-1.5">
                  <span>View Public Store</span>
                  <ExternalLink className="w-3 h-3 text-neutral-400" />
                </div>
              </div>
            </div>
          ) : (
            <Link
              href={`/store/${vendor.slug}`}
              target="_blank"
              className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-100 text-emerald-900 text-xs font-bold transition-colors"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-700" />
                View Public Store
              </span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}

          {/* Switch to Buyer Mode */}
          <div className={collapsed ? "relative group flex justify-center w-full" : "w-full"}>
            <SignInAsBuyerButton collapsed={collapsed} />
            {collapsed && (
              <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex items-center">
                <div className="bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                  Switch to Buyer Mode
                </div>
              </div>
            )}
          </div>

          {/* User profile & Logout */}
          {collapsed ? (
            <div className="flex flex-col items-center gap-2 pt-2 border-t border-neutral-100 w-full">
              {/* User Avatar with Tooltip */}
              <div className="relative group flex justify-center">
                <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center border border-neutral-800 cursor-default">
                  {session.fullName?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex items-center">
                  <div className="bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                    {session.fullName}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <div className="relative group flex justify-center">
                <VendorLogoutButton
                  title="Logout"
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </VendorLogoutButton>
                <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex items-center">
                  <div className="bg-rose-950 text-rose-100 text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                    Logout
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-1 px-1 text-xs text-neutral-500">
              <span className="truncate max-w-[120px] font-medium">
                {session.fullName}
              </span>
              <VendorLogoutButton />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default VendorSidebar;

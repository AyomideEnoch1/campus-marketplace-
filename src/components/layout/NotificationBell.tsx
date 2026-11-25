"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  MessageSquare,
  ShoppingBag,
  Package,
  ShieldCheck,
  Check,
  ExternalLink,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string | Date;
}

interface NotificationBellProps {
  currentUserId: string;
}

export function NotificationBell({ currentUserId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const queryKey = ["notifications", currentUserId] as const;

  const { data: notifData } = useQuery<{
    notifications: NotificationItem[];
    unreadCount: number;
  }>({
    queryKey,
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/notifications", { signal });
      if (!res.ok) throw new Error("Failed to load notifications");
      const data = await res.json();
      return {
        notifications: data.notifications || [],
        unreadCount: data.unreadCount || 0,
      };
    },
    enabled: !!currentUserId,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unreadCount || 0;

  // Subscribe to real-time notification inserts
  useEffect(() => {
    if (!supabase || !currentUserId) return;

    const channel = supabase
      .channel(`notifications:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Notification",
          filter: `userId=eq.${currentUserId}`,
        },
        (payload: any) => {
          const newNotif = payload.new as NotificationItem;

          toast(newNotif.title, {
            description: newNotif.message,
            action: newNotif.link
              ? {
                  label: "View",
                  onClick: () => router.push(newNotif.link!),
                }
              : undefined,
          });

          queryClient.setQueryData<{
            notifications: NotificationItem[];
            unreadCount: number;
          }>(queryKey, (old) => ({
            notifications: [newNotif, ...(old?.notifications || [])],
            unreadCount: (old?.unreadCount || 0) + 1,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, router, queryClient]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      queryClient.setQueryData<{
        notifications: NotificationItem[];
        unreadCount: number;
      }>(queryKey, (old) => ({
        notifications: (old?.notifications || []).map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (e) {
      console.error("Failed to mark all as read:", e);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        fetch(`/api/notifications/${notif.id}`, { method: "PATCH" });
        queryClient.setQueryData<{
          notifications: NotificationItem[];
          unreadCount: number;
        }>(queryKey, (old) => ({
          notifications: (old?.notifications || []).map((n) =>
            n.id === notif.id ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, (old?.unreadCount || 0) - 1),
        }));
      } catch (e) {}
    }

    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const formatRelativeTime = (dateVal: string | Date) => {
    const diff = Math.floor((Date.now() - new Date(dateVal).getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "CHAT_MESSAGE":
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case "ORDER_CREATED":
        return <ShoppingBag className="w-4 h-4 text-blue-600" />;
      case "ORDER_STATUS":
        return <Package className="w-4 h-4 text-purple-600" />;
      case "ESCROW_RELEASED":
        return <ShieldCheck className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-neutral-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-in zoom-in-75">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop on mobile screens to catch outside touches */}
          <div
            className="fixed inset-0 bg-neutral-950/20 backdrop-blur-[1px] z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed sm:absolute top-16 sm:top-full left-3 right-3 sm:left-auto sm:right-0 mt-2 sm:mt-2 sm:w-96 max-w-sm sm:max-w-none mx-auto sm:mx-0 bg-white rounded-3xl shadow-2xl border border-neutral-200/90 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-neutral-900">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="sm:hidden p-1 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 min-h-0">
              {notifications.length === 0 ? (
                <div className="py-12 px-4 text-center text-neutral-400 text-xs">
                  <Bell className="w-8 h-8 mx-auto text-neutral-300 mb-2 opacity-50" />
                  <p className="font-semibold text-neutral-600">No notifications yet</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Updates on orders and in-app messages will appear here in real time.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-neutral-50 transition-colors cursor-pointer text-left ${
                      !notif.isRead ? "bg-emerald-50/30" : ""
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5">
                      {getIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs truncate ${
                            !notif.isRead
                              ? "font-bold text-neutral-900"
                              : "font-semibold text-neutral-700"
                          }`}
                        >
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-neutral-400 shrink-0 font-mono">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-500 line-clamp-2 mt-0.5 leading-snug">
                        {notif.message}
                      </p>
                    </div>

                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-2" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-neutral-50 border-t border-neutral-100 text-center shrink-0">
              <Link
                href="/messages"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-neutral-700 hover:text-emerald-600 transition-colors inline-flex items-center gap-1"
              >
                Open In-App Messages &rarr;
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

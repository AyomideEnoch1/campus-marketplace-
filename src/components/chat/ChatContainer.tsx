"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Search,
  Clock,
  Package,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  X,
  Filter,
  CheckCheck,
} from "lucide-react";
import { ChatRoom, ChatMessageItem, ConversationDetails } from "./ChatRoom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface ConversationListItem {
  id: string;
  buyerId: string;
  vendorId: string;
  productId?: string | null;
  lastMessage?: string | null;
  lastMessageAt: string | Date;
  buyer: {
    id: string;
    fullName: string;
    email: string;
  };
  vendor: {
    id: string;
    storeName: string;
    slug: string;
    logo?: string | null;
    whatsapp?: string | null;
    userId: string;
    campus?: {
      name: string;
    } | null;
  };
  product?: {
    id: string;
    title: string;
    price: number;
    slug: string;
    images?: Array<{ url: string }>;
  } | null;
  _count?: {
    messages: number;
  };
}

interface ChatContainerProps {
  initialConversations: ConversationListItem[];
  currentUserId: string;
  isVendorPortal?: boolean;
  initialMessages?: ChatMessageItem[];
  initialActiveConversationId?: string | null;
}

export function ChatContainer({
  initialConversations,
  currentUserId,
  isVendorPortal = false,
  initialMessages = [],
  initialActiveConversationId,
}: ChatContainerProps) {
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    initialConversations
  );

  const initialTargetId =
    initialActiveConversationId ||
    (initialConversations.length > 0 ? initialConversations[0].id : null);

  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialTargetId
  );

  const initialActiveConv =
    initialConversations.find((c) => c.id === initialTargetId) ||
    initialConversations[0] ||
    null;

  const [activeConversation, setActiveConversation] =
    useState<ConversationDetails | null>(
      initialActiveConv ? (initialActiveConv as unknown as ConversationDetails) : null
    );

  const [messages, setMessages] = useState<ChatMessageItem[]>(initialMessages);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD" | "PRODUCTS">("ALL");
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Load messages whenever activeConversationId changes
  useEffect(() => {
    if (!activeConversationId) return;

    // If messages already belong to this conversation, avoid redundant refetch
    if (
      messages.length > 0 &&
      messages[0].conversationId === activeConversationId
    ) {
      return;
    }

    const controller = new AbortController();
    let isMounted = true;
    setLoadingMessages(true);

    fetch(`/api/conversations/${activeConversationId}/messages`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.messages) {
          setMessages(data.messages);
        }
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("Failed to load messages for conversation:", err);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingMessages(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [activeConversationId]);

  // Handle selecting a conversation (useEffect loads messages once)
  const handleSelectConversation = (conv: ConversationListItem) => {
    if (conv.id !== activeConversationId) {
      setMessages([]);
    }
    setActiveConversationId(conv.id);
    setActiveConversation(conv as unknown as ConversationDetails);
    setShowMobileChat(true);

    // Reset unread counter locally
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conv.id ? { ...c, _count: { messages: 0 } } : c
      )
    );
  };

  // Callback when a new message is successfully sent
  const handleMessageSent = useCallback((newMessage: ChatMessageItem) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMessage.id)) return prev;
      return [...prev, newMessage];
    });

    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (c.id === newMessage.conversationId) {
          return {
            ...c,
            lastMessage: newMessage.content,
            lastMessageAt: newMessage.createdAt,
          };
        }
        return c;
      });

      // Move the active conversation with the newest message to the top
      return updated.sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime()
      );
    });
  }, []);

  // Format friendly relative time
  const formatRelativeTime = (dateStr: string | Date) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

      if (diffSec < 60) return "Just now";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h`;
      const diffDay = Math.floor(diffHr / 24);
      if (diffDay === 1) return "Yesterday";
      if (diffDay < 7) return `${diffDay}d`;
      return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const isMeBuyer = currentUserId === c.buyerId;
      const otherName =
        (isMeBuyer ? c.vendor?.storeName : c.buyer?.fullName) || "User";
      const q = searchTerm.toLowerCase();

      const matchesSearch =
        otherName.toLowerCase().includes(q) ||
        (c.product?.title && c.product.title.toLowerCase().includes(q)) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (activeTab === "UNREAD") {
        return (c._count?.messages || 0) > 0;
      }
      if (activeTab === "PRODUCTS") {
        return !!c.product;
      }
      return true;
    });
  }, [conversations, currentUserId, searchTerm, activeTab]);

  const totalUnreadCount = conversations.reduce(
    (sum, c) => sum + (c._count?.messages || 0),
    0
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 h-full min-h-0 flex-1 overflow-hidden">
      {/* Sidebar: Conversation List */}
      <div
        className={`md:col-span-5 lg:col-span-4 bg-white border border-neutral-200/90 rounded-3xl p-3 sm:p-4 flex flex-col h-full min-h-0 overflow-hidden shadow-sm ${
          showMobileChat ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Header */}
        <div className="pb-3 border-b border-neutral-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base text-neutral-900 tracking-tight">
                Inbox
              </h2>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
            {conversations.length} {conversations.length === 1 ? "chat" : "chats"}
          </span>
        </div>

        {/* Search Bar */}
        <div className="pt-3 pb-2 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-emerald-500 text-neutral-900 placeholder:text-neutral-400 text-xs h-9 rounded-xl outline-none transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 pb-2.5 overflow-x-auto shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === "ALL"
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("UNREAD")}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === "UNREAD"
                ? "bg-emerald-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80"
            }`}
          >
            <span>Unread</span>
            {totalUnreadCount > 0 && (
              <span
                className={`text-[10px] px-1.5 rounded-full font-mono ${
                  activeTab === "UNREAD" ? "bg-emerald-700 text-white" : "bg-emerald-600 text-white"
                }`}
              >
                {totalUnreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PRODUCTS")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === "PRODUCTS"
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80"
            }`}
          >
            Inquiries
          </button>
        </div>

        {/* Conversation List Items */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filteredConversations.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-xs space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                <MessageSquare className="w-5 h-5 opacity-60" />
              </div>
              <p className="font-bold text-neutral-700">No conversations found</p>
              <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
                {isVendorPortal
                  ? "When campus buyers inquiry about your storefront items, their messages appear here."
                  : "Click 'Chat with Seller' on any product listing to start a conversation."}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isMeBuyer = currentUserId === conv.buyerId;
              const title =
                (isMeBuyer ? conv.vendor?.storeName : conv.buyer?.fullName) ||
                "User";
              const isActive = activeConversationId === conv.id;
              const unread = conv._count?.messages || 0;
              const relativeTime = formatRelativeTime(conv.lastMessageAt);

              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 cursor-pointer relative group ${
                    isActive
                      ? "bg-emerald-50/90 border border-emerald-300 ring-1 ring-emerald-400/20 shadow-xs"
                      : "bg-white hover:bg-neutral-50/90 border border-neutral-100 text-neutral-700"
                  }`}
                >
                  {/* Left indicator bar on active */}
                  {isActive && (
                    <span className="absolute left-1 top-3 bottom-3 w-1 rounded-full bg-emerald-600" />
                  )}

                  {/* Avatar */}
                  <div className="relative shrink-0 pl-1">
                    {conv.vendor?.logo && !isMeBuyer ? (
                      <img
                        src={conv.vendor.logo}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover border border-neutral-200"
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-xl font-black flex items-center justify-center text-xs border ${
                          isActive
                            ? "bg-emerald-600 text-white border-emerald-500 shadow-2xs"
                            : "bg-gradient-to-tr from-neutral-100 to-neutral-200 text-emerald-800 border-neutral-200"
                        }`}
                      >
                        {title?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`font-bold text-xs truncate ${
                          unread > 0 ? "text-neutral-950 font-black" : "text-neutral-800"
                        }`}
                      >
                        {title}
                      </p>
                      <span className="text-[10px] text-neutral-400 shrink-0 font-medium">
                        {relativeTime}
                      </span>
                    </div>

                    {conv.product && (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold truncate mt-0.5">
                        <Package className="w-3 h-3 shrink-0" />
                        <span className="truncate">{conv.product.title}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p
                        className={`text-[11px] truncate ${
                          unread > 0
                            ? "text-neutral-900 font-bold"
                            : "text-neutral-500"
                        }`}
                      >
                        {conv.lastMessage || "Tap to chat"}
                      </p>
                      {unread > 0 && (
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Window */}
      <div
        className={`md:col-span-7 lg:col-span-8 h-full min-h-0 flex flex-col overflow-hidden ${
          showMobileChat ? "flex col-span-12" : "hidden md:flex"
        }`}
      >
        {activeConversation ? (
          <ChatRoom
            key={activeConversation.id}
            conversation={activeConversation}
            initialMessages={messages}
            currentUserId={currentUserId}
            onBack={() => setShowMobileChat(false)}
            onMessageSent={handleMessageSent}
          />
        ) : (
          <div className="w-full h-full bg-white border border-neutral-200/90 rounded-3xl flex flex-col items-center justify-center p-8 text-center text-neutral-500 shadow-sm relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center mb-4 shadow-sm">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-neutral-900 tracking-tight">
              Select a Conversation
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm leading-relaxed">
              Connect directly with verified campus vendors and student shoppers. Negotiate prices, arrange safe daylight meetups, and pay securely with Escrow.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Protected by ọjà Escrow</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

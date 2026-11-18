"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Search,
  Clock,
  Package,
  ShieldCheck,
  ChevronRight,
  Store,
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
}

export function ChatContainer({
  initialConversations,
  currentUserId,
  isVendorPortal = false,
}: ChatContainerProps) {
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    initialConversations
  );
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversations[0]?.id || null
  );
  const [activeConversation, setActiveConversation] =
    useState<ConversationDetails | null>(
      initialConversations[0]
        ? (initialConversations[0] as unknown as ConversationDetails)
        : null
    );
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Load messages when selecting a conversation
  const handleSelectConversation = async (conv: ConversationListItem) => {
    setActiveConversationId(conv.id);
    setActiveConversation(conv as unknown as ConversationDetails);
    setShowMobileChat(true);
    setLoadingMessages(true);

    try {
      const res = await fetch(`/api/conversations/${conv.id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        // Reset unread counter locally
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conv.id ? { ...c, _count: { messages: 0 } } : c
          )
        );
      }
    } catch (e) {
      console.error("Failed to load messages", e);
    } finally {
      setLoadingMessages(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const isMeBuyer = currentUserId === c.buyerId;
    const otherName =
      (isMeBuyer ? c.vendor?.storeName : c.buyer?.fullName) || "User";
    const q = searchTerm.toLowerCase();
    return (
      otherName.toLowerCase().includes(q) ||
      (c.product?.title && c.product.title.toLowerCase().includes(q)) ||
      (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
    );
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 h-full min-h-0 flex-1 overflow-hidden">
      {/* Sidebar: Conversation List */}
      <div
        className={`md:col-span-4 lg:col-span-4 bg-white border border-neutral-200/80 rounded-3xl p-3 sm:p-4 flex flex-col h-full min-h-0 overflow-hidden shadow-xs ${
          showMobileChat ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="pb-3 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h2 className="font-extrabold text-base text-neutral-900">Chat</h2>
          </div>
          <span className="text-xs font-mono text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200/60 font-semibold">
            {conversations.length} Active
          </span>
        </div>

        {/* Search */}
        <div className="py-3">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <Input
              placeholder="Search chat or student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 text-xs h-9 rounded-xl focus:bg-white"
            />
          </div>
        </div>

        {/* Conversation List Items */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filteredConversations.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-xs space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-neutral-300 opacity-60" />
              <p className="font-semibold text-neutral-600">No active conversations</p>
              <p className="text-[11px] text-neutral-400">
                {isVendorPortal
                  ? "When buyers message your store about listings, chats appear here."
                  : "Click 'Chat with Seller' on any product to start a conversation."}
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

              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 cursor-pointer ${
                    isActive
                      ? "bg-emerald-50/80 border border-emerald-300/80 text-emerald-950 shadow-xs"
                      : "bg-white hover:bg-neutral-50 border border-neutral-100 text-neutral-700"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center shrink-0 border ${
                      isActive
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-xs"
                        : "bg-neutral-100 text-emerald-700 border-neutral-200"
                    }`}
                  >
                    {title?.[0] || "U"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-xs text-neutral-900 truncate">
                        {title}
                      </p>
                      {unread > 0 && (
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>

                    {conv.product && (
                      <p className="text-[10px] text-emerald-700 font-semibold truncate flex items-center gap-1">
                        <Package className="w-3 h-3 shrink-0" />
                        {conv.product.title}
                      </p>
                    )}

                    <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                      {conv.lastMessage || "Tap to chat"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Window */}
      <div
        className={`md:col-span-8 lg:col-span-8 h-full min-h-0 flex flex-col overflow-hidden ${
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
          />
        ) : (
          <div className="w-full h-full bg-white border border-neutral-200/80 rounded-3xl flex flex-col items-center justify-center p-8 text-center text-neutral-500 shadow-xs">
            <MessageSquare className="w-12 h-12 text-neutral-300 mb-3" />
            <h3 className="text-lg font-bold text-neutral-800">Select a Conversation</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Connect directly with verified campus vendors and buyers to negotiate prices and schedule safe campus meetups.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

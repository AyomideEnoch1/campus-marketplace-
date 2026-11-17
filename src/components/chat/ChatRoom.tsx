"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Send,
  Check,
  CheckCheck,
  Package,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatNGN } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export interface ChatMessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string | Date;
  sender: {
    id: string;
    fullName: string;
    role: string;
  };
}

export interface ConversationDetails {
  id: string;
  buyerId: string;
  vendorId: string;
  productId?: string | null;
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
}

interface ChatRoomProps {
  conversation: ConversationDetails;
  initialMessages: ChatMessageItem[];
  currentUserId: string;
  onBack?: () => void;
}

export function ChatRoom({
  conversation,
  initialMessages,
  currentUserId,
  onBack,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isBuyer = currentUserId === conversation.buyerId;
  const otherPartyName = isBuyer
    ? conversation.vendor.storeName
    : conversation.buyer.fullName;

  // Auto-scroll to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length]);

  // Subscribe to Supabase Realtime for instant updates
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel(`chat:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ChatMessage",
          filter: `conversationId=eq.${conversation.id}`,
        },
        async (payload: any) => {
          const newMsg = payload.new as any;
          // Avoid duplicate if sent by current user and already added optimistically
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [
              ...prev,
              {
                id: newMsg.id,
                conversationId: newMsg.conversationId,
                senderId: newMsg.senderId,
                content: newMsg.content,
                isRead: newMsg.isRead,
                createdAt: newMsg.createdAt,
                sender: {
                  id: newMsg.senderId,
                  fullName:
                    newMsg.senderId === currentUserId
                      ? "You"
                      : otherPartyName,
                  role: newMsg.senderId === currentUserId ? "USER" : "VENDOR",
                },
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id, currentUserId, otherPartyName]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    setInputText("");
    setIsSending(true);

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessageItem = {
      id: tempId,
      conversationId: conversation.id,
      senderId: currentUserId,
      content: text,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: currentUserId,
        fullName: "You",
        role: "USER",
      },
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      if (!res.ok) throw new Error("Failed to send");

      const data = await res.json();
      // Replace optimistic message with actual DB message
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? data.message : m))
      );
    } catch (err) {
      console.error("Failed to deliver message:", err);
      // Remove failed optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const quickChips = isBuyer
    ? [
        "Is this item still available?",
        "Can we meet at the campus gate?",
        "Can you do a slight discount?",
        "What condition is it in?",
      ]
    : [
        "Yes, still available!",
        "I can meet today on campus.",
        "Sure, let's agree on that price.",
        "Please place the order so escrow protects us.",
      ];

  return (
    <div className="flex flex-col h-full bg-neutral-950 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm shrink-0">
            {otherPartyName?.[0] || "U"}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm text-white truncate">
                {otherPartyName}
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            </div>
            <p className="text-[11px] text-neutral-400 flex items-center gap-1 truncate">
              {conversation.vendor.campus ? (
                <>
                  <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                  {conversation.vendor.campus.name}
                </>
              ) : (
                "Verified CampusTrade Chat"
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Escrow Protected
          </span>
          {isBuyer && (
            <Link
              href={`/store/${conversation.vendor.slug}`}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 bg-neutral-800 px-2.5 py-1 rounded-xl font-semibold"
            >
              <span>Store</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Context Product Card (If pinned) */}
      {conversation.product && (
        <div className="bg-neutral-900/60 border-b border-neutral-800/80 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {conversation.product.images?.[0] ? (
              <img
                src={conversation.product.images[0].url}
                alt=""
                className="w-10 h-10 rounded-xl object-cover border border-neutral-800 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-neutral-500" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {conversation.product.title}
              </p>
              <p className="text-xs font-black text-emerald-400">
                {formatNGN(conversation.product.price)}
              </p>
            </div>
          </div>

          <Link
            href={`/product/${conversation.product.slug}`}
            className="text-[11px] text-emerald-400 hover:underline font-bold shrink-0"
          >
            View Listing &rarr;
          </Link>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {/* Safety Banner */}
        <div className="bg-neutral-900/50 border border-neutral-800/60 rounded-2xl p-3 text-center text-xs text-neutral-400 max-w-md mx-auto">
          <p className="font-semibold text-white flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            CampusTrade Safety Tip
          </p>
          <p className="text-[11px] mt-0.5 text-neutral-400">
            Always meet in designated daytime campus spots. Never release your delivery code until items are inspected.
          </p>
        </div>

        {messages.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 text-xs">
            <p>No messages yet. Send a message to start bargaining or arranging meetup!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            const timeStr = new Date(msg.createdAt).toLocaleTimeString("en-NG", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-md rounded-2xl px-4 py-2.5 text-xs ${
                    isMe
                      ? "bg-emerald-600 text-white rounded-br-xs shadow-md shadow-emerald-900/20"
                      : "bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-bl-xs"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                  <div
                    className={`flex items-center justify-end gap-1 text-[9px] mt-1 ${
                      isMe ? "text-emerald-200" : "text-neutral-500"
                    }`}
                  >
                    <span>{timeStr}</span>
                    {isMe && (
                      msg.isRead ? (
                        <CheckCheck className="w-3 h-3 text-emerald-200" />
                      ) : (
                        <Check className="w-3 h-3 text-emerald-300" />
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Suggestion Chips */}
      <div className="px-4 py-2 bg-neutral-900/50 border-t border-neutral-800/80 flex items-center gap-2 overflow-x-auto shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        {quickChips.map((chip, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(chip)}
            className="text-[11px] font-semibold text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-full px-3 py-1 whitespace-nowrap shrink-0 transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-neutral-900 border-t border-neutral-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <Input
            placeholder={`Message ${otherPartyName}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending}
            className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500 h-11 rounded-2xl text-xs flex-1"
          />
          <Button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-11 px-4 font-bold shrink-0 gap-1.5 shadow-md shadow-emerald-600/30"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

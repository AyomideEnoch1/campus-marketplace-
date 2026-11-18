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
  const otherPartyName =
    (isBuyer ? conversation.vendor?.storeName : conversation.buyer?.fullName) ||
    "User";

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
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? data.message : m))
      );
    } catch (err) {
      console.error("Failed to deliver message:", err);
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
    <div className="flex flex-col h-full bg-white border border-neutral-200/80 rounded-3xl overflow-hidden shadow-xs">
      {/* Header */}
      <div className="p-4 bg-white border-b border-neutral-100 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:text-neutral-950 shrink-0 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-sm shrink-0">
            {otherPartyName?.[0] || "U"}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm text-neutral-900 truncate">
                {otherPartyName}
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            </div>
            <p className="text-[11px] text-neutral-500 flex items-center gap-1 truncate">
              {conversation.vendor?.campus ? (
                <>
                  <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                  {conversation.vendor.campus.name}
                </>
              ) : (
                "Verified CampusTrade Chat"
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Escrow Protected
          </span>
          {isBuyer && conversation.vendor?.slug && (
            <Link
              href={`/store/${conversation.vendor.slug}`}
              className="text-xs text-neutral-600 hover:text-neutral-900 flex items-center gap-1 bg-neutral-100 hover:bg-neutral-200/80 px-2.5 py-1 rounded-xl font-semibold transition-colors"
            >
              <span>Store</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Context Product Card (If pinned) */}
      {conversation.product && (
        <div className="bg-neutral-50 border-b border-neutral-200/70 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {conversation.product.images?.[0] ? (
              <img
                src={conversation.product.images[0].url}
                alt=""
                className="w-10 h-10 rounded-xl object-cover border border-neutral-200 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-neutral-200 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-neutral-500" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-neutral-900 truncate">
                {conversation.product.title}
              </p>
              <p className="text-xs font-black text-emerald-600">
                {formatNGN(conversation.product.price)}
              </p>
            </div>
          </div>

          <Link
            href={`/product/${conversation.product.slug}`}
            className="text-[11px] text-emerald-600 hover:underline font-bold shrink-0"
          >
            View Listing &rarr;
          </Link>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-neutral-50/50">
        {/* Safety Banner */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-3 text-center text-xs text-neutral-600 max-w-md mx-auto shadow-xs">
          <p className="font-bold text-neutral-900 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            CampusTrade Safety Tip
          </p>
          <p className="text-[11px] mt-0.5 text-neutral-500">
            Always meet in designated daytime campus spots. Never release your delivery code until items are inspected.
          </p>
        </div>

        {messages.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 text-xs">
            <p>No messages yet. Send a message to start bargaining or arranging meetup!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            let timeStr = "";
            try {
              timeStr = new Date(msg.createdAt).toLocaleTimeString("en-NG", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              });
            } catch {
              timeStr = "";
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-md rounded-2xl px-4 py-2.5 text-xs ${
                    isMe
                      ? "bg-emerald-600 text-white rounded-br-xs shadow-xs"
                      : "bg-white border border-neutral-200/80 text-neutral-900 rounded-bl-xs shadow-xs"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                  <div
                    className={`flex items-center justify-end gap-1 text-[9px] mt-1 ${
                      isMe ? "text-emerald-100" : "text-neutral-400"
                    }`}
                  >
                    <span>{timeStr}</span>
                    {isMe && (
                      msg.isRead ? (
                        <CheckCheck className="w-3 h-3 text-emerald-200" />
                      ) : (
                        <Check className="w-3 h-3 text-emerald-200" />
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
      <div className="px-4 py-2 bg-white border-t border-neutral-100 flex items-center gap-2 overflow-x-auto shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        {quickChips.map((chip, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(chip)}
            className="text-[11px] font-semibold text-neutral-700 hover:text-neutral-950 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200/60 rounded-full px-3 py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-white border-t border-neutral-200/80 shrink-0">
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
            className="bg-neutral-50 border-neutral-200 focus:bg-white text-neutral-900 placeholder:text-neutral-400 h-11 rounded-2xl text-xs flex-1"
          />
          <Button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-11 px-4 font-bold shrink-0 gap-1.5 shadow-md shadow-emerald-600/20"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

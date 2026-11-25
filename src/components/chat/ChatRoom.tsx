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
  ChevronUp,
  ChevronDown,
  Loader2,
  Store,
  Tag,
  Info,
} from "lucide-react";
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
    phone?: string | null;
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
}

interface ChatRoomProps {
  conversation: ConversationDetails;
  initialMessages: ChatMessageItem[];
  currentUserId: string;
  onBack?: () => void;
  onMessageSent?: (message: ChatMessageItem) => void;
}

export function ChatRoom({
  conversation,
  initialMessages,
  currentUserId,
  onBack,
  onMessageSent,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>(initialMessages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [productPinned, setProductPinned] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Synchronize when initialMessages changes from parent
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Fetch previous messages on mount or conversation change if empty or mismatched
  useEffect(() => {
    let isCancelled = false;

    async function loadMessages() {
      if (
        initialMessages &&
        initialMessages.length > 0 &&
        initialMessages[0].conversationId === conversation.id
      ) {
        setMessages(initialMessages);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/conversations/${conversation.id}/messages`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.messages) {
            setMessages(data.messages);
          }
        }
      } catch (err) {
        console.error("Failed to load messages for conversation:", err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadMessages();

    return () => {
      isCancelled = true;
    };
  }, [conversation.id]);

  // Throttled fallback polling (45s, paused when tab is hidden) with AbortController
  useEffect(() => {
    let isCancelled = false;
    let activeController: AbortController | null = null;

    const pollMessages = async () => {
      if (isCancelled || (typeof document !== "undefined" && document.hidden)) return;
      activeController?.abort();
      activeController = new AbortController();
      try {
        const res = await fetch(`/api/conversations/${conversation.id}/messages`, {
          signal: activeController.signal,
        });
        if (res.ok && !isCancelled) {
          const data = await res.json();
          if (data.messages && Array.isArray(data.messages)) {
            setMessages((prev) => {
              if (
                data.messages.length !== prev.length ||
                (data.messages.length > 0 &&
                  prev.length > 0 &&
                  data.messages[data.messages.length - 1].id !== prev[prev.length - 1].id)
              ) {
                return data.messages;
              }
              return prev;
            });
          }
        }
      } catch {
        // Silent polling fallback
      }
    };

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      pollMessages();
    }, 45000);

    const handleVisibility = () => {
      if (!document.hidden) {
        pollMessages();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      isCancelled = true;
      activeController?.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [conversation.id]);

  // Subscribe to Supabase Realtime for instant updates
  useEffect(() => {
    if (!supabase) return;

    try {
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
    } catch (e) {
      console.warn("Supabase realtime subscription failed, polling fallback is active:", e);
    }
  }, [conversation.id, currentUserId, otherPartyName]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    setInputText("");
    setIsSending(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

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
      const deliveredMessage = data.message;

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? deliveredMessage : m))
      );

      // Notify parent container so conversation list is updated
      if (onMessageSent && deliveredMessage) {
        onMessageSent(deliveredMessage);
      }
    } catch (err) {
      console.error("Failed to deliver message:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // Quick Action Chips tailored to Buyer or Vendor
  const quickChips = isBuyer
    ? [
        "Is this item still available?",
        "Can we meet at the campus library / SUB?",
        "Can you do a slight student discount?",
        "What condition is the item in?",
        "Can I pay via ọjà Escrow for safe pickup?",
      ]
    : [
        "Yes, still available!",
        "I'm on campus today, let's meet up.",
        "Sure, I can accept that offer.",
        "Item is in perfect condition as described.",
        "Place your order on ọjà so escrow protects us both.",
      ];

  // Group messages by calendar day for clean date headers
  const getMessageDateLabel = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return d.toLocaleDateString("en-NG", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col h-full bg-white border border-neutral-200/90 rounded-3xl overflow-hidden shadow-sm">
      {/* Sleek Modern Header */}
      <div className="px-4 py-3 bg-white/95 backdrop-blur-md border-b border-neutral-100 flex items-center justify-between gap-3 shrink-0 z-10 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to conversations"
              className="md:hidden w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Avatar with Status Dot */}
          <div className="relative shrink-0">
            {conversation.vendor?.logo && !isBuyer ? (
              <img
                src={conversation.vendor.logo}
                alt=""
                className="w-10 h-10 rounded-2xl object-cover border border-neutral-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 text-white flex items-center justify-center font-black text-sm shadow-sm">
                {otherPartyName?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"
              title="Online"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm text-neutral-900 truncate">
                {otherPartyName}
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded-md font-bold shrink-0">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Verified
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 flex items-center gap-1 truncate mt-0.5">
              {conversation.vendor?.campus ? (
                <>
                  <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">{conversation.vendor.campus.name}</span>
                </>
              ) : (
                <span className="text-neutral-400">Student Marketplace Chat</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Escrow Protected In-App Chat Pill */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Escrow Protected Chat</span>
          </div>

          {/* Storefront Link if buyer */}
          {isBuyer && conversation.vendor?.slug && (
            <Link
              href={`/store/${conversation.vendor.slug}`}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 font-bold text-xs transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-neutral-500" />
              <span>Visit Store</span>
            </Link>
          )}

          {/* Escrow Badge */}
          <span className="hidden xl:inline-flex items-center gap-1 text-[11px] text-emerald-900 bg-emerald-50/90 border border-emerald-200 px-2.5 py-1 rounded-xl font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Escrow Protected
          </span>
        </div>
      </div>

      {/* Context Product Banner (With Collapse Option) */}
      {conversation.product && (
        <div className="bg-gradient-to-r from-emerald-50/50 via-neutral-50 to-emerald-50/30 border-b border-neutral-200/80 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {conversation.product.images?.[0] ? (
              <img
                src={conversation.product.images[0].url}
                alt=""
                className="w-11 h-11 rounded-xl object-cover border border-neutral-200/90 shrink-0 shadow-2xs"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-emerald-100/60 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/80">
                <Package className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Inquiry Item
              </span>
              <p className="text-xs font-bold text-neutral-900 truncate">
                {conversation.product.title}
              </p>
              <p className="text-xs font-black text-emerald-600">
                {formatNGN(conversation.product.price)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/product/${conversation.product.slug}`}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50/60 border border-emerald-200/80 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1 transition-colors"
            >
              <span>View Product</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gradient-to-b from-neutral-50/80 via-white to-neutral-50/60">
        {/* Safety Notice Card */}
        <div className="bg-white/90 border border-emerald-200/70 rounded-2xl p-3 text-xs text-neutral-600 max-w-lg mx-auto shadow-xs flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-neutral-900 text-xs">Campus Safety Guideline</p>
            <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
              Agree on a busy daylight campus hub (Library, SUB, Faculty quad). Never transfer funds directly or release delivery OTP until items are inspected.
            </p>
          </div>
        </div>

        {/* Loading History */}
        {isLoading && messages.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-neutral-400 text-xs space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <p className="font-semibold text-neutral-600">Loading conversation history...</p>
          </div>
        ) : messages.length === 0 ? (
          /* Empty Chat State */
          <div className="py-16 text-center max-w-sm mx-auto space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-neutral-900">Start the Conversation</h4>
              <p className="text-xs text-neutral-500 mt-1">
                Say hello to {otherPartyName}, ask about item availability, or coordinate a convenient campus meetup point!
              </p>
            </div>
            <div className="pt-2 flex flex-wrap justify-center gap-1.5">
              {quickChips.slice(0, 3).map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white hover:bg-emerald-50 border border-neutral-200/80 text-neutral-700 hover:text-emerald-800 transition-colors shadow-2xs"
                >
                  "{chip}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message Stream with Date Dividers */
          messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUserId;

            // Date divider logic
            const currentDateLabel = getMessageDateLabel(msg.createdAt);
            const prevDateLabel =
              idx > 0 ? getMessageDateLabel(messages[idx - 1].createdAt) : null;
            const showDateHeader = currentDateLabel !== prevDateLabel;

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
              <div key={msg.id} className="space-y-3">
                {showDateHeader && (
                  <div className="flex items-center justify-center my-2">
                    <span className="px-3 py-1 rounded-full bg-neutral-200/70 border border-neutral-200 text-neutral-600 font-bold text-[10px] uppercase tracking-wider shadow-2xs">
                      {currentDateLabel}
                    </span>
                  </div>
                )}

                <div className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                  {/* Left Avatar for Received Messages */}
                  {!isMe && (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-neutral-200 to-neutral-300 text-neutral-700 flex items-center justify-center font-bold text-[11px] shrink-0 mb-0.5">
                      {otherPartyName?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`max-w-[82%] sm:max-w-md rounded-2xl px-4 py-2.5 text-xs transition-shadow ${
                      isMe
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-xs shadow-xs"
                        : "bg-white border border-neutral-200/90 text-neutral-800 rounded-bl-xs shadow-xs"
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap break-words text-xs">
                      {msg.content}
                    </p>

                    <div
                      className={`flex items-center justify-end gap-1 text-[9px] mt-1 select-none ${
                        isMe ? "text-emerald-100" : "text-neutral-400"
                      }`}
                    >
                      <span>{timeStr}</span>
                      {isMe && (
                        <span title={msg.isRead ? "Read" : "Delivered"}>
                          {msg.isRead ? (
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-200" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-emerald-200" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Modern Suggestion Chips */}
      <div className="px-4 py-2.5 bg-neutral-50/80 border-t border-neutral-100 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
        <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span className="hidden sm:inline">Quick Suggestions:</span>
        </div>
        {quickChips.map((chip, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSendMessage(chip)}
            className="text-[11px] font-semibold text-neutral-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-neutral-200/70 hover:border-emerald-300 rounded-full px-3 py-1 whitespace-nowrap shrink-0 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xs cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Floating-style Input Bar */}
      <div className="p-3 sm:p-4 bg-white border-t border-neutral-200/80 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2 relative bg-neutral-50 border border-neutral-200/90 rounded-2xl p-2 focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={`Message ${otherPartyName}... (Press Enter to send)`}
            value={inputText}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            className="w-full bg-transparent text-neutral-900 placeholder:text-neutral-400 text-xs resize-none outline-none max-h-32 min-h-[36px] py-2 px-2"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            aria-label="Send message"
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-700/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

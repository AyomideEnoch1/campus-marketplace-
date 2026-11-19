import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatContainer, ConversationListItem } from "@/components/chat/ChatContainer";
import { ChatMessageItem } from "@/components/chat/ChatRoom";

export const dynamic = "force-dynamic";

export default async function VendorMessagesPage({
  searchParams,
}: {
  searchParams?: { buyer?: string; conversation?: string; product?: string };
}) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/login?redirect=/dashboard/messages");
  }

  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.id },
  });

  if (!vendor) {
    redirect("/vendor/register");
  }

  if (searchParams?.buyer) {
    try {
      const buyerUser = await prisma.user.findUnique({
        where: { id: searchParams.buyer },
      });
      if (buyerUser) {
        const existing = await prisma.conversation.findFirst({
          where: {
            buyerId: buyerUser.id,
            vendorId: vendor.id,
          },
        });
        if (!existing) {
          await prisma.conversation.create({
            data: {
              buyerId: buyerUser.id,
              vendorId: vendor.id,
              productId: searchParams.product || null,
              lastMessage: "Vendor initiated chat",
              lastMessageAt: new Date(),
            },
          });
        }
      }
    } catch (e) {
      console.error("Vendor auto init chat error:", e);
    }
  }

  const rawConversations = await prisma.conversation.findMany({
    where: { vendorId: vendor.id },
    orderBy: { lastMessageAt: "desc" },
    include: {
      buyer: {
        select: { id: true, fullName: true, email: true },
      },
      vendor: {
        select: {
          id: true,
          storeName: true,
          slug: true,
          logo: true,
          userId: true,
          campus: { select: { name: true } },
        },
      },
      product: {
        select: {
          id: true,
          title: true,
          price: true,
          slug: true,
          images: { take: 1, orderBy: { position: "asc" } },
        },
      },
      _count: {
        select: {
          messages: {
            where: { isRead: false, senderId: { not: session.id } },
          },
        },
      },
    },
  });

  const conversations: ConversationListItem[] = rawConversations.map((c) => ({
    id: c.id,
    buyerId: c.buyerId,
    vendorId: c.vendorId,
    productId: c.productId,
    lastMessage: c.lastMessage,
    lastMessageAt: c.lastMessageAt.toISOString(),
    buyer: c.buyer,
    vendor: c.vendor,
    product: c.product,
    _count: c._count,
  }));

  // Prefetch messages for vendor's active conversation
  let initialMessages: ChatMessageItem[] = [];
  let targetConvId = conversations[0]?.id || null;
  if (searchParams?.conversation) {
    const found = conversations.find((c) => c.id === searchParams.conversation);
    if (found) targetConvId = found.id;
  } else if (searchParams?.buyer) {
    const found = conversations.find((c) => c.buyerId === searchParams.buyer);
    if (found) targetConvId = found.id;
  }
  if (targetConvId) {
    const rawMessages = await prisma.chatMessage.findMany({
      where: { conversationId: targetConvId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    initialMessages = rawMessages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      content: m.content,
      isRead: m.isRead,
      createdAt: m.createdAt.toISOString(),
      sender: m.sender,
    }));
  }

  return (
    <div className="h-[calc(100dvh-120px)] sm:h-[calc(100dvh-140px)] flex flex-col overflow-hidden">
      <div className="pb-3 border-b border-neutral-200 shrink-0">
        <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-950 tracking-tight">
          Customer Inquiries &amp; Chat
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Respond directly to student inquiries, bargain on pricing, and coordinate on-campus handoffs
        </p>
      </div>

      <div className="flex-1 min-h-0 pt-3">
        <ChatContainer
          initialConversations={conversations}
          currentUserId={session.id}
          isVendorPortal={true}
          initialMessages={initialMessages}
          initialActiveConversationId={targetConvId}
        />
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatContainer, ConversationListItem } from "@/components/chat/ChatContainer";
import { ChatMessageItem } from "@/components/chat/ChatRoom";
import { DeviceNotificationPrompt } from "@/components/notifications/DeviceNotificationPrompt";

export const dynamic = "force-dynamic";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams?: { vendor?: string; product?: string };
}) {
  const session = await getSession();
  if (!session) {
    const returnUrl = searchParams?.vendor
      ? `/messages?vendor=${searchParams.vendor}${searchParams.product ? `&product=${searchParams.product}` : ""}`
      : "/messages";
    redirect(`/auth/login?redirect=${encodeURIComponent(returnUrl)}`);
  }

  // If vendor query param is provided, automatically start/find conversation
  if (searchParams?.vendor) {
    try {
      const vendor = await prisma.vendorProfile.findFirst({
        where: {
          OR: [{ id: searchParams.vendor }, { slug: searchParams.vendor }],
        },
      });

      if (vendor && vendor.userId !== session.id) {
        // Reuse existing conversation thread between this buyer & vendor to prevent clearing history
        let existing = await prisma.conversation.findFirst({
          where: {
            buyerId: session.id,
            vendorId: vendor.id,
          },
          orderBy: { lastMessageAt: "desc" },
        });

        if (!existing) {
          await prisma.conversation.create({
            data: {
              buyerId: session.id,
              vendorId: vendor.id,
              productId: searchParams.product || null,
              lastMessage: "Started inquiry",
              lastMessageAt: new Date(),
            },
          });
        } else if (searchParams.product && existing.productId !== searchParams.product) {
          // Update the context product without clearing chat history
          await prisma.conversation.update({
            where: { id: existing.id },
            data: {
              productId: searchParams.product,
              lastMessageAt: new Date(),
            },
          });
        }
      }
    } catch (e) {
      console.error("Auto start conversation error:", e);
    }
  }

  // Fetch recent conversations for this user (bounded)
  const rawConversations = await prisma.conversation.findMany({
    where: {
      OR: [{ buyerId: session.id }, { vendor: { userId: session.id } }],
    },
    orderBy: { lastMessageAt: "desc" },
    take: 30,
    select: {
      id: true,
      buyerId: true,
      vendorId: true,
      productId: true,
      lastMessage: true,
      lastMessageAt: true,
      buyer: {
        select: { id: true, fullName: true, email: true },
      },
      vendor: {
        select: {
          id: true,
          storeName: true,
          slug: true,
          logo: true,
          whatsapp: true,
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
          images: { take: 1, orderBy: { position: "asc" }, select: { url: true } },
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

  // Identify targeted active conversation
  let targetConversationId = conversations[0]?.id || null;
  if (searchParams?.vendor) {
    const matched = conversations.find(
      (c) =>
        c.vendorId === searchParams.vendor ||
        c.vendor.slug === searchParams.vendor ||
        c.vendor.id === searchParams.vendor
    );
    if (matched) {
      targetConversationId = matched.id;
    }
  }

  // Prefetch messages for the active conversation so history displays instantly
  let initialMessages: ChatMessageItem[] = [];
  if (targetConversationId) {
    const rawMessages = (
      await prisma.chatMessage.findMany({
        where: { conversationId: targetConversationId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          conversationId: true,
          senderId: true,
          content: true,
          isRead: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              fullName: true,
              role: true,
            },
          },
        },
      })
    ).reverse();

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
    <div className="h-[calc(100dvh-64px)] md:h-[calc(100dvh-113px)] flex flex-col p-2 sm:p-4 max-w-7xl mx-auto w-full overflow-hidden -mb-16 md:mb-0 gap-1.5">
      <div className="flex items-center justify-between pb-1.5 px-1 shrink-0">
        <h1 className="text-sm sm:text-base font-black text-neutral-900 tracking-tight">
          In-App Messages
        </h1>
        <DeviceNotificationPrompt compact mode="user" />
      </div>

      <div className="flex-1 min-h-0 w-full overflow-hidden">
        <ChatContainer
          initialConversations={conversations}
          currentUserId={session.id}
          isVendorPortal={false}
          initialMessages={initialMessages}
          initialActiveConversationId={targetConversationId}
        />
      </div>
    </div>
  );
}

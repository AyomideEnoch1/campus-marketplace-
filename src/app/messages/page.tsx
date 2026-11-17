import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatContainer, ConversationListItem } from "@/components/chat/ChatContainer";

export const dynamic = "force-dynamic";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams?: { vendor?: string; product?: string };
}) {
  const session = await getSession();
  if (!session) {
    redirect(`/auth/login?redirect=/messages`);
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
        let existing = await prisma.conversation.findFirst({
          where: {
            buyerId: session.id,
            vendorId: vendor.id,
            productId: searchParams.product || null,
          },
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
        }
      }
    } catch (e) {
      console.error("Auto start conversation error:", e);
    }
  }

  // Fetch all conversations for this user
  const rawConversations = await prisma.conversation.findMany({
    where: {
      OR: [{ buyerId: session.id }, { vendor: { userId: session.id } }],
    },
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

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-4">
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
          In-App Messages
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Real-time conversations with verified student vendors &amp; campus sellers
        </p>
      </div>

      <ChatContainer
        initialConversations={conversations}
        currentUserId={session.id}
        isVendorPortal={false}
      />
    </div>
  );
}

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatContainer, ConversationListItem } from "@/components/chat/ChatContainer";

export const dynamic = "force-dynamic";

export default async function VendorMessagesPage() {
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
        />
      </div>
    </div>
  );
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// GET /api/conversations/[id]/messages - Get message history & mark read
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: {
        vendor: { select: { userId: true, storeName: true, slug: true, logo: true } },
        buyer: { select: { id: true, fullName: true, email: true } },
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            slug: true,
            images: { take: 1, orderBy: { position: "asc" } },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Verify participant
    const isParticipant =
      conversation.buyerId === session.id || conversation.vendor.userId === session.id;

    if (!isParticipant && session.role !== "ADMIN" && session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch messages
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId: params.id },
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

    // Mark unread messages sent by the other party as read
    await prisma.chatMessage.updateMany({
      where: {
        conversationId: params.id,
        senderId: { not: session.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ conversation, messages });
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: error.message || "Failed to load messages" }, { status: 500 });
  }
}

// POST /api/conversations/[id]/messages - Send a message
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: {
        vendor: { select: { userId: true, storeName: true } },
        buyer: { select: { id: true, fullName: true } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const isParticipant =
      conversation.buyerId === session.id || conversation.vendor.userId === session.id;

    if (!isParticipant && session.role !== "ADMIN" && session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create chat message
    const message = await prisma.chatMessage.create({
      data: {
        conversationId: params.id,
        senderId: session.id,
        content: content.trim(),
      },
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

    // Update conversation last message
    await prisma.conversation.update({
      where: { id: params.id },
      data: {
        lastMessage: content.trim(),
        lastMessageAt: new Date(),
      },
    });

    // Dispatch real-time notification to the recipient
    const isSenderBuyer = session.id === conversation.buyerId;
    const recipientUserId = isSenderBuyer ? conversation.vendor.userId : conversation.buyerId;
    const senderName = isSenderBuyer ? (conversation.buyer.fullName || "Student Buyer") : conversation.vendor.storeName;

    createNotification({
      userId: recipientUserId,
      type: "CHAT_MESSAGE",
      title: `Message from ${senderName}`,
      message: content.trim().slice(0, 100),
      link: isSenderBuyer ? "/dashboard/messages" : "/messages",
    }).catch((e) => console.error("Chat notification error:", e));

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: error.message || "Failed to send message" }, { status: 500 });
  }
}

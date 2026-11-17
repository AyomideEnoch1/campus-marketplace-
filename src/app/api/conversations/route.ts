import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/conversations - List conversations for the logged in user
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a vendor
    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { userId: session.id },
    });

    const isVendor = session.role === "VENDOR" || !!vendorProfile;

    const conversations = await prisma.conversation.findMany({
      where: isVendor && vendorProfile
        ? {
            OR: [
              { vendorId: vendorProfile.id },
              { buyerId: session.id },
            ],
          }
        : { buyerId: session.id },
      orderBy: { lastMessageAt: "desc" },
      include: {
        buyer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        vendor: {
          select: {
            id: true,
            storeName: true,
            slug: true,
            logo: true,
            userId: true,
            campus: {
              select: {
                name: true,
              },
            },
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            slug: true,
            images: {
              take: 1,
              orderBy: { position: "asc" },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: { not: session.id },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: error.message || "Failed to load conversations" }, { status: 500 });
  }
}

// POST /api/conversations - Start or retrieve a conversation
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please sign in to message this vendor" }, { status: 401 });
    }

    const body = await request.json();
    const { vendorId, productId, initialMessage } = body;

    if (!vendorId) {
      return NextResponse.json({ error: "Vendor ID is required" }, { status: 400 });
    }

    // Resolve vendor (could be vendor ID or vendor slug)
    let vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      vendor = await prisma.vendorProfile.findUnique({
        where: { slug: vendorId },
      });
    }

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Prevent vendor from chatting with themselves
    if (vendor.userId === session.id) {
      return NextResponse.json({ error: "You cannot start a conversation with your own store" }, { status: 400 });
    }

    // Look for existing conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        buyerId: session.id,
        vendorId: vendor.id,
        ...(productId ? { productId } : {}),
      },
      include: {
        vendor: { select: { storeName: true, slug: true } },
        product: { select: { title: true, price: true } },
      },
    });

    // Create if doesn't exist
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          buyerId: session.id,
          vendorId: vendor.id,
          productId: productId || null,
          lastMessage: initialMessage || "Started conversation",
          lastMessageAt: new Date(),
        },
        include: {
          vendor: { select: { storeName: true, slug: true } },
          product: { select: { title: true, price: true } },
        },
      });

      // Send initial message if provided
      if (initialMessage && initialMessage.trim()) {
        await prisma.chatMessage.create({
          data: {
            conversationId: conversation.id,
            senderId: session.id,
            content: initialMessage.trim(),
          },
        });
      }
    } else if (initialMessage && initialMessage.trim()) {
      // Append message to existing conversation
      await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: session.id,
          content: initialMessage.trim(),
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: initialMessage.trim(),
          lastMessageAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, conversation });
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    return NextResponse.json({ error: error.message || "Failed to start conversation" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireVendor();
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: session.id },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { status } = body;

    const updated = await prisma.order.update({
      where: { id: params.id, vendorId: vendor.id },
      data: { status: status as any },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireVendor();
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: session.id },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!order || order.vendorId !== vendor.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only unpaid or cancelled orders can be dismissed/deleted by vendor
    if (order.paid_at || ["paid_held", "held", "released"].includes(order.escrow_status)) {
      return NextResponse.json(
        { error: "Cannot delete paid escrow orders" },
        { status: 400 }
      );
    }

    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });

    return NextResponse.json({ success: true, message: "Order removed successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

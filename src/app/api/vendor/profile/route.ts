import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth";

export const dynamic = "force-dynamic";

const profileSchema = z.object({
  storeName: z.string().trim().min(2, "Store name must be at least 2 characters").max(50, "Store name cannot exceed 50 characters"),
  storeDescription: z.string().optional(),
  whatsapp: z.string().min(8, "WhatsApp number is required"),
  faculty: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  studentIdUrl: z.string().optional().nullable(),
  brandColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Invalid hex color").default("#0F172A"),
  layout: z.enum(["grid", "list", "showcase", "lookbook"]).default("grid"),
  logo: z.string().optional().nullable(),
  banner: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const session = await requireVendor();
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: session.id },
      include: {
        campus: true,
        _count: { select: { products: true, orders: true } },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
    }

    return NextResponse.json({ vendor });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load vendor profile" },
      { status: 401 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireVendor();
    const body = await request.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid profile data" },
        { status: 400 }
      );
    }

    const updated = await prisma.vendorProfile.update({
      where: { userId: session.id },
      data: parsed.data,
      include: { campus: true },
    });

    return NextResponse.json({ success: true, vendor: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}

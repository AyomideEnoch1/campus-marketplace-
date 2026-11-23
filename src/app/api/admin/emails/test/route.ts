export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { notificationService } from "@/lib/email/notification-service";
import { EmailTemplateId } from "@/lib/email/templates/types";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { templateId, recipientEmail } = body;

    const targetEmail = (recipientEmail || admin.email || "").trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes("@")) {
      return NextResponse.json({ error: "Valid recipient email is required" }, { status: 400 });
    }

    const template = (templateId as EmailTemplateId) || "buyer_welcome";

    // Provide rich mock payload for each template type
    const samplePayloads: Record<EmailTemplateId, any> = {
      admin_new_vendor_pending: {
        storeName: "Campus Gadgets UNILAG",
        applicantName: "Chinedu Okafor",
        sellerType: "student",
        campusName: "University of Lagos",
      },
      admin_kyc_submission: {
        storeName: "Glamour Books OAU",
        vendorName: "Amina Yusuf",
        documentType: "National ID & CAC Certificate",
      },
      admin_new_dispute: {
        orderNumber: "OJA-88921",
        disputeId: "disp_mock_123",
        reason: "Item not as described (damaged screen)",
        buyerName: "Tolu Adeleke",
        storeName: "Tech Hub FUTA",
        orderTotal: 45000,
      },
      admin_payout_failed: {
        orderNumber: "OJA-77123",
        storeName: "Campus Styles",
        amount: 18500,
        failureReason: "Recipient account number invalid or name mismatch at destination bank",
      },
      admin_security_alert: {
        eventType: "ADMIN_ROLE_ELEVATED",
        description: "User role was promoted to ADMINISTRATOR by Super Admin",
        actorEmail: admin.email,
        targetEmail: targetEmail,
      },
      admin_daily_digest: {
        date: new Date().toLocaleDateString("en-NG"),
        totalOrders: 42,
        totalVolume: 850000,
        newUsersCount: 118,
        newVendorsCount: 7,
        pendingDisputesCount: 1,
      },
      vendor_registration_received: {
        storeName: "Ace Campus Wears",
        vendorName: "Emeka Obi",
        campusName: "University of Ibadan",
      },
      vendor_status_update: {
        storeName: "Ace Campus Wears",
        vendorName: "Emeka Obi",
        status: "APPROVED",
        reason: "Student identity confirmed. Store unlocked.",
      },
      vendor_new_order: {
        orderNumber: "OJA-99231",
        storeName: "Ace Campus Wears",
        buyerName: "Blessing Kalu",
        items: [
          { title: "UNILAG Faculty Hoodie (Size L)", quantity: 1, price: 12000 },
          { title: "Campus Tote Bag", quantity: 2, price: 3500 },
        ],
        payoutAmount: 19000,
        meetupPoint: "New Hall Quadrangle",
        campusName: "UNILAG",
      },
      vendor_order_cancelled: {
        orderNumber: "OJA-66512",
        storeName: "Ace Campus Wears",
        reason: "Buyer cancelled order before dispatch.",
      },
      vendor_dispute_opened: {
        orderNumber: "OJA-99231",
        storeName: "Ace Campus Wears",
        reason: "Wrong color received",
        buyerName: "Blessing Kalu",
        amount: 19000,
      },
      vendor_product_moderation: {
        productTitle: "Calculus for Engineers (8th Edition)",
        storeName: "Ace Campus Wears",
        status: "APPROVED",
      },
      vendor_stock_alert: {
        productTitle: "Scientific Calculator FX-991EX",
        storeName: "Ace Campus Wears",
        stockRemaining: 2,
      },
      vendor_payout_status: {
        orderNumber: "OJA-99231",
        storeName: "Ace Campus Wears",
        amount: 19000,
        status: "PAID",
        bankName: "Guaranty Trust Bank",
        accountNumberMasked: "******4512",
      },
      vendor_new_review: {
        storeName: "Ace Campus Wears",
        reviewerName: "David O.",
        rating: 5,
        comment: "Fast meetup at Sports Centre! Item in brand new condition.",
        productTitle: "Faculty Hoodie",
      },
      buyer_welcome: {
        userName: "Femi",
      },
      buyer_email_verification: {
        userName: "Femi",
        verificationCode: "748291",
        verifyUrl: `https://xn--j-sfa590u.com/auth/verify-email?code=748291`,
      },
      buyer_password_reset: {
        userName: "Femi",
        resetUrl: `https://xn--j-sfa590u.com/auth/reset-password?token=sample_token`,
      },
      buyer_password_changed: {
        userName: "Femi",
        changedAt: new Date(),
      },
      buyer_new_login: {
        userName: "Femi",
        device: "Chrome on macOS / Lagos, Nigeria",
        ipAddress: "102.89.44.12",
        loginTime: new Date(),
      },
      buyer_order_confirmation: {
        orderNumber: "OJA-99231",
        buyerName: "Femi",
        items: [
          { title: "UNILAG Faculty Hoodie (Size L)", quantity: 1, price: 12000 },
          { title: "Campus Tote Bag", quantity: 2, price: 3500 },
        ],
        totalAmount: 19000,
        deliveryCode: "492815",
        meetupPoint: "Faculty of Science Foyer",
        campusName: "University of Lagos",
      },
      buyer_order_shipped: {
        orderNumber: "OJA-99231",
        buyerName: "Femi",
        storeName: "Ace Campus Wears",
        deliveryCode: "492815",
        meetupPoint: "Faculty of Science Foyer",
      },
      buyer_order_delivered: {
        orderNumber: "OJA-99231",
        buyerName: "Femi",
        storeName: "Ace Campus Wears",
      },
      buyer_order_cancelled: {
        orderNumber: "OJA-99231",
        buyerName: "Femi",
        reason: "Item out of stock by seller",
      },
      buyer_dispute_update: {
        orderNumber: "OJA-99231",
        buyerName: "Femi",
        status: "RESOLVED_REFUNDED",
        refundAmount: 19000,
        notes: "Refund credited back to buyer bank account.",
      },
      buyer_refund_issued: {
        orderNumber: "OJA-99231",
        buyerName: "Femi",
        status: "RESOLVED_REFUNDED",
        refundAmount: 19000,
        notes: "Refund credited back to buyer bank account.",
      },
      buyer_abandoned_cart: {
        buyerName: "Femi",
        items: [
          { title: "Organic Chemistry Textbook", price: 8500 },
          { title: "Study Desk Lamp LED", price: 6200 },
        ],
        totalAmount: 14700,
      },
    };

    const payload = samplePayloads[template] || samplePayloads.buyer_welcome;

    const result = await notificationService.enqueue({
      recipient: targetEmail,
      templateId: template,
      priority: "HIGH",
      immediate: true,
      payload,
    });

    return NextResponse.json({
      success: true,
      message: `Test email for template '${template}' dispatched to ${targetEmail}`,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to dispatch test email" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}

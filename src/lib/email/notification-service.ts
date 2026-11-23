import { prisma } from "@/lib/prisma";
import { EmailTemplateId, renderEmailTemplate } from "./templates";
import { processQueueItem } from "./queue-processor";

export interface QueueEmailOptions {
  recipient: string;
  templateId: EmailTemplateId;
  payload: any;
  subject?: string;
  priority?: "HIGH" | "NORMAL" | "LOW";
  immediate?: boolean;
  metadata?: any;
}

/**
 * Get the Super Admin recipient email address
 */
export async function getSuperAdminEmail(): Promise<string> {
  const envAdmin = process.env.ADMIN_EMAIL;
  if (envAdmin && envAdmin.includes("@")) {
    return envAdmin.trim().toLowerCase();
  }

  // Fallback to querying first SUPERADMIN or ADMIN in DB
  const adminUser = await prisma.user.findFirst({
    where: { role: { in: ["SUPERADMIN", "ADMIN"] } },
    select: { email: true },
    orderBy: { createdAt: "asc" },
  });

  return adminUser?.email?.toLowerCase() || "admin@xn--j-sfa590u.com";
}

class NotificationService {
  /**
   * Enqueue an email into the database outbox with priority and optional immediate dispatch.
   * Completely resilient: this function will NEVER throw an unhandled exception that interrupts business flows.
   */
  async enqueue(options: QueueEmailOptions): Promise<{ success: boolean; queueId?: string; error?: string }> {
    try {
      const recipient = options.recipient.trim().toLowerCase();
      if (!recipient || !recipient.includes("@") || recipient.endsWith("@guest.campustrade.ng")) {
        return { success: false, error: "Invalid or guest email address" };
      }

      // 1. Pre-render subject to index on queue item
      let renderedSubject = options.subject;
      if (!renderedSubject) {
        try {
          const rendered = renderEmailTemplate(options.templateId, options.payload);
          renderedSubject = rendered.subject;
        } catch {
          renderedSubject = `ọjà Notification (${options.templateId})`;
        }
      }

      // 2. Persist to EmailQueue table
      const queueItem = await prisma.emailQueue.create({
        data: {
          recipient,
          subject: renderedSubject,
          templateId: options.templateId,
          payloadJson: JSON.stringify(options.payload || {}),
          priority: options.priority || "NORMAL",
          metadataJson: options.metadata ? JSON.stringify(options.metadata) : null,
          status: "PENDING",
        },
      });

      // 3. For HIGH priority or immediate requests, trigger worker asynchronously
      if (options.immediate !== false || options.priority === "HIGH") {
        processQueueItem(queueItem.id).catch((err) => {
          console.error(`[Queue Background Process Error] ID ${queueItem.id}:`, err?.message || err);
        });
      }

      return { success: true, queueId: queueItem.id };
    } catch (err: any) {
      console.error("[NotificationService.enqueue Error]:", err?.message || err);
      return { success: false, error: err?.message || "Failed to enqueue notification" };
    }
  }

  // --------------------------------------------------------------------------
  // 1. SUPER ADMIN NOTIFICATIONS
  // --------------------------------------------------------------------------

  async notifyAdminNewVendor(data: {
    storeName: string;
    applicantName: string;
    sellerType: string;
    campusName?: string;
  }) {
    const adminEmail = await getSuperAdminEmail();
    return this.enqueue({
      recipient: adminEmail,
      templateId: "admin_new_vendor_pending",
      priority: "HIGH",
      payload: data,
    });
  }

  async notifyAdminKycSubmitted(data: {
    storeName: string;
    vendorName: string;
    documentType: string;
  }) {
    const adminEmail = await getSuperAdminEmail();
    return this.enqueue({
      recipient: adminEmail,
      templateId: "admin_kyc_submission",
      priority: "HIGH",
      payload: data,
    });
  }

  async notifyAdminNewDispute(data: {
    orderNumber: string;
    disputeId: string;
    reason: string;
    buyerName: string;
    storeName: string;
    orderTotal: number;
  }) {
    const adminEmail = await getSuperAdminEmail();
    return this.enqueue({
      recipient: adminEmail,
      templateId: "admin_new_dispute",
      priority: "HIGH",
      payload: data,
    });
  }

  async notifyAdminPayoutFailed(data: {
    orderNumber: string;
    storeName: string;
    amount: number;
    failureReason: string;
  }) {
    const adminEmail = await getSuperAdminEmail();
    return this.enqueue({
      recipient: adminEmail,
      templateId: "admin_payout_failed",
      priority: "HIGH",
      payload: data,
    });
  }

  async notifyAdminSecurityAlert(data: {
    eventType: string;
    description: string;
    actorEmail?: string;
    targetEmail?: string;
  }) {
    const adminEmail = await getSuperAdminEmail();
    return this.enqueue({
      recipient: adminEmail,
      templateId: "admin_security_alert",
      priority: "HIGH",
      payload: data,
    });
  }

  // --------------------------------------------------------------------------
  // 2. VENDOR NOTIFICATIONS
  // --------------------------------------------------------------------------

  async notifyVendorRegistrationReceived(data: {
    email: string;
    storeName: string;
    vendorName: string;
    campusName?: string;
  }) {
    return this.enqueue({
      recipient: data.email,
      templateId: "vendor_registration_received",
      priority: "NORMAL",
      payload: data,
    });
  }

  async notifyVendorStatusUpdate(data: {
    email: string;
    storeName: string;
    vendorName: string;
    status: "APPROVED" | "REJECTED" | "SUSPENDED" | "REINSTATED" | "INFO_REQUESTED";
    reason?: string;
    appealSteps?: string;
  }) {
    return this.enqueue({
      recipient: data.email,
      templateId: "vendor_status_update",
      priority: "HIGH",
      payload: data,
    });
  }

  async notifyVendorNewOrder(data: {
    email: string;
    orderNumber: string;
    storeName: string;
    buyerName: string;
    items: Array<{ title: string; quantity: number; price: number }>;
    payoutAmount: number;
    meetupPoint?: string;
    campusName?: string;
  }) {
    return this.enqueue({
      recipient: data.email,
      templateId: "vendor_new_order",
      priority: "HIGH",
      payload: data,
    });
  }

  async notifyVendorOrderCancelled(data: {
    email: string;
    orderNumber: string;
    storeName: string;
    reason?: string;
  }) {
    return this.enqueue({
      recipient: data.email,
      templateId: "vendor_order_cancelled",
      priority: "HIGH",
      payload: data,
    });
  }

  async notifyVendorDisputeOpened(data: {
    email: string;
    orderNumber: string;
    storeName: string;
    reason: string;
    buyerName: string;
    amount: number;
  }) {
    return this.enqueue({
      recipient: data.email,
      templateId: "vendor_dispute_opened",
      priority: "HIGH",
      payload: data,
    });
  }

  async notifyVendorProductModeration(data: {
    email: string;
    productTitle: string;
    storeName: string;
    status: "APPROVED" | "REJECTED" | "PUBLISHED";
    rejectionReason?: string;
  }) {
    return this.enqueue({
      recipient: data.email,
      templateId: "vendor_product_moderation",
      priority: "NORMAL",
      payload: data,
    });
  }

  async notifyVendorStockAlert(data: {
    email: string;
    productTitle: string;
    storeName: string;
    stockRemaining: number;
  }) {
    return this.enqueue({
      recipient: data.email,
      templateId: "vendor_stock_alert",
      priority: "NORMAL",
      payload: data,
    });
  }

  async notifyVendorPayoutStatus(data: {
    email: string;
    orderNumber: string;
    storeName: string;
    amount: number;
    status: "PAID" | "FAILED";
    bankName?: string;
    accountNumberMasked?: string;
    errorMessage?: string;
  }) {
    return this.enqueue({
      recipient: data.email,
      templateId: "vendor_payout_status",
      priority: "HIGH",
      payload: data,
    });
  }

  async notifyVendorNewReview(data: {
    email: string;
    storeName: string;
    reviewerName: string;
    rating: number;
    comment?: string;
    productTitle?: string;
  }) {
    return this.enqueue({
      recipient: data.email,
      templateId: "vendor_new_review",
      priority: "LOW",
      payload: data,
    });
  }

  // --------------------------------------------------------------------------
  // 3. BUYER / USER NOTIFICATIONS
  // --------------------------------------------------------------------------

  async notifyBuyerWelcome(data: { email: string; userName: string }) {
    return this.enqueue({
      recipient: data.email,
      templateId: "buyer_welcome",
      priority: "NORMAL",
      payload: data,
    });
  }

  async notifyBuyerEmailVerification(data: {
    email: string;
    userName: string;
    verificationCode: string;
    verifyUrl: string;
  }) {
    return this.enqueue({
      recipient: data.email,
      templateId: "buyer_email_verification",
      priority: "HIGH",
      payload: data,
    });
  }

  async notifyBuyerPasswordReset(data: {
    email: string;
    userName: string;
    resetUrl: string;
  }) {
    return this.enqueue({
      recipient: data.email,
      templateId: "buyer_password_reset",
      priority: "HIGH",
      payload: data,
    });
  }

  async notifyBuyerPasswordChanged(data: {
    email: string;
    userName: string;
  }) {
    return this.enqueue({
      recipient: data.email,
      templateId: "buyer_password_changed",
      priority: "HIGH",
      payload: data,
    });
  }

  async notifyBuyerNewLogin(data: {
    email: string;
    userName: string;
    device?: string;
    ipAddress?: string;
  }) {
    return this.enqueue({
      recipient: data.email,
      templateId: "buyer_new_login",
      priority: "NORMAL",
      payload: data,
    });
  }

  async notifyBuyerOrderConfirmed(data: {
    email: string;
    orderNumber: string;
    buyerName: string;
    items: Array<{ title: string; quantity: number; price: number }>;
    totalAmount: number;
    deliveryCode: string;
    meetupPoint?: string;
    campusName?: string;
  }) {
    return this.enqueue({
      recipient: data.email,
      templateId: "buyer_order_confirmation",
      priority: "HIGH",
      payload: data,
    });
  }

  async notifyBuyerOrderShipped(data: {
    email: string;
    orderNumber: string;
    buyerName: string;
    storeName: string;
    deliveryCode: string;
    meetupPoint?: string;
  }) {
    return this.enqueue({
      recipient: data.email,
      templateId: "buyer_order_shipped",
      priority: "HIGH",
      payload: data,
    });
  }

  async notifyBuyerOrderDelivered(data: {
    email: string;
    orderNumber: string;
    buyerName: string;
    storeName: string;
  }) {
    return this.enqueue({
      recipient: data.email,
      templateId: "buyer_order_delivered",
      priority: "NORMAL",
      payload: data,
    });
  }

  async notifyBuyerOrderCancelled(data: {
    email: string;
    orderNumber: string;
    buyerName: string;
    reason?: string;
  }) {
    return this.enqueue({
      recipient: data.email,
      templateId: "buyer_order_cancelled",
      priority: "HIGH",
      payload: data,
    });
  }

  async notifyBuyerDisputeUpdate(data: {
    email: string;
    orderNumber: string;
    buyerName: string;
    status: "OPENED" | "RESOLVED_REFUNDED" | "REJECTED";
    refundAmount?: number;
    reason?: string;
    notes?: string;
  }) {
    return this.enqueue({
      recipient: data.email,
      templateId: "buyer_dispute_update",
      priority: "HIGH",
      payload: data,
    });
  }

  async notifyBuyerAbandonedCart(data: {
    email: string;
    buyerName: string;
    items: Array<{ title: string; price: number }>;
    totalAmount: number;
    unsubscribeUrl?: string;
  }) {
    return this.enqueue({
      recipient: data.email,
      templateId: "buyer_abandoned_cart",
      priority: "LOW",
      payload: data,
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;

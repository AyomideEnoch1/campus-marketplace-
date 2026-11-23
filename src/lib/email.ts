import { notificationService } from "./email/notification-service";
export { notificationService } from "./email/notification-service";
export { processEmailQueueBatch, processQueueItem } from "./email/queue-processor";
export { renderEmailTemplate } from "./email/templates";
export * from "./email/templates/types";
export * from "./email/sender";

// Backward-compatible wrappers for existing direct callers

export async function sendOrderConfirmationEmail(
  to: string,
  props: {
    buyerName?: string;
    customerName?: string;
    orderNumber: string;
    items: Array<{ title?: string; name?: string; quantity: number; price: number }>;
    totalAmount: number;
    deliveryCode?: string;
    verificationCode?: string;
    meetupPoint?: string;
    campusName?: string;
  }
) {
  return notificationService.notifyBuyerOrderConfirmed({
    email: to,
    orderNumber: props.orderNumber,
    buyerName: props.buyerName || props.customerName || "Student",
    items: props.items.map((i) => ({
      title: i.title || i.name || "Item",
      quantity: i.quantity,
      price: i.price,
    })),
    totalAmount: props.totalAmount,
    deliveryCode: props.deliveryCode || props.verificationCode || "123456",
    meetupPoint: props.meetupPoint,
    campusName: props.campusName,
  });
}

export async function sendVendorOrderNotificationEmail(
  to: string,
  props: {
    storeName: string;
    orderNumber: string;
    vendorName?: string;
    buyerName?: string;
    buyerPhone?: string;
    items?: Array<{ title?: string; name?: string; quantity: number; price: number }>;
    payoutAmount?: number;
    totalAmount?: number;
    meetupPoint?: string;
    campusName?: string;
    dashboardUrl?: string;
  }
) {
  return notificationService.notifyVendorNewOrder({
    email: to,
    orderNumber: props.orderNumber,
    storeName: props.storeName,
    buyerName: props.buyerName || "Student",
    items: (props.items || []).map((i) => ({
      title: i.title || i.name || "Item",
      quantity: i.quantity,
      price: i.price,
    })),
    payoutAmount: props.payoutAmount || props.totalAmount || 0,
    meetupPoint: props.meetupPoint,
    campusName: props.campusName,
  });
}

export async function sendVendorStatusEmail(
  to: string,
  props: {
    storeName: string;
    applicantName?: string;
    vendorName?: string;
    status: "APPROVED" | "REJECTED" | "SUSPENDED" | "REINSTATED" | "INFO_REQUESTED" | string;
    rejectionReason?: string;
    notes?: string;
    tier?: number;
    dashboardUrl?: string;
  }
) {
  return notificationService.notifyVendorStatusUpdate({
    email: to,
    storeName: props.storeName,
    vendorName: props.applicantName || props.vendorName || props.storeName,
    status: (props.status as any) || "APPROVED",
    reason: props.rejectionReason || props.notes,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  props: {
    userName?: string;
    resetUrl: string;
  }
) {
  return notificationService.notifyBuyerPasswordReset({
    email: to,
    userName: props.userName || "Campus Student",
    resetUrl: props.resetUrl,
  });
}

export async function sendEmailVerificationEmail(
  to: string,
  props: {
    userName?: string;
    verificationCode?: string;
    verifyUrl: string;
  }
) {
  return notificationService.notifyBuyerEmailVerification({
    email: to,
    userName: props.userName || "Campus Student",
    verificationCode: props.verificationCode || "123456",
    verifyUrl: props.verifyUrl,
  });
}

export async function sendVerifyEmail(
  to: string,
  props: {
    userName?: string;
    verificationCode?: string;
    verifyUrl: string;
  }
) {
  return sendEmailVerificationEmail(to, props);
}

export async function sendWelcomeEmail(
  to: string,
  props: {
    userName?: string;
    userRole?: string;
    exploreUrl?: string;
  }
) {
  return notificationService.notifyBuyerWelcome({
    email: to,
    userName: props.userName || "Campus Member",
  });
}

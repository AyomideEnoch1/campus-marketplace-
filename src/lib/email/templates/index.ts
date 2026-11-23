import { EmailTemplateId, RenderedEmail } from "./types";
import {
  renderAdminNewVendorPending,
  renderAdminKycSubmission,
  renderAdminNewDispute,
  renderAdminPayoutFailed,
  renderAdminSecurityAlert,
  renderAdminDailyDigest,
} from "./admin-templates";
import {
  renderVendorRegistrationReceived,
  renderVendorStatusUpdate,
  renderVendorNewOrder,
  renderVendorDisputeOpened,
  renderVendorProductModeration,
  renderVendorStockAlert,
  renderVendorPayoutStatus,
  renderVendorNewReview,
} from "./vendor-templates";
import {
  renderBuyerWelcome,
  renderBuyerEmailVerification,
  renderBuyerPasswordReset,
  renderBuyerPasswordChanged,
  renderBuyerNewLogin,
  renderBuyerOrderConfirmation,
  renderBuyerOrderShipped,
  renderBuyerOrderDelivered,
  renderBuyerDisputeRefund,
  renderBuyerAbandonedCart,
} from "./buyer-templates";

export * from "./types";
export * from "./base";
export * from "./admin-templates";
export * from "./vendor-templates";
export * from "./buyer-templates";

/**
 * Universal dispatcher that takes a template ID and dynamic JSON payload,
 * rendering mobile-responsive HTML and a plain-text fallback.
 */
export function renderEmailTemplate(
  templateId: EmailTemplateId | string,
  payload: any
): RenderedEmail {
  switch (templateId) {
    // 1. Super Admin
    case "admin_new_vendor_pending":
      return renderAdminNewVendorPending(payload);
    case "admin_kyc_submission":
      return renderAdminKycSubmission(payload);
    case "admin_new_dispute":
      return renderAdminNewDispute(payload);
    case "admin_payout_failed":
      return renderAdminPayoutFailed(payload);
    case "admin_security_alert":
      return renderAdminSecurityAlert(payload);
    case "admin_daily_digest":
      return renderAdminDailyDigest(payload);

    // 2. Vendors
    case "vendor_registration_received":
      return renderVendorRegistrationReceived(payload);
    case "vendor_status_update":
      return renderVendorStatusUpdate(payload);
    case "vendor_new_order":
      return renderVendorNewOrder(payload);
    case "vendor_order_cancelled":
      return renderVendorStatusUpdate({
        ...payload,
        status: "REJECTED",
        reason: payload.reason || "Order was cancelled.",
      });
    case "vendor_dispute_opened":
      return renderVendorDisputeOpened(payload);
    case "vendor_product_moderation":
      return renderVendorProductModeration(payload);
    case "vendor_stock_alert":
      return renderVendorStockAlert(payload);
    case "vendor_payout_status":
      return renderVendorPayoutStatus(payload);
    case "vendor_new_review":
      return renderVendorNewReview(payload);

    // 3. Buyers
    case "buyer_welcome":
      return renderBuyerWelcome(payload);
    case "buyer_email_verification":
      return renderBuyerEmailVerification(payload);
    case "buyer_password_reset":
      return renderBuyerPasswordReset(payload);
    case "buyer_password_changed":
      return renderBuyerPasswordChanged(payload);
    case "buyer_new_login":
      return renderBuyerNewLogin(payload);
    case "buyer_order_confirmation":
      return renderBuyerOrderConfirmation(payload);
    case "buyer_order_shipped":
      return renderBuyerOrderShipped(payload);
    case "buyer_order_delivered":
      return renderBuyerOrderDelivered(payload);
    case "buyer_order_cancelled":
      return renderBuyerDisputeRefund({
        ...payload,
        status: "OPENED",
        reason: payload.reason || "Order has been cancelled.",
      });
    case "buyer_dispute_update":
    case "buyer_refund_issued":
      return renderBuyerDisputeRefund(payload);
    case "buyer_abandoned_cart":
      return renderBuyerAbandonedCart(payload);

    default:
      throw new Error(`[Email Template Error] Unknown template ID: ${templateId}`);
  }
}

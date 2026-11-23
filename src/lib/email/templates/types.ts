/**
 * Type definitions for all ọjà transactional & marketing email notifications
 */

export type EmailTemplateId =
  // 1. Super Admin
  | "admin_new_vendor_pending"
  | "admin_kyc_submission"
  | "admin_new_dispute"
  | "admin_payout_failed"
  | "admin_security_alert"
  | "admin_daily_digest"

  // 2. Vendors
  | "vendor_registration_received"
  | "vendor_status_update"
  | "vendor_new_order"
  | "vendor_order_cancelled"
  | "vendor_dispute_opened"
  | "vendor_product_moderation"
  | "vendor_stock_alert"
  | "vendor_payout_status"
  | "vendor_new_review"

  // 3. Buyers
  | "buyer_welcome"
  | "buyer_email_verification"
  | "buyer_password_reset"
  | "buyer_password_changed"
  | "buyer_new_login"
  | "buyer_order_confirmation"
  | "buyer_order_shipped"
  | "buyer_order_delivered"
  | "buyer_order_cancelled"
  | "buyer_dispute_update"
  | "buyer_refund_issued"
  | "buyer_abandoned_cart";

export interface BaseTemplateProps {
  recipientName?: string;
  recipientEmail?: string;
  unsubscribeUrl?: string;
  supportUrl?: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

import { Resend } from "resend";
import {
  getEmailVerificationTemplate,
  getWelcomeTemplate,
  getPasswordResetTemplate,
  getOrderConfirmationTemplate,
  getVendorStatusTemplate,
  getVendorNotificationTemplate,
} from "./email-templates";

export interface OrderConfirmationEmailProps {
  buyerName?: string;
  customerName?: string;
  orderNumber: string;
  items: Array<{ title?: string; name?: string; quantity: number; price: number }>;
  totalAmount: number;
  currency?: string;
  deliveryCode?: string;
  verificationCode?: string;
  meetupPoint?: string;
  campusName?: string;
}

export interface VendorNotificationEmailProps {
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

export interface VendorStatusEmailProps {
  storeName: string;
  applicantName?: string;
  vendorName?: string;
  status: "APPROVED" | "REJECTED" | "SUSPENDED" | "INFO_REQUESTED" | string;
  rejectionReason?: string;
  tier?: number;
  dashboardUrl?: string;
  notes?: string;
}

export interface PasswordResetEmailProps {
  userName?: string;
  resetUrl: string;
}

export interface EmailVerificationEmailProps {
  userName?: string;
  verificationCode?: string;
  verifyUrl: string;
}

export interface VerifyEmailProps {
  userName?: string;
  verificationCode?: string;
  verifyUrl: string;
}

export interface WelcomeEmailProps {
  userName?: string;
  userRole?: string;
  dashboardUrl?: string;
  exploreUrl?: string;
}

const resendApiKey = process.env.RESEND_API_KEY;
// Uses the verified custom domain xn--j-sfa590u.com (ọjà.com) on Resend for safe inbox delivery
const primaryFromEmail = process.env.EMAIL_FROM || "ọjà. <notifications@xn--j-sfa590u.com>";
const fallbackFromEmail = "notifications@xn--j-sfa590u.com";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Internal robust email sender with fallback from address and error detection
 */
async function sendWithFallback({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ success: boolean; data?: any; error?: string; simulated?: boolean }> {
  if (!resend) {
    console.log(`[Email Simulated] to=${to}, subject="${subject}"`);
    return { success: true, simulated: true };
  }

  try {
    const response = await resend.emails.send({
      from: primaryFromEmail,
      to,
      subject,
      html,
      text,
    });

    if (response.error) {
      console.warn(`[Resend Primary Send Error] from=${primaryFromEmail}:`, response.error);
      // Attempt fallback with plain sender address (no unicode display name)
      const fallbackResponse = await resend.emails.send({
        from: fallbackFromEmail,
        to,
        subject,
        html,
        text,
      });

      if (fallbackResponse.error) {
        console.error(`[Resend Fallback Send Error] from=${fallbackFromEmail}:`, fallbackResponse.error);
        return { success: false, error: fallbackResponse.error.message };
      }

      console.log(`[Email Sent via Fallback] to=${to}, id=${fallbackResponse.data?.id}`);
      return { success: true, data: fallbackResponse.data };
    }

    console.log(`[Email Sent Successfully] to=${to}, id=${response.data?.id}`);
    return { success: true, data: response.data };
  } catch (err: any) {
    console.error("[Resend Network / Exception Error]:", err?.message || err);
    try {
      const fallbackResponse = await resend.emails.send({
        from: fallbackFromEmail,
        to,
        subject,
        html,
        text,
      });
      if (fallbackResponse.error) {
        return { success: false, error: fallbackResponse.error.message };
      }
      return { success: true, data: fallbackResponse.data };
    } catch (fallbackErr: any) {
      return { success: false, error: fallbackErr?.message || err?.message };
    }
  }
}

/**
 * Send order confirmation to student buyer
 */
export async function sendOrderConfirmationEmail(
  to: string,
  props: OrderConfirmationEmailProps
) {
  const { html, text } = getOrderConfirmationTemplate(props);
  return sendWithFallback({
    to,
    subject: `Order #${props.orderNumber} Confirmed — ọjà. Escrow`,
    html,
    text,
  });
}

/**
 * Send new order alert to vendor
 */
export async function sendVendorOrderNotificationEmail(
  to: string,
  props: VendorNotificationEmailProps
) {
  const { html, text } = getVendorNotificationTemplate(props);
  return sendWithFallback({
    to,
    subject: `New Order #${props.orderNumber} Received — ${props.storeName}`,
    html,
    text,
  });
}

/**
 * Send vendor application status update (Approved, Rejected, Info Requested)
 */
export async function sendVendorStatusEmail(
  to: string,
  props: VendorStatusEmailProps
) {
  const subjectMap: Record<string, string> = {
    APPROVED: `Congratulations! Your store ${props.storeName} is approved — ọjà.`,
    REJECTED: `Update on your ọjà. vendor application for ${props.storeName}`,
    SUSPENDED: `Important notice regarding your ọjà. vendor account`,
    INFO_REQUESTED: `Action required: More information needed for ${props.storeName}`,
  };

  const { html, text } = getVendorStatusTemplate(props);
  return sendWithFallback({
    to,
    subject: subjectMap[props.status] || `ọjà. Vendor Application Update`,
    html,
    text,
  });
}

/**
 * Send password reset email with secure link
 */
export async function sendPasswordResetEmail(
  to: string,
  props: PasswordResetEmailProps
) {
  const { html, text } = getPasswordResetTemplate(props);
  return sendWithFallback({
    to,
    subject: `Reset your ọjà. password`,
    html,
    text,
  });
}

/**
 * Send email address verification email (with 6-digit code & link)
 */
export async function sendEmailVerificationEmail(
  to: string,
  props: EmailVerificationEmailProps
) {
  const { html, text } = getEmailVerificationTemplate(props);
  return sendWithFallback({
    to,
    subject: `Verify your email address — ọjà.`,
    html,
    text,
  });
}

/**
 * Send 6-digit verification code & link email (alias)
 */
export async function sendVerifyEmail(
  to: string,
  props: VerifyEmailProps
) {
  const { html, text } = getEmailVerificationTemplate(props);
  return sendWithFallback({
    to,
    subject: `Verify your email address — ọjà.`,
    html,
    text,
  });
}

/**
 * Send welcome email upon initial sign-in / registration
 */
export async function sendWelcomeEmail(
  to: string,
  props: WelcomeEmailProps
) {
  const { html, text } = getWelcomeTemplate(props);
  return sendWithFallback({
    to,
    subject: `Welcome to ọjà., ${props.userName || "Campus Member"}! 🎓🛍️`,
    html,
    text,
  });
}

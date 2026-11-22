import { Resend } from "resend";
import { OrderConfirmationEmail, OrderConfirmationEmailProps } from "@/emails/OrderConfirmationEmail";
import { VendorNotificationEmail, VendorNotificationEmailProps } from "@/emails/VendorNotificationEmail";
import { VendorStatusEmail, VendorStatusEmailProps } from "@/emails/VendorStatusEmail";
import { PasswordResetEmail, PasswordResetEmailProps } from "@/emails/PasswordResetEmail";
import { EmailVerificationEmail, EmailVerificationEmailProps } from "@/emails/EmailVerificationEmail";
import { WelcomeEmail, WelcomeEmailProps } from "@/emails/WelcomeEmail";
import { VerifyEmail, VerifyEmailProps } from "@/emails/VerifyEmail";

const resendApiKey = process.env.RESEND_API_KEY;
// Uses the verified custom domain xn--j-sfa590u.com (ọjà.com) on Resend for safe inbox delivery
const fromEmail = process.env.EMAIL_FROM || "ọjà. <notifications@xn--j-sfa590u.com>";
const fallbackFromEmail = "notifications@xn--j-sfa590u.com";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Send order confirmation to the student buyer
 */
export async function sendOrderConfirmationEmail(
  to: string,
  props: OrderConfirmationEmailProps
) {
  if (!resend) {
    console.log(`[Email Simulated] Order confirmation for #${props.orderNumber} sent to ${to}`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to,
      subject: `Order #${props.orderNumber} Confirmed — ọjà. Escrow`,
      react: OrderConfirmationEmail(props),
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Failed to send order confirmation email:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send new order alert to vendor
 */
export async function sendVendorOrderNotificationEmail(
  to: string,
  props: VendorNotificationEmailProps
) {
  if (!resend) {
    console.log(`[Email Simulated] Vendor notification for #${props.orderNumber} sent to ${to}`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to,
      subject: `New Order #${props.orderNumber} Received — ${props.storeName}`,
      react: VendorNotificationEmail(props),
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Failed to send vendor order notification email:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send vendor application status update (Approved, Rejected, Info Requested)
 */
export async function sendVendorStatusEmail(
  to: string,
  props: VendorStatusEmailProps
) {
  if (!resend) {
    console.log(`[Email Simulated] Vendor status update (${props.status}) sent to ${to}`);
    return { success: true, simulated: true };
  }

  const subjectMap = {
    APPROVED: `Congratulations! Your store ${props.storeName} is approved — ọjà.`,
    REJECTED: `Update on your ọjà. vendor application for ${props.storeName}`,
    SUSPENDED: `Important notice regarding your ọjà. vendor account`,
    INFO_REQUESTED: `Action required: More information needed for ${props.storeName}`,
  };

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to,
      subject: subjectMap[props.status] || `ọjà. Vendor Application Update`,
      react: VendorStatusEmail(props),
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Failed to send vendor status email:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset email with secure link
 */
export async function sendPasswordResetEmail(
  to: string,
  props: PasswordResetEmailProps
) {
  if (!resend) {
    console.log(`[Email Simulated] Password reset link for ${to}: ${props.resetUrl}`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to,
      subject: `Reset your ọjà. password`,
      react: PasswordResetEmail(props),
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Failed to send password reset email:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send email address verification email
 */
export async function sendEmailVerificationEmail(
  to: string,
  props: EmailVerificationEmailProps
) {
  if (!resend) {
    console.log(`[Email Simulated] Email verification for ${to}: code=${props.verificationCode}, link=${props.verifyUrl}`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to,
      subject: `Verify your email address — ọjà.`,
      react: EmailVerificationEmail(props),
    });

    return { success: true, data };
  } catch (error: any) {
    console.warn("[Resend Primary Error]", error?.message);
    try {
      const fallbackData = await resend.emails.send({
        from: fallbackFromEmail,
        to,
        subject: `Verify your email address — ọjà.`,
        react: EmailVerificationEmail(props),
      });
      return { success: true, data: fallbackData };
    } catch (fallbackError: any) {
      console.error("[Resend Fallback Error]:", fallbackError?.message);
      return { success: false, error: fallbackError?.message || error?.message };
    }
  }
}

/**
 * Send 6-digit verification code & link email
 */
export async function sendVerifyEmail(
  to: string,
  props: VerifyEmailProps
) {
  if (!resend) {
    console.log(`[Email Simulated] Verification email for ${to}: code=${props.verificationCode}, link=${props.verifyUrl}`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to,
      subject: `Verify your email address — ọjà.`,
      react: VerifyEmail(props),
    });

    return { success: true, data };
  } catch (error: any) {
    console.warn("[Resend Primary Error]", error?.message);
    try {
      const fallbackData = await resend.emails.send({
        from: fallbackFromEmail,
        to,
        subject: `Verify your email address — ọjà.`,
        react: VerifyEmail(props),
      });
      return { success: true, data: fallbackData };
    } catch (fallbackError: any) {
      console.error("[Resend Fallback Error]:", fallbackError?.message);
      return { success: false, error: fallbackError?.message || error?.message };
    }
  }
}

/**
 * Send welcome email upon initial sign-in / registration
 */
export async function sendWelcomeEmail(
  to: string,
  props: WelcomeEmailProps
) {
  if (!resend) {
    console.log(`[Email Simulated] Welcome email for ${to} (${props.userRole || "BUYER"})`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to,
      subject: `Welcome to ọjà., ${props.userName || "Campus Member"}! 🎓🛍️`,
      react: WelcomeEmail(props),
    });

    return { success: true, data };
  } catch (error: any) {
    console.warn("[Resend Primary Error]", error?.message);
    try {
      const fallbackData = await resend.emails.send({
        from: fallbackFromEmail,
        to,
        subject: `Welcome to ọjà., ${props.userName || "Campus Member"}! 🎓🛍️`,
        react: WelcomeEmail(props),
      });
      return { success: true, data: fallbackData };
    } catch (fallbackError: any) {
      console.error("[Resend Fallback Error]:", fallbackError?.message);
      return { success: false, error: fallbackError?.message || error?.message };
    }
  }
}

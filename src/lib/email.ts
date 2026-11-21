import { Resend } from "resend";
import { OrderConfirmationEmail, OrderConfirmationEmailProps } from "@/emails/OrderConfirmationEmail";
import { VendorNotificationEmail, VendorNotificationEmailProps } from "@/emails/VendorNotificationEmail";
import { VendorStatusEmail, VendorStatusEmailProps } from "@/emails/VendorStatusEmail";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.EMAIL_FROM || "ọjà <notifications@campustrade.ng>";

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
      subject: `Order #${props.orderNumber} Confirmed — ọjà Escrow`,
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
    APPROVED: `Congratulations! Your store ${props.storeName} is approved — ọjà`,
    REJECTED: `Update on your ọjà vendor application for ${props.storeName}`,
    SUSPENDED: `Important notice regarding your ọjà vendor account`,
    INFO_REQUESTED: `Action required: More information needed for ${props.storeName}`,
  };

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to,
      subject: subjectMap[props.status] || `ọjà Vendor Application Update`,
      react: VendorStatusEmail(props),
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Failed to send vendor status email:", error);
    return { success: false, error: error.message };
  }
}

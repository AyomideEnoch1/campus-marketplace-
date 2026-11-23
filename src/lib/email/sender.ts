import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const primaryFromEmail =
  process.env.EMAIL_FROM || '"ọjà." <notifications@xn--j-sfa590u.com>';
const fallbackFromEmail = "notifications@xn--j-sfa590u.com";
const replyToEmail = process.env.EMAIL_REPLY_TO || "support@xn--j-sfa590u.com";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Low-level email sender that sends through Resend with fallback handling,
 * deliverability headers, and simulated sandbox support.
 */
export async function sendEmailDirect(
  payload: SendEmailPayload
): Promise<SendEmailResult> {
  const isDevOrTest =
    process.env.NODE_ENV !== "production" || process.env.EMAIL_DRIVER === "log";

  if (!resend) {
    console.log(
      `[Email Driver: Simulated] to=${payload.to}, subject="${payload.subject}"`
    );
    return {
      success: true,
      messageId: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      simulated: true,
    };
  }

  const customHeaders = {
    "X-Entity-Ref-ID": `oja-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...payload.headers,
  };

  try {
    const res = await resend.emails.send({
      from: primaryFromEmail,
      to: payload.to,
      replyTo: payload.replyTo || replyToEmail,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      headers: customHeaders,
    });

    if (res.error) {
      console.warn(`[Resend Primary Error] Attempting plain from-fallback:`, res.error);

      // Attempt fallback with unquoted plain sender address
      const fallbackRes = await resend.emails.send({
        from: fallbackFromEmail,
        to: payload.to,
        replyTo: payload.replyTo || replyToEmail,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        headers: customHeaders,
      });

      if (fallbackRes.error) {
        return {
          success: false,
          error: fallbackRes.error.message || "Failed to send email via fallback address",
        };
      }

      return {
        success: true,
        messageId: fallbackRes.data?.id,
      };
    }

    return {
      success: true,
      messageId: res.data?.id,
    };
  } catch (err: any) {
    console.error("[Email Exception Error]:", err?.message || err);
    try {
      const fallbackRes = await resend.emails.send({
        from: fallbackFromEmail,
        to: payload.to,
        replyTo: payload.replyTo || replyToEmail,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        headers: customHeaders,
      });
      if (fallbackRes.error) {
        return { success: false, error: fallbackRes.error.message };
      }
      return { success: true, messageId: fallbackRes.data?.id };
    } catch (fallbackErr: any) {
      return {
        success: false,
        error: fallbackErr?.message || err?.message || "Unknown email transport error",
      };
    }
  }
}

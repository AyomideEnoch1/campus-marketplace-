/**
 * Master HTML & Plain Text Layout Wrapper for ọjà Email Notifications
 */

export const BRAND_NAME = "ọjà.";
export const BRAND_COLOR = "#10b981"; // Emerald
export const BRAND_DARK = "#0f172a"; // Slate 900
export const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://xn--j-sfa590u.com";
export const SUPPORT_EMAIL = "support@xn--j-sfa590u.com";

/**
 * Format amount as Nigerian Naira (NGN)
 */
export function formatNaira(amount: number = 0): string {
  return `₦${Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format date in Nigeria Standard Time (WAT / UTC+1)
 */
export function formatDateTime(date: Date | string = new Date()): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString("en-NG", {
      timeZone: "Africa/Lagos",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return String(date);
  }
}

export interface BaseWrapperOptions {
  title: string;
  preheader: string;
  contentHtml: string;
  isMarketing?: boolean;
  unsubscribeUrl?: string;
  supportUrl?: string;
}

export function baseEmailWrapper({
  title,
  preheader,
  contentHtml,
  isMarketing = false,
  unsubscribeUrl,
  supportUrl = `${APP_BASE_URL}/support`,
}: BaseWrapperOptions): string {
  const currentYear = new Date().getFullYear();

  const footerNotice = isMarketing
    ? `
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
        You received this email because you opted into updates from ${BRAND_NAME}.
        ${
          unsubscribeUrl
            ? `<br><a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: underline;">Unsubscribe or manage preferences</a>`
            : ""
        }
      </p>
    `
    : `
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
        This is an automated transactional security notice regarding your ${BRAND_NAME} account. Replies to this email address are not monitored.
      </p>
    `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 12px !important; }
      .email-card { border-radius: 12px !important; }
      .email-body { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <!-- Preheader text for inbox preview -->
  <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0; color: transparent; mso-hide: all;">
    ${preheader}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f8fafc; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="email-container" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%); border-bottom: 1px solid #f1f5f9; text-align: center;">
              <a href="${APP_BASE_URL}" target="_blank" style="text-decoration: none; display: inline-block;">
                <div style="font-size: 32px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; margin: 0; line-height: 1.1;">
                  ọ<span style="color: ${BRAND_COLOR};">jà.</span>
                </div>
              </a>
              <div style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.8px; text-transform: uppercase; margin-top: 6px;">
                Verified Student Campus Marketplace &bull; Escrow Protected
              </div>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td class="email-body" style="padding: 32px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              ${footerNotice}
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">
                &copy; ${currentYear} ${BRAND_NAME} Built exclusively for Nigerian higher education institutions.
              </p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #cbd5e1;">
                Need help? Contact <a href="mailto:${SUPPORT_EMAIL}" style="color: #10b981; text-decoration: none;">${SUPPORT_EMAIL}</a> or visit <a href="${supportUrl}" style="color: #10b981; text-decoration: none;">Help Center</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

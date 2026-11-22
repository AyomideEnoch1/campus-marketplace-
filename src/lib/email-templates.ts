/**
 * HTML and Plain Text email templates for ọjà.
 * Built with rock-solid inline CSS compatible with Gmail, Apple Mail, Outlook, and mobile clients.
 * Avoids any React runtime dependencies or serverless bundling errors.
 */

const BRAND_NAME = "ọjà.";
const BRAND_COLOR = "#10b981"; // Emerald
const BRAND_DARK = "#0f172a"; // Slate 900
const BASE_URL = "https://xn--j-sfa590u.com";

function baseEmailWrapper({
  title,
  preheader,
  contentHtml,
}: {
  title: string;
  preheader: string;
  contentHtml: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <!-- Preheader text for inbox preview -->
  <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0; color: transparent;">
    ${preheader}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%); border-bottom: 1px solid #f1f5f9; text-align: center;">
              <div style="font-size: 32px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a; margin: 0;">
                ọ<span style="color: ${BRAND_COLOR};">jà.</span>
              </div>
              <div style="font-size: 13px; font-weight: 600; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 4px;">
                Campus Marketplace &bull; Safe &bull; Escrow Protected
              </div>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; font-weight: 500;">
                &copy; ${new Date().getFullYear()} ${BRAND_NAME} Built exclusively for Nigerian campus students.
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                Safe meetups &bull; Verified student vendors &bull; Zero scam escrow protection
              </p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #cbd5e1;">
                This is an automated security notice. Please do not reply directly to this email.
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

/**
 * 1. Email Verification Template (with 6-digit code & link)
 */
export function getEmailVerificationTemplate({
  userName = "Student",
  verificationCode,
  verifyUrl,
}: {
  userName?: string;
  verificationCode?: string;
  verifyUrl: string;
}) {
  const codeBox = verificationCode
    ? `
      <div style="margin: 28px 0; padding: 24px; background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; text-align: center;">
        <div style="font-size: 12px; font-weight: 700; color: #047857; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px;">
          Your 6-Digit Verification Code
        </div>
        <div style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #065f46; font-family: 'Courier New', Courier, monospace; margin: 8px 0;">
          ${verificationCode}
        </div>
        <div style="font-size: 13px; color: #059669; font-weight: 500;">
          Enter this code on the verification screen to activate your account
        </div>
      </div>
    `
    : "";

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a;">
      Verify your email address ✉️
    </h1>
    
    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #334155;">
      Hello <strong>${userName}</strong>,
    </p>

    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #334155;">
      Welcome to <strong>${BRAND_NAME}</strong>, the verified student campus marketplace. To complete your registration and secure your student account, please verify your email address.
    </p>

    ${codeBox}

    <div style="text-align: center; margin: 28px 0;">
      <a href="${verifyUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);">
        Verify My Email Address
      </a>
    </div>

    <p style="margin: 24px 0 16px 0; font-size: 13px; line-height: 20px; color: #64748b;">
      ⏱️ This 6-digit code and verification link will expire in <strong>24 hours</strong>. If you did not create an account on ${BRAND_NAME}, you can safely disregard this email.
    </p>

    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; word-break: break-all;">
      If the button above does not work, copy and paste this link into your browser:<br>
      <a href="${verifyUrl}" style="color: #10b981; text-decoration: underline;">${verifyUrl}</a>
    </div>
  `;

  const html = baseEmailWrapper({
    title: `Verify your email address — ${BRAND_NAME}`,
    preheader: `Your ${BRAND_NAME} 6-digit verification code is ${verificationCode || ""}. Complete your setup now.`,
    contentHtml,
  });

  const text = `Verify your email address — ${BRAND_NAME}

Hello ${userName},

Welcome to ${BRAND_NAME}, Nigeria's leading student campus marketplace!

${
  verificationCode
    ? `YOUR 6-DIGIT VERIFICATION CODE: ${verificationCode}\n\nEnter this code on the verification screen to activate your account.\n`
    : ""
}
Or verify directly using this link:
${verifyUrl}

This code and link will expire in 24 hours. If you did not register on ${BRAND_NAME}, please ignore this email.

© ${new Date().getFullYear()} ${BRAND_NAME}`;

  return { html, text };
}

/**
 * 2. Welcome Email Template
 */
export function getWelcomeTemplate({
  userName = "Campus Member",
  userRole = "BUYER",
  dashboardUrl,
  exploreUrl,
}: {
  userName?: string;
  userRole?: string;
  dashboardUrl?: string;
  exploreUrl?: string;
}) {
  const isVendor = userRole === "VENDOR";
  const targetUrl = dashboardUrl || exploreUrl || (isVendor ? `${BASE_URL}/vendor` : `${BASE_URL}/shop`);

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a;">
      Welcome to ${BRAND_NAME}! 🎓🛍️
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #334155;">
      Hello <strong>${userName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 24px; color: #334155;">
      We're thrilled to have you join <strong>${BRAND_NAME}</strong>, the premier campus marketplace built specifically for Nigerian university and polytechnic students!
    </p>

    <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
      <div style="font-weight: 700; color: #0f172a; margin-bottom: 8px; font-size: 14px;">
        Here is what makes ${BRAND_NAME} different:
      </div>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 22px; color: #475569;">
        <li><strong>Escrow Protection:</strong> Funds are only released to vendors once you inspect and confirm your order in person.</li>
        <li><strong>Safe Campus Meetup Spots:</strong> Exchange goods at recognized high-traffic campus landmarks.</li>
        <li><strong>Student-Friendly Prices:</strong> Buy and sell directly with students and verified campus vendors.</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${targetUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);">
        ${isVendor ? "Go to Vendor Dashboard" : "Start Exploring Campus Deals"}
      </a>
    </div>

    <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 20px; color: #64748b;">
      Need any assistance? Reach out to our campus ambassadors or support team anytime. Happy trading!
    </p>
  `;

  const html = baseEmailWrapper({
    title: `Welcome to ${BRAND_NAME}, ${userName}!`,
    preheader: `Welcome to ${BRAND_NAME}! Discover student deals, safe campus meetups, and escrow protection.`,
    contentHtml,
  });

  const text = `Welcome to ${BRAND_NAME}, ${userName}! 🎓🛍️

Hello ${userName},

We're thrilled to have you join ${BRAND_NAME}, the verified campus marketplace built for Nigerian university students!

What makes ${BRAND_NAME} safe:
- Escrow Protection: Funds released only after delivery confirmation.
- Safe Campus Meetup Zones: Exchange items at monitored campus landmarks.
- Direct student deals & verified campus vendors.

Get started: ${targetUrl}

© ${new Date().getFullYear()} ${BRAND_NAME}`;

  return { html, text };
}

/**
 * 3. Password Reset Template
 */
export function getPasswordResetTemplate({
  userName = "Student",
  resetUrl,
}: {
  userName?: string;
  resetUrl: string;
}) {
  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a;">
      Reset your password 🔐
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #334155;">
      Hello <strong>${userName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 24px; color: #334155;">
      We received a request to reset your password for your <strong>${BRAND_NAME}</strong> account. Click the button below to choose a new password.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${resetUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);">
        Reset Password
      </a>
    </div>

    <p style="margin: 24px 0 16px 0; font-size: 13px; line-height: 20px; color: #64748b;">
      ⏱️ This link is valid for <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email—your account remains completely secure.
    </p>

    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; word-break: break-all;">
      Or copy and paste this link into your browser:<br>
      <a href="${resetUrl}" style="color: #10b981; text-decoration: underline;">${resetUrl}</a>
    </div>
  `;

  const html = baseEmailWrapper({
    title: `Reset your ${BRAND_NAME} password`,
    preheader: `Click here to reset your ${BRAND_NAME} account password securely.`,
    contentHtml,
  });

  const text = `Reset your password — ${BRAND_NAME}

Hello ${userName},

We received a request to reset your password for ${BRAND_NAME}.
Reset your password here: ${resetUrl}

This link is valid for 1 hour. If you didn't request this, ignore this email.

© ${new Date().getFullYear()} ${BRAND_NAME}`;

  return { html, text };
}

/**
 * 4. Order Confirmation Template
 */
export function getOrderConfirmationTemplate({
  buyerName,
  customerName,
  orderNumber,
  items = [],
  totalAmount = 0,
  deliveryCode,
  verificationCode,
  meetupPoint,
  campusName,
}: {
  buyerName?: string;
  customerName?: string;
  orderNumber: string;
  items?: Array<{ title?: string; name?: string; quantity: number; price: number }>;
  totalAmount?: number;
  deliveryCode?: string;
  verificationCode?: string;
  meetupPoint?: string;
  campusName?: string;
}) {
  const recipientName = buyerName || customerName || "Student";
  const code = deliveryCode || verificationCode;
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155;">
          ${item.title || item.name || "Item"} &times; ${item.quantity}
        </td>
        <td align="right" style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #0f172a;">
          ₦${(item.price * item.quantity).toLocaleString()}
        </td>
      </tr>
    `
    )
    .join("");

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a;">
      Order Confirmed #${orderNumber} 🎉
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #334155;">
      Hello <strong>${recipientName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 24px; color: #334155;">
      Your order has been received and your payment is safely held in <strong>${BRAND_NAME} Escrow</strong>. The vendor has been notified to prepare your items.
    </p>

    ${
      code
        ? `
        <div style="margin: 20px 0; padding: 16px; background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; text-align: center;">
          <div style="font-size: 12px; font-weight: 700; color: #047857; text-transform: uppercase;">
            Delivery Confirmation Code
          </div>
          <div style="font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #065f46; margin: 6px 0;">
            ${code}
          </div>
          <div style="font-size: 12px; color: #059669;">
            Only give this code to the vendor AFTER you inspect and receive your item!
          </div>
        </div>
      `
        : ""
    }

    <div style="margin: 24px 0; background-color: #f8fafc; border-radius: 8px; padding: 16px;">
      <div style="font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">
        Order Summary
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        ${itemsHtml}
        <tr>
          <td style="padding-top: 12px; font-size: 15px; font-weight: 700; color: #0f172a;">Total</td>
          <td align="right" style="padding-top: 12px; font-size: 16px; font-weight: 800; color: #10b981;">
            ₦${totalAmount.toLocaleString()}
          </td>
        </tr>
      </table>
    </div>

    ${
      meetupPoint || campusName
        ? `
      <div style="font-size: 13px; color: #475569; margin-bottom: 20px; line-height: 20px;">
        📍 <strong>Meetup Location:</strong> ${meetupPoint || "Campus Meetup Zone"} ${campusName ? `(${campusName})` : ""}
      </div>
    `
        : ""
    }

    <p style="margin: 20px 0 0 0; font-size: 13px; line-height: 20px; color: #64748b;">
      Thank you for shopping safely on ${BRAND_NAME}!
    </p>
  `;

  const html = baseEmailWrapper({
    title: `Order #${orderNumber} Confirmed — ${BRAND_NAME}`,
    preheader: `Your order #${orderNumber} is confirmed! Total: ₦${totalAmount.toLocaleString()}`,
    contentHtml,
  });

  const text = `Order #${orderNumber} Confirmed — ${BRAND_NAME}

Hello ${recipientName},

Your order #${orderNumber} has been confirmed.
Total: ₦${totalAmount.toLocaleString()}
${code ? `Confirmation Code: ${code}\n(Provide to vendor ONLY after inspecting goods)` : ""}
Meetup: ${meetupPoint || "Campus Meetup Zone"}

© ${new Date().getFullYear()} ${BRAND_NAME}`;

  return { html, text };
}

/**
 * 5. Vendor Application Status Template
 */
export function getVendorStatusTemplate({
  storeName,
  applicantName,
  vendorName,
  status,
  rejectionReason,
  tier,
  dashboardUrl = `${BASE_URL}/vendor`,
  notes,
}: {
  storeName: string;
  applicantName?: string;
  vendorName?: string;
  status: "APPROVED" | "REJECTED" | "SUSPENDED" | "INFO_REQUESTED" | string;
  rejectionReason?: string;
  tier?: number;
  dashboardUrl?: string;
  notes?: string;
}) {
  const recipientName = applicantName || vendorName || "Vendor";
  const isApproved = status === "APPROVED";
  const noteContent = notes || rejectionReason;

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a;">
      ${isApproved ? "Congratulations! Your store is approved! 🚀" : `Vendor Application Update — ${storeName}`}
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #334155;">
      Hello <strong>${recipientName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 24px; color: #334155;">
      ${
        isApproved
          ? `Your vendor application for <strong>${storeName}</strong> has been approved by the ${BRAND_NAME} administration team. You are now officially verified to sell on campus${tier ? ` (Tier ${tier})` : ""}!`
          : `There is an update regarding your vendor application for <strong>${storeName}</strong>: status is <strong>${status}</strong>.`
      }
    </p>

    ${
      noteContent
        ? `
      <div style="background-color: #f1f5f9; padding: 14px; border-radius: 8px; font-size: 13px; color: #475569; margin-bottom: 20px;">
        <strong>Details / Feedback:</strong> ${noteContent}
      </div>
    `
        : ""
    }

    <div style="text-align: center; margin: 28px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);">
        Access Vendor Dashboard
      </a>
    </div>
  `;

  const html = baseEmailWrapper({
    title: `Vendor Application: ${storeName} — ${BRAND_NAME}`,
    preheader: `Vendor application status for ${storeName} on ${BRAND_NAME}.`,
    contentHtml,
  });

  const text = `Vendor Application Update — ${BRAND_NAME}

Hello ${recipientName},

Store: ${storeName}
Status: ${status}
${noteContent ? `Notes: ${noteContent}\n` : ""}
Vendor Dashboard: ${dashboardUrl}

© ${new Date().getFullYear()} ${BRAND_NAME}`;

  return { html, text };
}

/**
 * 6. Vendor Order Notification Template
 */
export function getVendorNotificationTemplate({
  storeName,
  orderNumber,
  vendorName,
  buyerName,
  buyerPhone,
  items = [],
  payoutAmount,
  totalAmount,
  meetupPoint,
  campusName,
  dashboardUrl = `${BASE_URL}/vendor/orders`,
}: {
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
}) {
  const recipientName = vendorName || storeName;
  const amount = payoutAmount || totalAmount || 0;

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a;">
      New Order #${orderNumber} Received! 🛍️
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #334155;">
      Hello <strong>${recipientName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 24px; color: #334155;">
      Great news! A new student order has been placed for your store. ${amount ? `Payment of <strong>₦${amount.toLocaleString()}</strong> is securely held in escrow.` : `Payment is securely held in escrow.`}
    </p>

    ${
      buyerName
        ? `
      <p style="font-size: 14px; color: #475569; margin-bottom: 12px;">
        Buyer: <strong>${buyerName}</strong> ${buyerPhone ? `(${buyerPhone})` : ""}
      </p>
    `
        : ""
    }

    <div style="text-align: center; margin: 28px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);">
        View Order in Dashboard
      </a>
    </div>
  `;

  const html = baseEmailWrapper({
    title: `New Order #${orderNumber} Received — ${storeName}`,
    preheader: `You have received a new order #${orderNumber} on ${BRAND_NAME}.`,
    contentHtml,
  });

  const text = `New Order #${orderNumber} Received — ${storeName}

Hello ${recipientName},

You have a new order #${orderNumber}.
${amount ? `Payout: ₦${amount.toLocaleString()}\n` : ""}
Meetup: ${meetupPoint || "Campus Meetup Zone"} ${campusName ? `(${campusName})` : ""}
Dashboard: ${dashboardUrl}

© ${new Date().getFullYear()} ${BRAND_NAME}`;

  return { html, text };
}

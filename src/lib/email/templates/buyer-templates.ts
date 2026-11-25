import {
  baseEmailWrapper,
  BRAND_NAME,
  BRAND_COLOR,
  APP_BASE_URL,
  SUPPORT_EMAIL,
  formatNaira,
  formatDateTime,
} from "./base";
import { RenderedEmail } from "./types";

export interface BuyerWelcomeProps {
  userName: string;
  exploreUrl?: string;
}

export function renderBuyerWelcome(props: BuyerWelcomeProps): RenderedEmail {
  const userName =
    props.userName && props.userName !== "undefined" && props.userName !== "null"
      ? props.userName
      : "Campus Student";
  const exploreUrl = props.exploreUrl || `${APP_BASE_URL}/shop`;
  const subject = `Welcome to ọjà, ${userName}! 🎓🛍️`;
  const preheader = `Welcome to ọjà! Safe campus trading with escrow protection, verified student vendors, and no scams.`;

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      Welcome to ${BRAND_NAME}! 🎓
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Hello <strong>${userName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 22px; color: #334155;">
      We're thrilled to welcome you to Nigeria's dedicated student campus marketplace. Here, you can buy textbooks, laptops, phones, dorm essentials, fashion, and food from verified campus peers without fear of scams.
    </p>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <div style="font-weight: 700; color: #166534; font-size: 13px; margin-bottom: 8px;">The ọjà Escrow Guarantee:</div>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 22px; color: #15803d;">
        <li><strong>Money-back protection:</strong> When you place an order, your money is securely locked in escrow.</li>
        <li><strong>Inspect first:</strong> You only give your 6-digit confirmation code to the seller after inspecting your items in person.</li>
        <li><strong>Zero transaction fees for buyers:</strong> What you see is what you pay.</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${exploreUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;">
        Explore Campus Listings &rarr;
      </a>
    </div>
  `;

  const html = baseEmailWrapper({ title: subject, preheader, contentHtml });
  const text = `${subject}\n\nHello ${userName},\nWelcome to ${BRAND_NAME}! Shop safe on campus: ${exploreUrl}`;
  return { subject, html, text };
}

export interface BuyerEmailVerificationProps {
  userName: string;
  verificationCode: string;
  verifyUrl: string;
}

export function renderBuyerEmailVerification(
  props: BuyerEmailVerificationProps
): RenderedEmail {
  const rawName = props.userName || (props as any).fullName;
  const userName =
    rawName && rawName !== "undefined" && rawName !== "null"
      ? rawName
      : "Campus Student";

  const rawCode = props.verificationCode || (props as any).code;
  const code =
    rawCode && rawCode !== "undefined" && rawCode !== "null"
      ? String(rawCode)
      : "";

  const rawUrl = props.verifyUrl || (props as any).url;
  const verifyUrl =
    rawUrl && rawUrl !== "undefined" && rawUrl !== "null"
      ? rawUrl
      : `${APP_BASE_URL}/auth/verify-email`;

  const subject = `Verify your email address — ${BRAND_NAME}`;
  const preheader = code
    ? `Your 6-digit confirmation code is ${code}. Complete your account verification.`
    : `Complete your account verification on ${BRAND_NAME}.`;

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      Verify Your Email Address ✉️
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Hello <strong>${userName}</strong>,
    </p>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Please confirm your email to activate all features of your ${BRAND_NAME} student account:
    </p>

    ${
      code
        ? `
    <div style="margin: 24px 0; padding: 20px; background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; text-align: center;">
      <div style="font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 1px;">
        Your 6-Digit Code
      </div>
      <div style="font-size: 36px; font-weight: 900; letter-spacing: 6px; color: #065f46; font-family: monospace; margin: 8px 0;">
        ${code}
      </div>
      <div style="font-size: 12px; color: #059669;">
        Valid for 24 hours. Enter this on the verification screen.
      </div>
    </div>
    `
        : ""
    }

    <div style="text-align: center; margin: 24px 0;">
      <a href="${verifyUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;">
        Click to Verify Automatically &rarr;
      </a>
    </div>

    <p style="font-size: 12px; color: #94a3b8; text-align: center;">
      If you did not request this account, you can safely ignore this email.
    </p>
  `;

  const html = baseEmailWrapper({ title: subject, preheader, contentHtml });
  const text = `${subject}\n\n${code ? `Your code: ${code}\n` : ""}Click to verify: ${verifyUrl}`;
  return { subject, html, text };
}

export interface BuyerPasswordResetProps {
  userName: string;
  resetUrl: string;
}

export function renderBuyerPasswordReset(
  props: BuyerPasswordResetProps
): RenderedEmail {
  const subject = `Reset your password — ${BRAND_NAME}`;
  const preheader = `A password reset was requested for your ${BRAND_NAME} account.`;

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      Password Reset Request 🔐
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Hello <strong>${props.userName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 22px; color: #334155;">
      We received a request to reset the password for your ${BRAND_NAME} account. Click the button below to choose a new password:
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${props.resetUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;">
        Reset Password Now &rarr;
      </a>
    </div>

    <p style="font-size: 12px; line-height: 18px; color: #64748b;">
      ⏱️ This link will expire in <strong>1 hour</strong>. If you did not make this request, you can safely disregard this email—your account remains secure.
    </p>
  `;

  const html = baseEmailWrapper({ title: subject, preheader, contentHtml });
  const text = `${subject}\n\nReset your password: ${props.resetUrl}\nLink expires in 1 hour.`;
  return { subject, html, text };
}

export interface BuyerPasswordChangedProps {
  userName: string;
  changedAt?: string | Date;
}

export function renderBuyerPasswordChanged(
  props: BuyerPasswordChangedProps
): RenderedEmail {
  const subject = `Security Alert: Your ọjà password was changed`;
  const preheader = `Your account password was successfully updated.`;

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      Password Changed Successfully 🛡️
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Hello <strong>${props.userName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 22px; color: #334155;">
      This email confirms that the password for your ${BRAND_NAME} account was changed on <strong>${formatDateTime(
    props.changedAt || new Date()
  )}</strong>.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px; font-size: 13px; color: #475569;">
      If you made this change, no further action is required.
    </div>

    <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 14px; font-size: 13px; color: #9f1239;">
      ⚠️ <strong>Didn't make this change?</strong> Your account may be compromised. Please contact support immediately at <a href="mailto:${SUPPORT_EMAIL}" style="color: #be123c; font-weight: 700;">${SUPPORT_EMAIL}</a> to lock your account.
    </div>
  `;

  const html = baseEmailWrapper({ title: subject, preheader, contentHtml });
  const text = `${subject}\n\nHello ${props.userName},\nYour password was changed on ${formatDateTime(props.changedAt || new Date())}. If this wasn't you, email ${SUPPORT_EMAIL} immediately.`;
  return { subject, html, text };
}

export interface BuyerNewLoginProps {
  userName: string;
  device?: string;
  ipAddress?: string;
  loginTime?: string | Date;
}

export function renderBuyerNewLogin(props: BuyerNewLoginProps): RenderedEmail {
  const subject = `Security Notice: New sign-in to your ọjà account`;
  const preheader = `New login detected for your ${BRAND_NAME} account.`;

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      New Sign-In Detected 🔒
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Hello <strong>${props.userName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 22px; color: #334155;">
      We detected a sign-in to your ${BRAND_NAME} account with the following details:
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 13px; color: #334155; margin-bottom: 20px;">
      <div><strong>Time:</strong> ${formatDateTime(props.loginTime || new Date())}</div>
      ${props.device ? `<div><strong>Device / Browser:</strong> ${props.device}</div>` : ""}
      ${props.ipAddress ? `<div><strong>IP Address:</strong> ${props.ipAddress}</div>` : ""}
    </div>

    <p style="font-size: 12px; color: #64748b;">
      If this was you, you can ignore this alert. If you don't recognize this sign-in, please reset your password immediately.
    </p>
  `;

  const html = baseEmailWrapper({ title: subject, preheader, contentHtml });
  const text = `${subject}\n\nNew sign-in detected for ${props.userName} on ${formatDateTime(props.loginTime || new Date())}.`;
  return { subject, html, text };
}

export interface BuyerOrderConfirmationProps {
  orderNumber: string;
  buyerName: string;
  items: Array<{ title: string; quantity: number; price: number }>;
  totalAmount: number;
  deliveryCode: string;
  meetupPoint?: string;
  campusName?: string;
  orderUrl?: string;
}

export function renderBuyerOrderConfirmation(
  props: BuyerOrderConfirmationProps
): RenderedEmail {
  const orderUrl = props.orderUrl || `${APP_BASE_URL}/orders`;
  const subject = `🎉 Order #${props.orderNumber} Confirmed — Escrow Protected`;
  const preheader = `Your order #${props.orderNumber} is confirmed! Your handover code is ${props.deliveryCode}.`;

  const itemsHtml = props.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155;">
        ${item.title} &times; ${item.quantity}
      </td>
      <td align="right" style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #0f172a;">
        ${formatNaira(item.price * item.quantity)}
      </td>
    </tr>
  `
    )
    .join("");

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      Order Confirmed #${props.orderNumber} 🎉
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Hello <strong>${props.buyerName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Your order has been received and your payment of <strong>${formatNaira(
    props.totalAmount
  )}</strong> is held safely in <strong>${BRAND_NAME} Escrow</strong>. The seller has been alerted to prepare your items.
    </p>

    <!-- CRITICAL CODE BOX -->
    <div style="margin: 24px 0; padding: 20px; background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; text-align: center;">
      <div style="font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 1px;">
        Your In-Person Handover Code
      </div>
      <div style="font-size: 36px; font-weight: 900; letter-spacing: 6px; color: #065f46; font-family: monospace; margin: 8px 0;">
        ${props.deliveryCode}
      </div>
      <div style="font-size: 12px; color: #059669; font-weight: 600;">
        🛑 ONLY give this code to the vendor AFTER you inspect your item in person!
      </div>
    </div>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Order Summary</div>
      <table width="100%" cellpadding="0" cellspacing="0">${itemsHtml}</table>
      <div style="text-align: right; padding-top: 12px; font-size: 16px; font-weight: 800; color: #10b981;">
        Total: ${formatNaira(props.totalAmount)}
      </div>
    </div>

    ${
      props.meetupPoint
        ? `
      <div style="font-size: 13px; color: #475569; margin-bottom: 24px;">
        📍 <strong>Designated Campus Meetup Point:</strong> ${props.meetupPoint} ${props.campusName ? `(${props.campusName})` : ""}
      </div>
    `
        : ""
    }

    <div style="text-align: center;">
      <a href="${orderUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;">
        Track Order &rarr;
      </a>
    </div>
  `;

  const html = baseEmailWrapper({ title: subject, preheader, contentHtml });
  const text = `${subject}\n\nOrder #${props.orderNumber}\nHandover Code: ${props.deliveryCode}\nTotal: ${formatNaira(props.totalAmount)}\nMeetup: ${props.meetupPoint || "Campus"}\nTrack: ${orderUrl}`;
  return { subject, html, text };
}

export interface BuyerOrderShippedProps {
  orderNumber: string;
  buyerName: string;
  storeName: string;
  deliveryCode: string;
  meetupPoint?: string;
  orderUrl?: string;
}

export function renderBuyerOrderShipped(
  props: BuyerOrderShippedProps
): RenderedEmail {
  const orderUrl = props.orderUrl || `${APP_BASE_URL}/orders`;
  const subject = `🚚 Order #${props.orderNumber} is Ready for Pickup / En Route!`;
  const preheader = `Vendor ${props.storeName} has prepared Order #${props.orderNumber} for delivery.`;

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      Your Order is Ready for Handover! 📦
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Hello <strong>${props.buyerName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Vendor <strong>${props.storeName}</strong> has prepared Order <strong>#${props.orderNumber}</strong>. You can now meet up to collect your item!
    </p>

    <div style="margin: 20px 0; padding: 16px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; text-align: center;">
      <div style="font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase;">Your Handover Code:</div>
      <div style="font-size: 32px; font-weight: 900; letter-spacing: 4px; color: #065f46; font-family: monospace; margin: 6px 0;">
        ${props.deliveryCode}
      </div>
      <div style="font-size: 12px; color: #15803d;">Inspect your item thoroughly before giving this code to the seller!</div>
    </div>

    ${
      props.meetupPoint
        ? `
      <div style="font-size: 13px; color: #475569; margin-bottom: 20px;">
        📍 <strong>Meetup Spot:</strong> ${props.meetupPoint}
      </div>
    `
        : ""
    }

    <div style="text-align: center;">
      <a href="${orderUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;">
        View Order Status &rarr;
      </a>
    </div>
  `;

  const html = baseEmailWrapper({ title: subject, preheader, contentHtml });
  const text = `${subject}\n\nOrder #${props.orderNumber} is ready from ${props.storeName}.\nCode: ${props.deliveryCode}\nMeetup: ${props.meetupPoint || "Campus"}\nTrack: ${orderUrl}`;
  return { subject, html, text };
}

export interface BuyerOrderDeliveredProps {
  orderNumber: string;
  buyerName: string;
  storeName: string;
  reviewUrl?: string;
}

export function renderBuyerOrderDelivered(
  props: BuyerOrderDeliveredProps
): RenderedEmail {
  const reviewUrl = props.reviewUrl || `${APP_BASE_URL}/orders`;
  const subject = `✅ Delivery Confirmed for Order #${props.orderNumber} — Thank You!`;
  const preheader = `Your order #${props.orderNumber} has been delivered and escrow funds released.`;

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      Order Delivered & Verified! 🎉
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Hello <strong>${props.buyerName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Your delivery code was successfully verified by <strong>${props.storeName}</strong> for Order <strong>#${props.orderNumber}</strong>. Escrow funds have been released to the vendor.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
      <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">How was your experience?</div>
      <p style="font-size: 13px; color: #64748b; margin: 0 0 14px 0;">Help other students know which vendors are reliable by rating your purchase.</p>
      <a href="${reviewUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 13px; font-weight: 700;">
        Leave a Review ⭐ &rarr;
      </a>
    </div>
  `;

  const html = baseEmailWrapper({ title: subject, preheader, contentHtml });
  const text = `${subject}\n\nOrder #${props.orderNumber} complete. Leave a review: ${reviewUrl}`;
  return { subject, html, text };
}

export interface BuyerDisputeRefundProps {
  orderNumber: string;
  buyerName: string;
  status: "OPENED" | "RESOLVED_REFUNDED" | "REJECTED";
  refundAmount?: number;
  reason?: string;
  notes?: string;
}

export function renderBuyerDisputeRefund(
  props: BuyerDisputeRefundProps
): RenderedEmail {
  const isRefunded = props.status === "RESOLVED_REFUNDED";
  const subject = isRefunded
    ? `💰 Refund Issued for Order #${props.orderNumber} (${formatNaira(props.refundAmount)})`
    : `Update on Dispute for Order #${props.orderNumber}`;
  const preheader = `Escrow dispute status update for Order #${props.orderNumber}.`;

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      ${isRefunded ? "Refund Processed Successfully! 💰" : "Dispute Status Update ⚖️"}
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Hello <strong>${props.buyerName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 22px; color: #334155;">
      ${
        isRefunded
          ? `Your dispute for Order <strong>#${props.orderNumber}</strong> was resolved in your favor. A refund of <strong>${formatNaira(
              props.refundAmount
            )}</strong> has been initiated back to your original payment method.`
          : `There is an update on your dispute for Order #${props.orderNumber}: status is <strong>${props.status}</strong>.`
      }
    </p>

    ${
      props.notes || props.reason
        ? `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 13px; color: #475569; margin: 16px 0;">
        <strong>Resolution Details:</strong> ${props.notes || props.reason}
      </div>
    `
        : ""
    }

    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_BASE_URL}/orders" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;">
        View My Orders &rarr;
      </a>
    </div>
  `;

  const html = baseEmailWrapper({ title: subject, preheader, contentHtml });
  const text = `${subject}\n\nOrder #${props.orderNumber}\nStatus: ${props.status}\n${props.refundAmount ? `Refund: ${formatNaira(props.refundAmount)}\n` : ""}`;
  return { subject, html, text };
}

export interface BuyerAbandonedCartProps {
  buyerName: string;
  items: Array<{ title: string; price: number }>;
  totalAmount: number;
  cartUrl?: string;
  unsubscribeUrl?: string;
}

export function renderBuyerAbandonedCart(
  props: BuyerAbandonedCartProps
): RenderedEmail {
  const cartUrl = props.cartUrl || `${APP_BASE_URL}/cart`;
  const subject = `Did you forget something? Your bag is waiting on ọjà 🛍️`;
  const preheader = `You left items in your cart on ${BRAND_NAME}. Complete checkout with campus escrow protection.`;

  const itemsHtml = props.items
    .slice(0, 3)
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155;">
        ${item.title}
      </td>
      <td align="right" style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #0f172a;">
        ${formatNaira(item.price)}
      </td>
    </tr>
  `
    )
    .join("");

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      Your Student Deals are Still in Your Bag! 🛒
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Hello <strong>${props.buyerName}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 22px; color: #334155;">
      We noticed you left some great campus listings in your shopping bag. Complete your purchase now before other students grab them!
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Items in Your Bag</div>
      <table width="100%" cellpadding="0" cellspacing="0">${itemsHtml}</table>
      <div style="text-align: right; padding-top: 12px; font-size: 15px; font-weight: 800; color: #10b981;">
        Subtotal: ${formatNaira(props.totalAmount)}
      </div>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${cartUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;">
        Complete Checkout in 2 Mins &rarr;
      </a>
    </div>
  `;

  const html = baseEmailWrapper({
    title: subject,
    preheader,
    contentHtml,
    isMarketing: true,
    unsubscribeUrl: props.unsubscribeUrl,
  });

  const text = `${subject}\n\nHello ${props.buyerName},\nYour cart is waiting: ${cartUrl}\nTotal: ${formatNaira(props.totalAmount)}`;
  return { subject, html, text };
}

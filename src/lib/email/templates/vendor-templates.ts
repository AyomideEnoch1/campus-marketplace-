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

export interface VendorRegistrationReceivedProps {
  storeName: string;
  vendorName: string;
  campusName?: string;
  dashboardUrl?: string;
}

export function renderVendorRegistrationReceived(
  props: VendorRegistrationReceivedProps
): RenderedEmail {
  const dashboardUrl = props.dashboardUrl || `${APP_BASE_URL}/dashboard`;
  const subject = `Application Received: Welcome to the ọjà Vendor Community! 🎓🏪`;
  const preheader = `We received your vendor registration for ${props.storeName}. Our admin team is reviewing your details.`;

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      We've Received Your Store Application! 🚀
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Hello <strong>${props.vendorName}</strong>,
    </p>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Thank you for applying to sell on <strong>${BRAND_NAME}</strong> with your storefront <strong>${props.storeName}</strong> ${props.campusName ? `(${props.campusName})` : ""}.
    </p>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <div style="font-weight: 700; color: #166534; font-size: 13px; text-transform: uppercase;">What Happens Next:</div>
      <ol style="margin: 8px 0 0 0; padding-left: 20px; font-size: 13px; line-height: 20px; color: #15803d;">
        <li>Our campus verification team validates your student ID or business registration (usually within 12-24 hours).</li>
        <li>In the meantime, you can sign in to your vendor dashboard, set up your store logo, and draft products.</li>
        <li>Once approved, your products become instantly visible to thousands of campus students!</li>
      </ol>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;">
        Open Vendor Dashboard &rarr;
      </a>
    </div>
  `;

  const html = baseEmailWrapper({ title: subject, preheader, contentHtml });
  const text = `${subject}\n\nHello ${props.vendorName},\nWe received your registration for ${props.storeName}. Our team is reviewing your documents.\nDashboard: ${dashboardUrl}`;
  return { subject, html, text };
}

export interface VendorStatusUpdateProps {
  storeName: string;
  vendorName: string;
  status: "APPROVED" | "REJECTED" | "SUSPENDED" | "REINSTATED" | "INFO_REQUESTED";
  reason?: string;
  appealSteps?: string;
  dashboardUrl?: string;
}

export function renderVendorStatusUpdate(
  props: VendorStatusUpdateProps
): RenderedEmail {
  const dashboardUrl = props.dashboardUrl || `${APP_BASE_URL}/dashboard`;
  const isApproved = props.status === "APPROVED";
  const isSuspended = props.status === "SUSPENDED";
  const isReinstated = props.status === "REINSTATED";
  const isRejected = props.status === "REJECTED";

  const subjectMap: Record<string, string> = {
    APPROVED: `🎉 Store Approved! Start Selling on ọjà — ${props.storeName}`,
    REJECTED: `Update on your ọjà Vendor Application — ${props.storeName}`,
    SUSPENDED: `⚠️ Action Required: Important notice regarding your ọjà vendor account`,
    REINSTATED: `✅ Your ọjà Vendor Account has been Reinstated — ${props.storeName}`,
    INFO_REQUESTED: `Action Required: Additional info needed for ${props.storeName}`,
  };

  const subject = subjectMap[props.status] || `Account Status Update — ${props.storeName}`;
  const preheader = `Important notice regarding your store ${props.storeName} on ${BRAND_NAME}.`;

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      ${
        isApproved
          ? "Your Store is Approved! 🚀"
          : isSuspended
          ? "Vendor Account Suspended ⚠️"
          : isReinstated
          ? "Store Reinstated! 🌟"
          : isRejected
          ? "Application Not Approved"
          : "Action Required: Additional Info"
      }
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Hello <strong>${props.vendorName}</strong>,
    </p>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      ${
        isApproved
          ? `Congratulations! Your vendor profile for <strong>${props.storeName}</strong> has been officially approved. Your products are now visible in the campus shop with 0% commission.`
          : isSuspended
          ? `We are writing to notify you that your vendor account for <strong>${props.storeName}</strong> has been temporarily suspended.`
          : isReinstated
          ? `Good news! Your vendor account for <strong>${props.storeName}</strong> has been reviewed and reinstated. Your listings are live again.`
          : `We regret to inform you that your application for <strong>${props.storeName}</strong> was not approved at this time.`
      }
    </p>

    ${
      props.reason
        ? `
      <div style="background-color: ${isSuspended || isRejected ? "#fff1f2" : "#f8fafc"}; border: 1px solid ${isSuspended || isRejected ? "#fecdd3" : "#e2e8f0"}; border-radius: 8px; padding: 14px; margin: 20px 0;">
        <div style="font-size: 13px; font-weight: 700; color: ${isSuspended || isRejected ? "#9f1239" : "#0f172a"};">
          ${isSuspended ? "Reason for Suspension:" : "Feedback / Reason:"}
        </div>
        <div style="font-size: 13px; color: ${isSuspended || isRejected ? "#be123c" : "#475569"}; margin-top: 4px;">
          ${props.reason}
        </div>
      </div>
    `
        : ""
    }

    ${
      isSuspended
        ? `
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin: 20px 0;">
        <div style="font-size: 13px; font-weight: 700; color: #166534;">How to Appeal / Resolve:</div>
        <div style="font-size: 13px; color: #15803d; margin-top: 4px;">
          ${
            props.appealSteps ||
            `If you believe this was an error or wish to appeal this decision, please reply to our support team at <a href="mailto:${SUPPORT_EMAIL}" style="color: #10b981; font-weight: 600;">${SUPPORT_EMAIL}</a> with your store details and verification documents.`
          }
        </div>
      </div>
    `
        : ""
    }

    <div style="text-align: center; margin: 28px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;">
        Open Store Dashboard &rarr;
      </a>
    </div>
  `;

  const html = baseEmailWrapper({ title: subject, preheader, contentHtml });
  const text = `${subject}\n\nHello ${props.vendorName},\nStore: ${props.storeName}\nStatus: ${props.status}\n${props.reason ? `Reason: ${props.reason}\n` : ""}Dashboard: ${dashboardUrl}`;
  return { subject, html, text };
}

export interface VendorNewOrderProps {
  orderNumber: string;
  storeName: string;
  buyerName: string;
  items: Array<{ title: string; quantity: number; price: number }>;
  payoutAmount: number;
  meetupPoint?: string;
  campusName?: string;
  dashboardUrl?: string;
}

export function renderVendorNewOrder(
  props: VendorNewOrderProps
): RenderedEmail {
  const dashboardUrl = props.dashboardUrl || `${APP_BASE_URL}/dashboard/orders`;
  const subject = `💰 New Order #${props.orderNumber} Received — ${formatNaira(props.payoutAmount)} held in Escrow`;
  const preheader = `A student placed an order #${props.orderNumber} on ${props.storeName}. Payment is safely held in escrow.`;

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
      You Have a New Student Order! 🛍️
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Great news! <strong>${props.buyerName}</strong> has placed Order <strong>#${props.orderNumber}</strong> with your storefront <strong>${props.storeName}</strong>.
    </p>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin-bottom: 20px; text-align: center;">
      <div style="font-size: 12px; font-weight: 700; color: #15803d; text-transform: uppercase;">Escrow Secured Payout</div>
      <div style="font-size: 26px; font-weight: 900; color: #166534; margin: 4px 0;">${formatNaira(props.payoutAmount)}</div>
      <div style="font-size: 12px; color: #15803d;">Payment is safely deposited in ọjà escrow. You will receive bank payout upon buyer verification.</div>
    </div>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Order Items</div>
      <table width="100%" cellpadding="0" cellspacing="0">${itemsHtml}</table>
    </div>

    ${
      props.meetupPoint
        ? `
      <div style="font-size: 13px; color: #475569; margin-bottom: 20px;">
        📍 <strong>Meetup Spot:</strong> ${props.meetupPoint} ${props.campusName ? `(${props.campusName})` : ""}
      </div>
    `
        : ""
    }

    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #92400e; margin-bottom: 24px;">
      ⚠️ <strong>Safety Rule:</strong> Never hand over merchandise without asking the buyer for their 6-digit confirmation code! Enter it in your dashboard to trigger instant payment release.
    </div>

    <div style="text-align: center;">
      <a href="${dashboardUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;">
        Manage Order in Dashboard &rarr;
      </a>
    </div>
  `;

  const html = baseEmailWrapper({ title: subject, preheader, contentHtml });
  const text = `${subject}\n\nOrder #${props.orderNumber}\nBuyer: ${props.buyerName}\nPayout: ${formatNaira(props.payoutAmount)}\nMeetup: ${props.meetupPoint || "Campus"}\nDashboard: ${dashboardUrl}`;
  return { subject, html, text };
}

export interface VendorDisputeOpenedProps {
  orderNumber: string;
  storeName: string;
  reason: string;
  buyerName: string;
  amount: number;
  disputeUrl?: string;
}

export function renderVendorDisputeOpened(
  props: VendorDisputeOpenedProps
): RenderedEmail {
  const disputeUrl = props.disputeUrl || `${APP_BASE_URL}/dashboard/orders`;
  const subject = `⚠️ Buyer Opened a Dispute on Order #${props.orderNumber}`;
  const preheader = `A dispute was opened by ${props.buyerName} for Order #${props.orderNumber}. Escrow payout is held.`;

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      Escrow Dispute Notice — Order #${props.orderNumber}
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Buyer <strong>${props.buyerName}</strong> has filed a dispute for Order <strong>#${props.orderNumber}</strong> with your store <strong>${props.storeName}</strong>.
    </p>

    <div style="background-color: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; margin: 20px 0;">
      <div style="font-size: 13px; font-weight: 700; color: #991b1b;">Dispute Reason:</div>
      <div style="font-size: 13px; color: #b91c1c; margin-top: 4px;">${props.reason}</div>
      <div style="font-size: 12px; color: #7f1d1d; margin-top: 8px;">
        Payout amount: <strong>${formatNaira(props.amount)}</strong> is held in escrow pending admin review.
      </div>
    </div>

    <p style="font-size: 13px; color: #475569;">
      Please inspect the dispute details in your dashboard. You may reach out to the buyer via chat or provide evidence to our campus support team.
    </p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${disputeUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;">
        View Dispute Details &rarr;
      </a>
    </div>
  `;

  const html = baseEmailWrapper({ title: subject, preheader, contentHtml });
  const text = `${subject}\n\nOrder #${props.orderNumber}\nReason: ${props.reason}\nBuyer: ${props.buyerName}\nInspect: ${disputeUrl}`;
  return { subject, html, text };
}

export interface VendorProductModerationProps {
  productTitle: string;
  storeName: string;
  status: "APPROVED" | "REJECTED" | "PUBLISHED";
  rejectionReason?: string;
  productUrl?: string;
}

export function renderVendorProductModeration(
  props: VendorProductModerationProps
): RenderedEmail {
  const isApproved = props.status === "APPROVED" || props.status === "PUBLISHED";
  const subject = isApproved
    ? `✅ Product Approved: "${props.productTitle}" is live on ọjà`
    : `Update on your product: "${props.productTitle}"`;
  const preheader = `Moderation update for your listing "${props.productTitle}".`;

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      ${isApproved ? "Product Approved & Live! 🎉" : "Product Update Needed 📝"}
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Your listing <strong>"${props.productTitle}"</strong> has been reviewed by the ${BRAND_NAME} catalog moderation team.
    </p>

    ${
      !isApproved && props.rejectionReason
        ? `
      <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 14px; margin: 20px 0;">
        <div style="font-size: 13px; font-weight: 700; color: #9f1239;">Moderator Feedback:</div>
        <div style="font-size: 13px; color: #be123c; margin-top: 4px;">${props.rejectionReason}</div>
      </div>
    `
        : ""
    }

    <div style="text-align: center; margin: 24px 0;">
      <a href="${props.productUrl || `${APP_BASE_URL}/dashboard/products`}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;">
        View Product in Dashboard &rarr;
      </a>
    </div>
  `;

  const html = baseEmailWrapper({ title: subject, preheader, contentHtml });
  const text = `${subject}\n\nProduct: ${props.productTitle}\nStatus: ${props.status}\n${props.rejectionReason ? `Reason: ${props.rejectionReason}\n` : ""}`;
  return { subject, html, text };
}

export interface VendorStockAlertProps {
  productTitle: string;
  storeName: string;
  stockRemaining: number;
  productUrl?: string;
}

export function renderVendorStockAlert(
  props: VendorStockAlertProps
): RenderedEmail {
  const isOutOfStock = props.stockRemaining <= 0;
  const subject = isOutOfStock
    ? `🚨 Out of Stock: "${props.productTitle}" has 0 units remaining`
    : `⚠️ Low Stock Alert: "${props.productTitle}" (${props.stockRemaining} left)`;
  const preheader = `Inventory update for ${props.storeName}: "${props.productTitle}" is ${isOutOfStock ? "out of stock" : "running low"}.`;

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      ${isOutOfStock ? "Product is Out of Stock! 🚨" : "Low Inventory Alert ⚠️"}
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Your listing <strong>"${props.productTitle}"</strong> has ${
    isOutOfStock ? `sold out and is currently out of stock.` : `only <strong>${props.stockRemaining} units</strong> remaining in inventory.`
  }
    </p>

    <p style="font-size: 13px; color: #64748b;">
      Restock now to prevent missed orders and maintain your search ranking on the campus shop.
    </p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${props.productUrl || `${APP_BASE_URL}/dashboard/products`}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;">
        Update Inventory &rarr;
      </a>
    </div>
  `;

  const html = baseEmailWrapper({ title: subject, preheader, contentHtml });
  const text = `${subject}\n\nProduct: ${props.productTitle}\nRemaining: ${props.stockRemaining}\nRestock: ${props.productUrl || `${APP_BASE_URL}/dashboard/products`}`;
  return { subject, html, text };
}

export interface VendorPayoutStatusProps {
  orderNumber: string;
  storeName: string;
  amount: number;
  status: "PAID" | "FAILED";
  bankName?: string;
  accountNumberMasked?: string;
  errorMessage?: string;
}

export function renderVendorPayoutStatus(
  props: VendorPayoutStatusProps
): RenderedEmail {
  const isPaid = props.status === "PAID";
  const subject = isPaid
    ? `💸 Payout Sent: ${formatNaira(props.amount)} for Order #${props.orderNumber}`
    : `⚠️ Payout Transfer Failed for Order #${props.orderNumber}`;
  const preheader = isPaid
    ? `Escrow payout of ${formatNaira(props.amount)} has been transferred to your bank account.`
    : `Bank transfer of ${formatNaira(props.amount)} failed on the network.`;

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      ${isPaid ? "Payout Transferred to Your Bank! 💸" : "Payout Transfer Issue ⚠️"}
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      ${
        isPaid
          ? `Your escrow payout of <strong>${formatNaira(props.amount)}</strong> for Order <strong>#${props.orderNumber}</strong> has been transferred successfully.`
          : `We encountered an issue attempting to transfer your escrow payout of <strong>${formatNaira(props.amount)}</strong> for Order #${props.orderNumber}.`
      }
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px;">
      <div><strong>Order:</strong> #${props.orderNumber}</div>
      <div><strong>Amount:</strong> ${formatNaira(props.amount)}</div>
      ${props.bankName ? `<div><strong>Bank:</strong> ${props.bankName} (${props.accountNumberMasked || "Account"})</div>` : ""}
      ${!isPaid && props.errorMessage ? `<div style="color: #dc2626; margin-top: 6px;"><strong>Reason:</strong> ${props.errorMessage}</div>` : ""}
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_BASE_URL}/dashboard/wallet" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;">
        View Wallet & Bank Details &rarr;
      </a>
    </div>
  `;

  const html = baseEmailWrapper({ title: subject, preheader, contentHtml });
  const text = `${subject}\n\nOrder: #${props.orderNumber}\nAmount: ${formatNaira(props.amount)}\nStatus: ${props.status}\nWallet: ${APP_BASE_URL}/dashboard/wallet`;
  return { subject, html, text };
}

export interface VendorNewReviewProps {
  storeName: string;
  reviewerName: string;
  rating: number;
  comment?: string;
  productTitle?: string;
  reviewsUrl?: string;
}

export function renderVendorNewReview(
  props: VendorNewReviewProps
): RenderedEmail {
  const stars = "⭐".repeat(Math.max(1, Math.min(5, props.rating)));
  const subject = `⭐ New ${props.rating}-Star Review on ${props.storeName}!`;
  const preheader = `${props.reviewerName} rated your store ${props.rating} stars: "${props.comment || "Great transaction!"}"`;

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      New Customer Review Received! ⭐
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Student buyer <strong>${props.reviewerName}</strong> left a review for <strong>${props.storeName}</strong>${props.productTitle ? ` on "${props.productTitle}"` : ""}:
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <div style="font-size: 18px; margin-bottom: 6px;">${stars} <span style="font-size: 14px; font-weight: 700; color: #0f172a;">(${props.rating}/5)</span></div>
      ${props.comment ? `<p style="font-size: 13px; font-style: italic; color: #475569; margin: 0;">"${props.comment}"</p>` : ""}
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${props.reviewsUrl || `${APP_BASE_URL}/dashboard`}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;">
        View Customer Reviews &rarr;
      </a>
    </div>
  `;

  const html = baseEmailWrapper({ title: subject, preheader, contentHtml });
  const text = `${subject}\n\nReviewer: ${props.reviewerName}\nRating: ${props.rating}/5\n${props.comment ? `Comment: "${props.comment}"\n` : ""}`;
  return { subject, html, text };
}

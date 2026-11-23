import {
  baseEmailWrapper,
  BRAND_NAME,
  BRAND_COLOR,
  APP_BASE_URL,
  formatNaira,
  formatDateTime,
} from "./base";
import { RenderedEmail } from "./types";

export interface AdminNewVendorPendingProps {
  storeName: string;
  applicantName: string;
  sellerType: string;
  campusName?: string;
  registeredAt?: string | Date;
  reviewUrl?: string;
}

export function renderAdminNewVendorPending(
  props: AdminNewVendorPendingProps
): RenderedEmail {
  const reviewUrl = props.reviewUrl || `${APP_BASE_URL}/admin/vendors`;
  const subject = `[Action Required] New Vendor Application: ${props.storeName} (${props.campusName || "Campus"})`;
  const preheader = `A new vendor has registered and is awaiting administrative approval: ${props.storeName}.`;

  const contentHtml = `
    <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
      <span style="color: #92400e; font-size: 12px; font-weight: 700; text-transform: uppercase;">Super Admin Alert</span>
    </div>

    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      New Vendor Registration Awaiting Review 🏪
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      A new vendor account has been created on ${BRAND_NAME} and requires verification before their storefront and catalog can go live to students.
    </p>

    <div style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 24px;">
      <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px; color: #334155;">
        <tr>
          <td style="color: #64748b; width: 140px; font-weight: 600;">Store Name:</td>
          <td style="font-weight: 700; color: #0f172a;">${props.storeName}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Applicant:</td>
          <td>${props.applicantName}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Seller Type:</td>
          <td style="text-transform: capitalize;">${props.sellerType}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Campus:</td>
          <td>${props.campusName || "Unassigned"}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Submitted:</td>
          <td>${formatDateTime(props.registeredAt || new Date())}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${reviewUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);">
        Review Vendor Application &rarr;
      </a>
    </div>
  `;

  const html = baseEmailWrapper({
    title: subject,
    preheader,
    contentHtml,
  });

  const text = `${subject}\n\nA new vendor application is awaiting approval:\nStore: ${props.storeName}\nApplicant: ${props.applicantName}\nSeller Type: ${props.sellerType}\nCampus: ${props.campusName || "Campus"}\nReview here: ${reviewUrl}`;

  return { subject, html, text };
}

export interface AdminKycSubmissionProps {
  storeName: string;
  vendorName: string;
  documentType: string;
  reviewUrl?: string;
}

export function renderAdminKycSubmission(
  props: AdminKycSubmissionProps
): RenderedEmail {
  const reviewUrl = props.reviewUrl || `${APP_BASE_URL}/admin/vendors`;
  const subject = `[KYC Update] New Verification Document Submitted: ${props.storeName}`;
  const preheader = `Vendor ${props.storeName} uploaded a new verification document for review.`;

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      Vendor KYC / Verification Uploaded 📑
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Vendor <strong>${props.storeName}</strong> (${props.vendorName}) has submitted verification documents (${props.documentType}) for review.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${reviewUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;">
        Inspect KYC Documents &rarr;
      </a>
    </div>
  `;

  const html = baseEmailWrapper({ title: subject, preheader, contentHtml });
  const text = `${subject}\n\nVendor ${props.storeName} uploaded KYC documents (${props.documentType}). Inspect: ${reviewUrl}`;
  return { subject, html, text };
}

export interface AdminNewDisputeProps {
  orderNumber: string;
  disputeId: string;
  reason: string;
  buyerName: string;
  storeName: string;
  orderTotal: number;
  reviewUrl?: string;
}

export function renderAdminNewDispute(
  props: AdminNewDisputeProps
): RenderedEmail {
  const reviewUrl = props.reviewUrl || `${APP_BASE_URL}/admin/escrow`;
  const subject = `[CRITICAL DISPUTE] Order #${props.orderNumber} Disputed — Escrow Frozen`;
  const preheader = `A buyer has opened a dispute on Order #${props.orderNumber}. Escrow payout has been frozen.`;

  const contentHtml = `
    <div style="background-color: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
      <span style="color: #991b1b; font-size: 12px; font-weight: 700; text-transform: uppercase;">⚠️ Escrow Payout Frozen</span>
    </div>

    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      New Escrow Dispute Opened 🚨
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      Buyer <strong>${props.buyerName}</strong> has flagged Order #${props.orderNumber} with vendor <strong>${props.storeName}</strong>. Escrow payout of ${formatNaira(props.orderTotal)} is locked pending admin resolution.
    </p>

    <div style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 24px;">
      <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px; color: #334155;">
        <tr>
          <td style="color: #64748b; width: 140px; font-weight: 600;">Dispute Reason:</td>
          <td style="font-weight: 700; color: #b91c1c;">${props.reason}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Order Amount:</td>
          <td style="font-weight: 700; color: #0f172a;">${formatNaira(props.orderTotal)}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Buyer:</td>
          <td>${props.buyerName}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 600;">Vendor Store:</td>
          <td>${props.storeName}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${reviewUrl}" style="display: inline-block; background-color: #e11d48; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;">
        Open Escrow Dispute Center &rarr;
      </a>
    </div>
  `;

  const html = baseEmailWrapper({ title: subject, preheader, contentHtml });
  const text = `${subject}\n\nDispute Reason: ${props.reason}\nOrder #${props.orderNumber}\nAmount: ${formatNaira(props.orderTotal)}\nBuyer: ${props.buyerName}\nVendor: ${props.storeName}\nResolve in Admin: ${reviewUrl}`;
  return { subject, html, text };
}

export interface AdminPayoutFailedProps {
  orderNumber: string;
  storeName: string;
  amount: number;
  failureReason: string;
  reviewUrl?: string;
}

export function renderAdminPayoutFailed(
  props: AdminPayoutFailedProps
): RenderedEmail {
  const reviewUrl = props.reviewUrl || `${APP_BASE_URL}/admin/escrow`;
  const subject = `[ALERT] Payout Transfer Failed for Order #${props.orderNumber} (${formatNaira(props.amount)})`;
  const preheader = `A bank transfer payout to ${props.storeName} failed on the payment provider network.`;

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      Vendor Payout Failed ⚠️
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      An automated escrow payout to vendor <strong>${props.storeName}</strong> for Order #${props.orderNumber} could not be completed by the banking network.
    </p>

    <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
      <div style="font-size: 13px; font-weight: 700; color: #9f1239;">Bank Error Details:</div>
      <div style="font-size: 13px; color: #be123c; margin-top: 4px;">${props.failureReason}</div>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${reviewUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;">
        View Stuck Escrow & Retry &rarr;
      </a>
    </div>
  `;

  const html = baseEmailWrapper({ title: subject, preheader, contentHtml });
  const text = `${subject}\n\nStore: ${props.storeName}\nOrder: #${props.orderNumber}\nAmount: ${formatNaira(props.amount)}\nError: ${props.failureReason}\nInspect: ${reviewUrl}`;
  return { subject, html, text };
}

export interface AdminSecurityAlertProps {
  eventType: string;
  description: string;
  actorEmail?: string;
  targetEmail?: string;
  timestamp?: string | Date;
}

export function renderAdminSecurityAlert(
  props: AdminSecurityAlertProps
): RenderedEmail {
  const subject = `[SECURITY] ${props.eventType} on ọjà`;
  const preheader = `Security event notice: ${props.description}`;

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      Security Event Detected 🛡️
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #334155;">
      ${props.description}
    </p>

    <div style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 24px; font-size: 13px;">
      <div><strong>Event:</strong> ${props.eventType}</div>
      ${props.actorEmail ? `<div><strong>Initiated by:</strong> ${props.actorEmail}</div>` : ""}
      ${props.targetEmail ? `<div><strong>Target Account:</strong> ${props.targetEmail}</div>` : ""}
      <div><strong>Time:</strong> ${formatDateTime(props.timestamp || new Date())}</div>
    </div>
  `;

  const html = baseEmailWrapper({ title: subject, preheader, contentHtml });
  const text = `${subject}\n\n${props.description}\nTime: ${formatDateTime(props.timestamp || new Date())}`;
  return { subject, html, text };
}

export interface AdminDailyDigestProps {
  date: string;
  totalOrders: number;
  totalVolume: number;
  newUsersCount: number;
  newVendorsCount: number;
  pendingDisputesCount: number;
  adminDashboardUrl?: string;
}

export function renderAdminDailyDigest(
  props: AdminDailyDigestProps
): RenderedEmail {
  const adminUrl = props.adminDashboardUrl || `${APP_BASE_URL}/admin`;
  const subject = `📊 ọjà Daily Executive Digest — ${props.date}`;
  const preheader = `Daily Platform Summary: ${props.totalOrders} orders, ${formatNaira(props.totalVolume)} gross volume, ${props.newUsersCount} new users.`;

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      Daily Activity Summary (${props.date}) 📈
    </h1>

    <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b;">
      Here is your automated 24-hour summary of marketplace metrics and active transactions.
    </p>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; text-align: center;">
        <div style="font-size: 24px; font-weight: 900; color: #166534;">${props.totalOrders}</div>
        <div style="font-size: 12px; font-weight: 600; color: #15803d; text-transform: uppercase;">Orders Placed</div>
      </div>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; text-align: center;">
        <div style="font-size: 22px; font-weight: 900; color: #166534;">${formatNaira(props.totalVolume)}</div>
        <div style="font-size: 12px; font-weight: 600; color: #15803d; text-transform: uppercase;">GMV Volume</div>
      </div>
    </div>

    <table width="100%" cellpadding="8" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; color: #334155;">
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="font-weight: 600; color: #64748b;">New Student Accounts:</td>
        <td align="right" style="font-weight: 700;">+${props.newUsersCount}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="font-weight: 600; color: #64748b;">New Vendor Registrations:</td>
        <td align="right" style="font-weight: 700;">+${props.newVendorsCount}</td>
      </tr>
      <tr>
        <td style="font-weight: 600; color: #64748b;">Active Open Disputes:</td>
        <td align="right" style="font-weight: 700; color: ${props.pendingDisputesCount > 0 ? "#dc2626" : "#16a34a"};">
          ${props.pendingDisputesCount}
        </td>
      </tr>
    </table>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${adminUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;">
        Open Full Admin CMS &rarr;
      </a>
    </div>
  `;

  const html = baseEmailWrapper({
    title: subject,
    preheader,
    contentHtml,
    isMarketing: false,
  });

  const text = `${subject}\n\nOrders: ${props.totalOrders}\nVolume: ${formatNaira(props.totalVolume)}\nNew Users: ${props.newUsersCount}\nNew Vendors: ${props.newVendorsCount}\nDisputes: ${props.pendingDisputesCount}\nCMS: ${adminUrl}`;

  return { subject, html, text };
}

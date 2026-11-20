import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Link,
  Preview,
} from "@react-email/components";

export interface VendorStatusEmailProps {
  storeName: string;
  applicantName: string;
  status: "APPROVED" | "REJECTED" | "SUSPENDED" | "INFO_REQUESTED";
  rejectionReason?: string;
  tier?: number;
}

export function VendorStatusEmail({
  storeName = "Campus Store",
  applicantName = "Vendor",
  status = "APPROVED",
  rejectionReason,
  tier = 2,
}: VendorStatusEmailProps) {
  const isApproved = status === "APPROVED";
  const isInfo = status === "INFO_REQUESTED";
  const isRejected = status === "REJECTED";

  return (
    <Html>
      <Head />
      <Preview>
        {isApproved
          ? `Congratulations! Your store ${storeName} is approved on ọjà!`
          : `Update regarding your ọjà vendor application`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>
              ọ<span style={{ color: "#10b981" }}>jà</span>
            </Text>
            <Text style={headerSub}>Vendor Verification Desk</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={heading}>
              {isApproved
                ? "Your Store is Live! 🎉"
                : isInfo
                ? "Additional Information Required 📋"
                : "Application Update ⚠️"}
            </Heading>

            <Text style={paragraph}>
              Hello <strong>{applicantName}</strong>, this is an update regarding your store application for <strong>{storeName}</strong>.
            </Text>

            {isApproved && (
              <Section style={approvedBox}>
                <Text style={approvedTitle}>Verified &bull; Tier {tier} Active</Text>
                <Text style={approvedText}>
                  Your campus credentials have been verified. Your store is now active and student shoppers can discover your products on ọjà!
                </Text>
              </Section>
            )}

            {isInfo && (
              <Section style={infoBox}>
                <Text style={infoTitle}>Action Needed:</Text>
                <Text style={infoText}>
                  Our moderation team requires more information before completing your verification:
                </Text>
                <Text style={reasonText}>
                  &ldquo;{rejectionReason || "Please upload a clear copy of your Student ID or Government ID."}&rdquo;
                </Text>
              </Section>
            )}

            {isRejected && (
              <Section style={rejectedBox}>
                <Text style={rejectedTitle}>Application Not Approved</Text>
                <Text style={rejectedText}>
                  Reason provided by moderation:
                </Text>
                <Text style={reasonText}>
                  &ldquo;{rejectionReason || "Credentials provided did not meet security requirements."}&rdquo;
                </Text>
              </Section>
            )}

            <Section style={ctaSection}>
              <Link
                href={isApproved ? "https://campus-marketplace-umber-one.vercel.app/dashboard" : "https://campus-marketplace-umber-one.vercel.app/dashboard/settings"}
                style={isApproved ? buttonApproved : buttonDefault}
              >
                {isApproved ? "Go to Vendor Dashboard" : "Review Application"}
              </Link>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              ọjà Verification &bull; NDPA Compliant Student Marketplace
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default VendorStatusEmail;

const main: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "32px auto",
  borderRadius: "16px",
  overflow: "hidden",
  maxWidth: "560px",
  border: "1px solid #e4e4e7",
};

const header: React.CSSProperties = {
  backgroundColor: "#09090b",
  padding: "24px 32px",
  textAlign: "center" as const,
};

const logoText: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "900",
  color: "#ffffff",
  margin: "0",
};

const headerSub: React.CSSProperties = {
  fontSize: "11px",
  color: "#a1a1aa",
  margin: "4px 0 0 0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const content: React.CSSProperties = {
  padding: "32px",
};

const heading: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: "800",
  color: "#09090b",
  margin: "0 0 12px 0",
};

const paragraph: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#52525b",
  margin: "0 0 20px 0",
};

const approvedBox: React.CSSProperties = {
  backgroundColor: "#ecfdf5",
  border: "1px solid #a7f3d0",
  borderRadius: "12px",
  padding: "18px",
  margin: "20px 0",
};

const approvedTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "800",
  color: "#065f46",
  margin: "0 0 6px 0",
};

const approvedText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#047857",
  margin: "0",
};

const infoBox: React.CSSProperties = {
  backgroundColor: "#fffbeb",
  border: "1px solid #fde68a",
  borderRadius: "12px",
  padding: "18px",
  margin: "20px 0",
};

const infoTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "800",
  color: "#92400e",
  margin: "0 0 6px 0",
};

const infoText: React.CSSProperties = {
  fontSize: "13px",
  color: "#78350f",
  margin: "0 0 8px 0",
};

const rejectedBox: React.CSSProperties = {
  backgroundColor: "#fff1f2",
  border: "1px solid #fecdd3",
  borderRadius: "12px",
  padding: "18px",
  margin: "20px 0",
};

const rejectedTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "800",
  color: "#9f1239",
  margin: "0 0 6px 0",
};

const rejectedText: React.CSSProperties = {
  fontSize: "13px",
  color: "#881337",
  margin: "0 0 8px 0",
};

const reasonText: React.CSSProperties = {
  fontSize: "13px",
  fontStyle: "italic",
  color: "#09090b",
  backgroundColor: "#ffffff",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #e4e4e7",
  margin: "0",
};

const ctaSection: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "28px 0 8px 0",
};

const buttonApproved: React.CSSProperties = {
  backgroundColor: "#059669",
  color: "#ffffff",
  padding: "12px 28px",
  borderRadius: "10px",
  fontSize: "13px",
  fontWeight: "700",
  textDecoration: "none",
  display: "inline-block",
};

const buttonDefault: React.CSSProperties = {
  backgroundColor: "#18181b",
  color: "#ffffff",
  padding: "12px 28px",
  borderRadius: "10px",
  fontSize: "13px",
  fontWeight: "700",
  textDecoration: "none",
  display: "inline-block",
};

const footer: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  padding: "20px 32px",
  textAlign: "center" as const,
  borderTop: "1px solid #e4e4e7",
};

const footerText: React.CSSProperties = {
  fontSize: "11px",
  color: "#a1a1aa",
  margin: "4px 0",
};

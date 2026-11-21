import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Link,
  Preview,
} from "@react-email/components";

export interface VendorNotificationEmailProps {
  storeName: string;
  orderNumber: string;
  buyerName: string;
  buyerPhone?: string;
  items: Array<{ title: string; quantity: number; price: number }>;
  payoutAmount: number;
  meetupPoint?: string;
}

export function VendorNotificationEmail({
  storeName = "Campus Vendor",
  orderNumber = "ORD-0001",
  buyerName = "A student",
  buyerPhone = "+234...",
  items = [],
  payoutAmount = 0,
  meetupPoint = "Central Campus Gate",
}: VendorNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New ọjà Order #{orderNumber} received!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>
              ọ<span style={{ color: "#10b981" }}>jà</span>
            </Text>
            <Text style={headerSub}>Vendor Notification &bull; Escrow Secured</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={heading}>You Have a New Order! 🛍️</Heading>
            <Text style={paragraph}>
              Hello <strong>{storeName}</strong>, <strong>{buyerName}</strong> just placed order <strong>#{orderNumber}</strong>. The payment is held in escrow and will be paid out to your bank account upon delivery.
            </Text>

            {/* Meetup Coordination Box */}
            <Section style={infoBox}>
              <Text style={infoBoxTitle}>📍 Campus Meetup & Buyer Details</Text>
              <Text style={infoBoxText}>
                Buyer: <strong>{buyerName}</strong> {buyerPhone && `(${buyerPhone})`}
              </Text>
              <Text style={infoBoxText}>
                Meetup Point: <strong>{meetupPoint}</strong>
              </Text>
            </Section>

            {/* Verification Tip */}
            <Section style={tipBox}>
              <Text style={tipTitle}>🔑 How to get paid:</Text>
              <Text style={tipText}>
                When meeting the student on campus, hand over the items and ask for their <strong>6-digit Escrow Delivery Code</strong>. Enter this code in your Vendor Dashboard to release the funds!
              </Text>
            </Section>

            {/* Order Items */}
            <Text style={sectionTitle}>Items Ordered</Text>
            <Hr style={divider} />
            {items.map((item, idx) => (
              <Section key={idx} style={itemRow}>
                <Text style={itemName}>
                  {item.quantity}x {item.title}
                </Text>
                <Text style={itemPrice}>₦{(item.price * item.quantity).toLocaleString()}</Text>
              </Section>
            ))}

            <Hr style={divider} />
            <Section style={totalRow}>
              <Text style={totalLabel}>Net Payout Pending:</Text>
              <Text style={totalValue}>₦{payoutAmount.toLocaleString()}</Text>
            </Section>

            {/* CTA */}
            <Section style={ctaSection}>
              <Link
                href={`https://campus-marketplace-umber-one.vercel.app/dashboard/orders`}
                style={button}
              >
                View in Vendor Dashboard
              </Link>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              ọjà Vendor Portal &bull; Protecting campus commerce.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default VendorNotificationEmail;

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

const infoBox: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  borderRadius: "10px",
  padding: "14px 18px",
  margin: "18px 0",
};

const infoBoxTitle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: "700",
  color: "#71717a",
  textTransform: "uppercase" as const,
  margin: "0 0 4px 0",
};

const infoBoxText: React.CSSProperties = {
  fontSize: "13px",
  color: "#09090b",
  margin: "2px 0",
};

const tipBox: React.CSSProperties = {
  backgroundColor: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "10px",
  padding: "14px 18px",
  margin: "18px 0",
};

const tipTitle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "800",
  color: "#1e40af",
  margin: "0 0 4px 0",
};

const tipText: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "18px",
  color: "#1e3a8a",
  margin: "0",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#71717a",
  textTransform: "uppercase" as const,
  margin: "24px 0 8px 0",
};

const divider: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "8px 0 16px 0",
};

const itemRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  margin: "6px 0",
};

const itemName: React.CSSProperties = {
  fontSize: "13px",
  color: "#27272a",
  margin: "0",
};

const itemPrice: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#09090b",
  margin: "0",
};

const totalRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  margin: "12px 0 24px 0",
};

const totalLabel: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "700",
  color: "#09090b",
  margin: "0",
};

const totalValue: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: "900",
  color: "#059669",
  margin: "0",
};

const ctaSection: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "24px 0 8px 0",
};

const button: React.CSSProperties = {
  backgroundColor: "#059669",
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

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

export interface OrderConfirmationEmailProps {
  buyerName: string;
  orderNumber: string;
  items: Array<{ title: string; quantity: number; price: number }>;
  totalAmount: number;
  deliveryCode?: string;
  campusName?: string;
  meetupPoint?: string;
}

export function OrderConfirmationEmail({
  buyerName = "Student",
  orderNumber = "ORD-0001",
  items = [],
  totalAmount = 0,
  deliveryCode = "123456",
  campusName = "Campus",
  meetupPoint = "Central Campus Gate",
}: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your ọjà order #{orderNumber} is confirmed!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>
              ọ<span style={{ color: "#10b981" }}>jà</span>
            </Text>
            <Text style={headerSub}>Campus Student Marketplace &bull; Escrow Protected</Text>
          </Section>

          {/* Greeting */}
          <Section style={content}>
            <Heading style={heading}>Order Confirmed! 🎉</Heading>
            <Text style={paragraph}>
              Hi <strong>{buyerName}</strong>, your order <strong>#{orderNumber}</strong> has been received and your payment is held securely in ọjà Escrow.
            </Text>

            {/* Escrow Delivery Code Pill */}
            {deliveryCode && (
              <Section style={codeCard}>
                <Text style={codeCardLabel}>YOUR SECURE ESCROW DELIVERY CODE</Text>
                <Text style={codeCardValue}>{deliveryCode}</Text>
                <Text style={codeCardTip}>
                  ⚠️ <strong>Do NOT give this code to the vendor</strong> until you meet on campus, inspect your items, and are 100% satisfied. Once you share this code, the vendor can claim the payout.
                </Text>
              </Section>
            )}

            {/* Meetup Point */}
            <Section style={infoBox}>
              <Text style={infoBoxTitle}>📍 On-Campus Pickup Location</Text>
              <Text style={infoBoxText}>
                <strong>{campusName}</strong> &bull; {meetupPoint}
              </Text>
            </Section>

            {/* Order Items */}
            <Text style={sectionTitle}>Items in this Order</Text>
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
              <Text style={totalLabel}>Total Escrow Amount:</Text>
              <Text style={totalValue}>₦{totalAmount.toLocaleString()}</Text>
            </Section>

            {/* CTA */}
            <Section style={ctaSection}>
              <Link
                href={`https://campus-marketplace-umber-one.vercel.app/orders`}
                style={button}
              >
                Track Your Order
              </Link>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Need help? Reach out to ọjà Support at support@ọjà.com.
            </Text>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} ọjà Nigeria. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default OrderConfirmationEmail;

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
  letterSpacing: "-0.5px",
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

const codeCard: React.CSSProperties = {
  backgroundColor: "#ecfdf5",
  border: "2px dashed #10b981",
  borderRadius: "12px",
  padding: "20px",
  textAlign: "center" as const,
  margin: "24px 0",
};

const codeCardLabel: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: "800",
  color: "#047857",
  letterSpacing: "1px",
  margin: "0 0 4px 0",
};

const codeCardValue: React.CSSProperties = {
  fontSize: "32px",
  fontWeight: "900",
  fontFamily: "monospace",
  color: "#065f46",
  letterSpacing: "6px",
  margin: "0 0 8px 0",
};

const codeCardTip: React.CSSProperties = {
  fontSize: "11px",
  lineHeight: "16px",
  color: "#065f46",
  margin: "0",
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
  fontWeight: "600",
  color: "#09090b",
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

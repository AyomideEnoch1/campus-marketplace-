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

export interface WelcomeEmailProps {
  userName?: string;
  userRole?: string;
  exploreUrl?: string;
}

export function WelcomeEmail({
  userName = "Campus Member",
  userRole = "BUYER",
  exploreUrl = "https://xn--j-sfa590u.com/shop",
}: WelcomeEmailProps) {
  // Ensure the link always uses ASCII Punycode so email clients cannot strip diacritics to foreign domains like oja.com or campustrade.ng
  const safeExploreUrl =
    exploreUrl.includes("localhost") || exploreUrl.includes("127.0.0.1")
      ? exploreUrl
      : exploreUrl
          .replace(/https?:\/\/campustrade\.ng[^\/]*/, "https://xn--j-sfa590u.com")
          .replace(/https?:\/\/[^\/]+/, "https://xn--j-sfa590u.com");
  const isVendor = userRole === "VENDOR";

  return (
    <Html>
      <Head />
      <Preview>Welcome to ọjà — Campus Student Marketplace!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>
              ọ<span style={{ color: "#10b981" }}>jà</span>
            </Text>
            <Text style={headerSub}>Campus Marketplace &bull; Welcome Aboard</Text>
          </Section>

          {/* Hero Banner inside content */}
          <Section style={heroBanner}>
            <Heading style={heading}>Welcome to ọjà, {userName}! 🎓🛍️</Heading>
            <Text style={heroText}>
              {isVendor
                ? "Your campus storefront is ready. Connect directly with students and start selling with escrow protection."
                : "You're now part of the safest campus marketplace in Nigeria. Discover listings, shop securely, and trade with verified peers."}
            </Text>
          </Section>

          {/* Core Value Props */}
          <Section style={content}>
            <Text style={sectionTitle}>What makes ọjà special for campus students:</Text>

            {/* Feature 1 */}
            <Section style={featureCard}>
              <Text style={featureHeading}>🔒 100% Escrow Protection</Text>
              <Text style={featureDescription}>
                Never worry about scams. Payments are held securely in escrow until you meet up on campus, inspect the items, and provide your delivery code.
              </Text>
            </Section>

            {/* Feature 2 */}
            <Section style={featureCard}>
              <Text style={featureHeading}>📍 Campus Safe Meetup Points</Text>
              <Text style={featureDescription}>
                All handovers happen at designated, high-visibility campus locations such as library entrances and student center gates.
              </Text>
            </Section>

            {/* Feature 3 */}
            <Section style={featureCard}>
              <Text style={featureHeading}>🎓 Verified Student Peers</Text>
              <Text style={featureDescription}>
                Trade textbooks, electronics, fashion, and dorm essentials with registered campus students and trusted vendors.
              </Text>
            </Section>

            {/* Call to action */}
            <Section style={buttonContainer}>
              <Link href={safeExploreUrl} style={button}>
                {isVendor ? "Go to Vendor Dashboard" : "Start Exploring Campus Listings"}
              </Link>
            </Section>

            <Hr style={divider} />

            <Text style={helpText}>
              Need assistance or have campus questions? Our student support team is always here for you. Simply reply to this email or visit our help center.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} ọjà Marketplace. Built for Nigerian campus students.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  padding: "20px 0",
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
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold",
  margin: 0,
  letterSpacing: "-0.5px",
};

const headerSub: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "12px",
  margin: "4px 0 0",
  letterSpacing: "0.5px",
};

const heroBanner: React.CSSProperties = {
  backgroundColor: "#047857",
  color: "#ffffff",
  padding: "28px 32px",
  textAlign: "center" as const,
};

const heading: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: "800",
  margin: "0 0 10px",
};

const heroText: React.CSSProperties = {
  color: "#d1fae5",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};

const content: React.CSSProperties = {
  padding: "32px",
};

const sectionTitle: React.CSSProperties = {
  color: "#09090b",
  fontSize: "14px",
  fontWeight: "700",
  margin: "0 0 16px",
};

const featureCard: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  borderRadius: "10px",
  padding: "16px",
  border: "1px solid #e2e8f0",
  marginBottom: "12px",
};

const featureHeading: React.CSSProperties = {
  color: "#0f172a",
  fontSize: "14px",
  fontWeight: "700",
  margin: "0 0 6px",
};

const featureDescription: React.CSSProperties = {
  color: "#475569",
  fontSize: "13px",
  lineHeight: "19px",
  margin: "0",
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "24px 0 16px",
};

const button: React.CSSProperties = {
  backgroundColor: "#10b981",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  borderRadius: "10px",
  padding: "13px 32px",
  display: "inline-block",
};

const divider: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "24px 0",
};

const helpText: React.CSSProperties = {
  color: "#71717a",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0",
};

const footer: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  padding: "16px 32px",
  textAlign: "center" as const,
  borderTop: "1px solid #e4e4e7",
};

const footerText: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "12px",
  margin: "0",
};

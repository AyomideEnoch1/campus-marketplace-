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

export interface EmailVerificationEmailProps {
  userName?: string;
  verificationCode?: string;
  verifyUrl: string;
}

export function EmailVerificationEmail({
  userName = "Student",
  verificationCode,
  verifyUrl = "https://xn--j-sfa590u.com/auth/verify-email",
}: EmailVerificationEmailProps) {
  // Ensure the link always uses ASCII Punycode so email clients cannot strip diacritics to foreign domains like oja.com or campustrade.ng
  const safeVerifyUrl =
    verifyUrl.includes("localhost") || verifyUrl.includes("127.0.0.1")
      ? verifyUrl
      : verifyUrl
          .replace(/https?:\/\/campustrade\.ng[^\/]*/, "https://xn--j-sfa590u.com")
          .replace(/https?:\/\/[^\/]+/, "https://xn--j-sfa590u.com");

  return (
    <Html>
      <Head />
      <Preview>Verify your email address on ọjà</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>
              ọ<span style={{ color: "#10b981" }}>jà</span>
            </Text>
            <Text style={headerSub}>Campus Marketplace &bull; Account Verification</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={heading}>Verify Your Email Address ✉️</Heading>
            <Text style={paragraph}>Hello {userName},</Text>
            <Text style={paragraph}>
              Welcome to <strong>ọjà</strong>, Nigeria&apos;s leading student campus marketplace! To complete your registration and secure your account, please verify your email address.
            </Text>

            {/* 6-Digit Code Box */}
            {verificationCode && (
              <Section style={codeCard}>
                <Text style={codeCardLabel}>YOUR 6-DIGIT VERIFICATION CODE</Text>
                <Text style={codeCardValue}>{verificationCode}</Text>
                <Text style={codeCardTip}>Enter this code on the verification screen to activate your account</Text>
              </Section>
            )}

            {/* Button */}
            <Section style={buttonContainer}>
              <Link href={safeVerifyUrl} style={button}>
                Verify My Email
              </Link>
            </Section>

            <Text style={subtext}>
              This verification link and code will expire in <strong>24 hours</strong>. If you did not create an account on ọjà, you can safely ignore this email.
            </Text>

            <Hr style={divider} />

            <Text style={footerNote}>
              If the button doesn&apos;t work, copy and paste this link into your browser:
              <br />
              <Link href={safeVerifyUrl} style={link}>
                {safeVerifyUrl}
              </Link>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} ọjà Marketplace (ọjà.com). Built for Nigerian campus students.
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
  margin: "0 0 16px 0",
};

const paragraph: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#3f3f46",
  margin: "0 0 16px 0",
};

const codeCard: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  border: "1.5px dashed #86efac",
  borderRadius: "12px",
  padding: "16px 20px",
  textAlign: "center" as const,
  margin: "20px 0",
};

const codeCardLabel: React.CSSProperties = {
  color: "#166534",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1px",
  margin: "0 0 6px",
};

const codeCardValue: React.CSSProperties = {
  color: "#15803d",
  fontSize: "32px",
  fontWeight: "800",
  letterSpacing: "6px",
  margin: "0",
  fontFamily: "monospace",
};

const codeCardTip: React.CSSProperties = {
  color: "#16a34a",
  fontSize: "12px",
  margin: "6px 0 0",
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "28px 0",
};

const button: React.CSSProperties = {
  backgroundColor: "#059669",
  borderRadius: "12px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "700",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const subtext: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "18px",
  color: "#71717a",
  margin: "16px 0 0 0",
};

const divider: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "24px 0",
};

const footerNote: React.CSSProperties = {
  fontSize: "11px",
  lineHeight: "16px",
  color: "#a1a1aa",
  wordBreak: "break-all" as const,
};

const link: React.CSSProperties = {
  color: "#059669",
  textDecoration: "underline",
};

const footer: React.CSSProperties = {
  backgroundColor: "#fafafa",
  padding: "16px 32px",
  textAlign: "center" as const,
  borderTop: "1px solid #f4f4f5",
};

const footerText: React.CSSProperties = {
  fontSize: "11px",
  color: "#a1a1aa",
  margin: "0",
};

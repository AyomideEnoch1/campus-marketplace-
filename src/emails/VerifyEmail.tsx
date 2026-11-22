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

export interface VerifyEmailProps {
  userName?: string;
  verificationCode?: string;
  verifyUrl: string;
}

export function VerifyEmail({
  userName = "Campus Member",
  verificationCode = "123456",
  verifyUrl = "https://xn--j-sfa590u.com/auth/verify-email",
}: VerifyEmailProps) {
  const safeVerifyUrl = verifyUrl;

  return (
    <Html>
      <Head />
      <Preview>Verify your email address for ọjà.</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>
              ọ<span style={{ color: "#10b981" }}>jà.</span>
            </Text>
            <Text style={headerSub}>Campus Marketplace &bull; Email Verification</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={heading}>Verify Your Email Address 📬</Heading>
            <Text style={paragraph}>Hello {userName},</Text>
            <Text style={paragraph}>
              Thank you for signing up on <strong>ọjà.</strong>, the verified student campus marketplace. Please verify your email to secure your account and unlock trading.
            </Text>

            {/* 6-Digit Code Box */}
            {verificationCode && (
              <Section style={codeContainer}>
                <Text style={codeLabel}>YOUR 6-DIGIT VERIFICATION CODE</Text>
                <Text style={codeText}>{verificationCode}</Text>
                <Text style={codeSubtext}>Enter this code on the verification screen</Text>
              </Section>
            )}

            {/* Or Click Button */}
            <Text style={orDividerText}>— OR CLICK THE BUTTON BELOW —</Text>

            <Section style={buttonContainer}>
              <Link href={safeVerifyUrl} style={button}>
                Verify My Email
              </Link>
            </Section>

            <Text style={subtext}>
              This code and link will expire in <strong>24 hours</strong>. If you did not create an account on ọjà., please disregard this email.
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
              &copy; {new Date().getFullYear()} ọjà. Built for Nigerian campus students.
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

const content: React.CSSProperties = {
  padding: "32px",
};

const heading: React.CSSProperties = {
  color: "#09090b",
  fontSize: "22px",
  fontWeight: "700",
  margin: "0 0 16px",
};

const paragraph: React.CSSProperties = {
  color: "#3f3f46",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 16px",
};

const codeContainer: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  border: "1.5px dashed #86efac",
  borderRadius: "12px",
  padding: "20px",
  textAlign: "center" as const,
  margin: "24px 0 16px",
};

const codeLabel: React.CSSProperties = {
  color: "#166534",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1px",
  margin: "0 0 8px",
};

const codeText: React.CSSProperties = {
  color: "#15803d",
  fontSize: "36px",
  fontWeight: "800",
  letterSpacing: "8px",
  margin: "0",
  fontFamily: "monospace",
};

const codeSubtext: React.CSSProperties = {
  color: "#16a34a",
  fontSize: "12px",
  margin: "8px 0 0",
};

const orDividerText: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "11px",
  fontWeight: "600",
  textAlign: "center" as const,
  margin: "20px 0",
  letterSpacing: "0.5px",
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "16px 0 24px",
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

const subtext: React.CSSProperties = {
  color: "#71717a",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 20px",
};

const divider: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "24px 0",
};

const footerNote: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0",
};

const link: React.CSSProperties = {
  color: "#10b981",
  wordBreak: "break-all" as const,
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

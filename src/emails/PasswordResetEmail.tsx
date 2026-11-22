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

export interface PasswordResetEmailProps {
  userName?: string;
  resetUrl: string;
}

export function PasswordResetEmail({
  userName = "Student",
  resetUrl = "https://xn--j-sfa590u.com/auth/reset-password",
}: PasswordResetEmailProps) {
  const safeResetUrl = resetUrl;
  return (
    <Html>
      <Head />
      <Preview>Reset your ọjà. password</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>
              ọ<span style={{ color: "#10b981" }}>jà.</span>
            </Text>
            <Text style={headerSub}>Campus Marketplace &bull; Account Security</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={heading}>Reset Your Password 🔐</Heading>
            <Text style={paragraph}>Hello {userName},</Text>
            <Text style={paragraph}>
              We received a request to reset the password associated with your ọjà account. Click the button below to choose a new password:
            </Text>

            {/* Button */}
            <Section style={buttonContainer}>
              <Link href={safeResetUrl} style={button}>
                Reset Password
              </Link>
            </Section>

            <Text style={subtext}>
              This password reset link is valid for <strong>60 minutes</strong>. If you did not make this request, you can safely ignore this email—your account remains safe and your current password will not change.
            </Text>

            <Hr style={divider} />

            <Text style={footerNote}>
              If the button doesn&apos;t work, copy and paste this link into your browser:
              <br />
              <Link href={safeResetUrl} style={link}>
                {safeResetUrl}
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

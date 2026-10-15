/**
 * src/lib/auth/emailProvider.ts
 *
 * Pluggable Email Provider Adapter for real email verification & password recovery.
 * Supports Resend, SendGrid, and testing interceptor harness.
 */

export interface EmailSendResult {
  success: boolean;
  error?: string;
  providerMessageId?: string;
}

export interface EmailProvider {
  name: string;
  sendVerificationEmail(email: string, token: string, code: string): Promise<EmailSendResult>;
  sendPasswordResetEmail(email: string, token: string): Promise<EmailSendResult>;
}

// In-memory test interceptor for automated tests
export const TEST_EMAIL_INTERCEPTOR: Array<{
  email: string;
  type: "verification" | "password_reset";
  token: string;
  code?: string;
  timestamp: number;
}> = [];

class ResendEmailProvider implements EmailProvider {
  name = "resend";
  private apiKey: string;
  private fromEmail: string;

  constructor(key: string, from = "ShikshaGap <auth@shikshagap.in>") {
    this.apiKey = key;
    this.fromEmail = from;
  }

  async sendVerificationEmail(email: string, token: string, code: string): Promise<EmailSendResult> {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shikshagap.vercel.app";
      const verifyUrl = `${siteUrl}/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [email],
          subject: "Verify your ShikshaGap Teacher Account",
          html: `
            <h2>Welcome to ShikshaGap</h2>
            <p>Please verify your email address to activate your teacher account.</p>
            <p><strong>Your Verification Code:</strong> <span style="font-size:24px; font-family:monospace; font-weight:bold;">${code}</span></p>
            <p>Or click the link below to verify directly:</p>
            <p><a href="${verifyUrl}" style="background:#2563eb; color:#fff; padding:10px 18px; text-decoration:none; border-radius:4px;">Verify Email Address</a></p>
            <p style="color:#666; font-size:12px;">This link and code will expire in 24 hours.</p>
          `,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        return { success: false, error: `Resend API error: ${res.status} - ${txt.slice(0, 100)}` };
      }

      const json = await res.json();
      return { success: true, providerMessageId: json.id };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "Network error contacting email provider" };
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<EmailSendResult> {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shikshagap.vercel.app";
      const resetUrl = `${siteUrl}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [email],
          subject: "Reset your ShikshaGap Password",
          html: `
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password for your ShikshaGap teacher account.</p>
            <p><a href="${resetUrl}" style="background:#b91c1c; color:#fff; padding:10px 18px; text-decoration:none; border-radius:4px;">Reset Password</a></p>
            <p style="color:#666; font-size:12px;">This link is single-use and will expire in 15 minutes. If you did not request this, please ignore this email.</p>
          `,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        return { success: false, error: `Resend API error: ${res.status} - ${txt.slice(0, 100)}` };
      }

      const json = await res.json();
      return { success: true, providerMessageId: json.id };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "Network error contacting email provider" };
    }
  }
}

class MockEmailProvider implements EmailProvider {
  name = "test_mock";

  async sendVerificationEmail(email: string, token: string, code: string): Promise<EmailSendResult> {
    TEST_EMAIL_INTERCEPTOR.push({
      email,
      type: "verification",
      token,
      code,
      timestamp: Date.now(),
    });
    return { success: true, providerMessageId: `mock_email_${Date.now()}` };
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<EmailSendResult> {
    TEST_EMAIL_INTERCEPTOR.push({
      email,
      type: "password_reset",
      token,
      timestamp: Date.now(),
    });
    return { success: true, providerMessageId: `mock_reset_${Date.now()}` };
  }
}

class UnconfiguredEmailProvider implements EmailProvider {
  name = "unconfigured";

  async sendVerificationEmail(): Promise<EmailSendResult> {
    return {
      success: false,
      error:
        "Email delivery provider is not configured. Please set RESEND_API_KEY in environment variables.",
    };
  }

  async sendPasswordResetEmail(): Promise<EmailSendResult> {
    return {
      success: false,
      error:
        "Email delivery provider is not configured. Please set RESEND_API_KEY in environment variables.",
    };
  }
}

export function getEmailProvider(): EmailProvider {
  if (process.env.NODE_ENV === "test" || process.env.ALLOW_TEST_EMAIL_MOCK === "true") {
    return new MockEmailProvider();
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    return new ResendEmailProvider(resendKey, process.env.EMAIL_FROM);
  }

  return new UnconfiguredEmailProvider();
}

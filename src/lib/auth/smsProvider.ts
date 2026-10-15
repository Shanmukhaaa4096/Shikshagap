/**
 * src/lib/auth/smsProvider.ts
 *
 * Pluggable SMS Provider Adapter for real phone verification.
 * Supports Twilio, Indian SMS gateways (MSG91/HTTP POST), and secure testing harness.
 */

export interface SmsSendResult {
  success: boolean;
  error?: string;
  providerMessageId?: string;
}

export interface SmsProvider {
  name: string;
  sendVerificationOtp(phone: string, otp: string): Promise<SmsSendResult>;
}

// In-memory test interceptor used during automated tests only
export const TEST_SMS_INTERCEPTOR: Array<{ phone: string; otp: string; timestamp: number }> = [];

class TwilioSmsProvider implements SmsProvider {
  name = "twilio";
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(sid: string, token: string, from: string) {
    this.accountSid = sid;
    this.authToken = token;
    this.fromNumber = from;
  }

  async sendVerificationOtp(phone: string, otp: string): Promise<SmsSendResult> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const body = new URLSearchParams({
        To: phone,
        From: this.fromNumber,
        Body: `ShikshaGap: Your verification code is ${otp}. Valid for 10 minutes. Do not share this code.`,
      });

      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { success: false, error: `Twilio API error: ${res.status} - ${errorText.slice(0, 100)}` };
      }

      const json = await res.json();
      return { success: true, providerMessageId: json.sid };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "Network error contacting SMS provider" };
    }
  }
}

class GatewaySmsProvider implements SmsProvider {
  name = "custom_gateway";
  private apiUrl: string;
  private apiKey: string;

  constructor(url: string, key: string) {
    this.apiUrl = url;
    this.apiKey = key;
  }

  async sendVerificationOtp(phone: string, otp: string): Promise<SmsSendResult> {
    try {
      const res = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          recipient: phone,
          message: `ShikshaGap: Your verification code is ${otp}. Valid for 10 minutes. Do not share this code.`,
          otp,
        }),
      });

      if (!res.ok) {
        return { success: false, error: `SMS gateway error: HTTP ${res.status}` };
      }

      const data = await res.json().catch(() => ({}));
      return { success: true, providerMessageId: data.messageId || data.id };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "Network error contacting SMS gateway" };
    }
  }
}

class MockSmsProvider implements SmsProvider {
  name = "test_mock";

  async sendVerificationOtp(phone: string, otp: string): Promise<SmsSendResult> {
    // Record into test interceptor for automated test verification
    TEST_SMS_INTERCEPTOR.push({ phone, otp, timestamp: Date.now() });
    return { success: true, providerMessageId: `mock_sms_${Date.now()}` };
  }
}

class UnconfiguredSmsProvider implements SmsProvider {
  name = "unconfigured";

  async sendVerificationOtp(): Promise<SmsSendResult> {
    return {
      success: false,
      error:
        "SMS gateway is not configured. Please set TWILIO_ACCOUNT_SID & TWILIO_AUTH_TOKEN, or SMS_PROVIDER_URL & SMS_PROVIDER_API_KEY in environment variables.",
    };
  }
}

export function getSmsProvider(): SmsProvider {
  if (process.env.NODE_ENV === "test" || process.env.ALLOW_TEST_SMS_MOCK === "true") {
    return new MockSmsProvider();
  }

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  if (twilioSid && twilioToken && twilioFrom) {
    return new TwilioSmsProvider(twilioSid, twilioToken, twilioFrom);
  }

  const smsUrl = process.env.SMS_PROVIDER_URL;
  const smsKey = process.env.SMS_PROVIDER_API_KEY;
  if (smsUrl && smsKey) {
    return new GatewaySmsProvider(smsUrl, smsKey);
  }

  return new UnconfiguredSmsProvider();
}

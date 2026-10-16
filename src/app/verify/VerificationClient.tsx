"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Phone,
  Envelope,
  CheckCircle,
  Clock,
  ArrowRight,
} from "@phosphor-icons/react";

export default function VerificationClient() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [emailCode, setEmailCode] = useState("");

  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [phoneLoading, setPhoneLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [phoneSuccess, setPhoneSuccess] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  const [phoneCooldown, setPhoneCooldown] = useState(0);
  const [emailCooldown, setEmailCooldown] = useState(0);

  const verifyEmailDirectly = useCallback(async (targetEmail: string, token: string) => {
    setEmailLoading(true);
    setEmailError(null);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, code: token }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailVerified(true);
        setEmailSuccess("Email verified successfully!");
        if (data.phoneVerified) {
          setPhoneVerified(true);
        }
        if (data.active) {
          setTimeout(() => router.push("/app"), 1500);
        }
      } else {
        setEmailError(data.error || "Failed to verify email.");
      }
    } catch {
      setEmailError("Connection error while verifying email.");
    } finally {
      setEmailLoading(false);
    }
  }, [router]);

  // Initialize from URL params if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const paramEmail = params.get("email");
      const paramPhone = params.get("phone");
      const paramToken = params.get("token");

      queueMicrotask(() => {
        if (paramEmail) setEmail(paramEmail);
        if (paramPhone) setPhone(paramPhone);

        // If token provided directly in URL (from email link), auto-verify
        if (paramToken && paramEmail) {
          setEmailCode(paramToken);
          void verifyEmailDirectly(paramEmail, paramToken);
        }
      });
    }
  }, [verifyEmailDirectly]);

  // Cooldown timers
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phoneCooldown > 0) {
      timer = setTimeout(() => setPhoneCooldown(phoneCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [phoneCooldown]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (emailCooldown > 0) {
      timer = setTimeout(() => setEmailCooldown(emailCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [emailCooldown]);

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !phoneOtp.trim()) {
      setPhoneError("Please enter your phone number and 6-digit SMS OTP.");
      return;
    }

    setPhoneLoading(true);
    setPhoneError(null);
    setPhoneSuccess(null);

    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), otp: phoneOtp.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPhoneError(data.error || "Phone verification failed.");
        setPhoneLoading(false);
        return;
      }

      setPhoneVerified(true);
      setPhoneSuccess("Mobile phone verified successfully!");
      if (data.emailVerified) {
        setEmailVerified(true);
      }
      if (data.active) {
        setTimeout(() => router.push("/app"), 1500);
      }
    } catch {
      setPhoneError("Network connection error. Please try again.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !emailCode.trim()) {
      setEmailError("Please enter your email and verification code.");
      return;
    }

    setEmailLoading(true);
    setEmailError(null);
    setEmailSuccess(null);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: emailCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEmailError(data.error || "Email verification failed.");
        setEmailLoading(false);
        return;
      }

      setEmailVerified(true);
      setEmailSuccess("Email verified successfully!");
      if (data.phoneVerified) {
        setPhoneVerified(true);
      }
      if (data.active) {
        setTimeout(() => router.push("/app"), 1500);
      }
    } catch {
      setEmailError("Network connection error. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleResendPhone = async () => {
    if (!phone.trim() || phoneCooldown > 0) return;
    setPhoneError(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "phone", target: phone.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setPhoneSuccess("A fresh SMS code has been sent.");
        setPhoneCooldown(60);
      } else {
        setPhoneError(data.error || "Failed to resend phone OTP.");
      }
    } catch {
      setPhoneError("Network error requesting phone code.");
    }
  };

  const handleResendEmail = async () => {
    if (!email.trim() || emailCooldown > 0) return;
    setEmailError(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "email", target: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailSuccess("A fresh email verification link has been sent.");
        setEmailCooldown(60);
      } else {
        setEmailError(data.error || "Failed to resend email code.");
      }
    } catch {
      setEmailError("Network error requesting email code.");
    }
  };

  const isAllVerified = phoneVerified && emailVerified;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-8 font-sans">
      <div className="w-full max-w-xl mx-auto my-auto py-8">
        <div className="border border-border bg-card text-card-foreground p-6 sm:p-8 rounded-[2px] shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-border">
            <div>
              <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-foreground hover:underline">
                ShikshaGap
              </Link>
              <h1 className="text-sm font-bold uppercase tracking-widest text-foreground/80 dark:text-muted-foreground mt-1">
                Account Ownership Verification
              </h1>
            </div>
            <div className="border border-border px-2.5 py-1 text-xs font-mono uppercase bg-muted text-foreground">
              Security Step 2/2
            </div>
          </div>

          <p className="text-sm text-foreground/80 dark:text-muted-foreground mb-6 leading-relaxed">
            To protect student diagnostic records, ShikshaGap requires verified educator ownership of both your mobile phone (SMS) and institutional email address.
          </p>

          {isAllVerified ? (
            <div className="p-6 bg-[var(--status-good-bg)] border border-[var(--status-good-border)] rounded-[2px] space-y-4 text-center">
              <CheckCircle size={40} className="text-[var(--status-good)] mx-auto" />
              <div>
                <h2 className="text-lg font-bold text-foreground">All Channels Verified!</h2>
                <p className="text-sm text-foreground/80 mt-1">
                  Your teacher account is now fully active. Redirecting to your dashboard...
                </p>
              </div>
              <Link
                href="/app"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-mono font-bold text-sm uppercase rounded-[2px]"
              >
                <span>Enter Educator Dashboard</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Channel 1: Mobile Phone SMS OTP */}
              <div className="border border-border p-4 rounded-[2px] bg-muted/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Phone size={18} className="text-primary" />
                    <span className="font-bold text-sm">Mobile Phone Verification</span>
                  </div>
                  {phoneVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[var(--status-good)] px-2 py-0.5 bg-[var(--status-good-bg)] border border-[var(--status-good-border)] rounded-[2px]">
                      <CheckCircle size={14} /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[var(--status-warn)] px-2 py-0.5 bg-[var(--status-warn-bg)] border border-[var(--status-warn-border)] rounded-[2px]">
                      <Clock size={14} /> Pending SMS OTP
                    </span>
                  )}
                </div>

                {phoneVerified ? (
                  <p className="text-xs text-muted-foreground">Mobile number {phone} is verified.</p>
                ) : (
                  <form onSubmit={handleVerifyPhone} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Mobile number (+91...)"
                        className="min-h-[40px] bg-card border border-border px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary rounded-[2px]"
                      />
                      <input
                        type="text"
                        maxLength={8}
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value)}
                        placeholder="Enter 6-digit SMS OTP"
                        className="min-h-[40px] bg-card border border-border px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary rounded-[2px]"
                      />
                    </div>

                    {phoneError && <p className="text-xs text-[var(--status-urgent)] font-bold">{phoneError}</p>}
                    {phoneSuccess && <p className="text-xs text-[var(--status-good)] font-bold">{phoneSuccess}</p>}

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={handleResendPhone}
                        disabled={phoneCooldown > 0}
                        className="text-xs font-mono text-muted-foreground hover:text-foreground disabled:opacity-50"
                      >
                        {phoneCooldown > 0 ? `Resend SMS in ${phoneCooldown}s` : "Resend SMS OTP"}
                      </button>
                      <button
                        type="submit"
                        disabled={phoneLoading}
                        className="min-h-[36px] px-4 bg-primary text-primary-foreground font-mono font-bold text-xs uppercase rounded-[2px] disabled:opacity-50"
                      >
                        {phoneLoading ? "Verifying..." : "Verify Mobile"}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Channel 2: Email Verification */}
              <div className="border border-border p-4 rounded-[2px] bg-muted/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Envelope size={18} className="text-primary" />
                    <span className="font-bold text-sm">Email Address Verification</span>
                  </div>
                  {emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[var(--status-good)] px-2 py-0.5 bg-[var(--status-good-bg)] border border-[var(--status-good-border)] rounded-[2px]">
                      <CheckCircle size={14} /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[var(--status-warn)] px-2 py-0.5 bg-[var(--status-warn-bg)] border border-[var(--status-warn-border)] rounded-[2px]">
                      <Clock size={14} /> Pending Email Code
                    </span>
                  )}
                </div>

                {emailVerified ? (
                  <p className="text-xs text-muted-foreground">Email address {email} is verified.</p>
                ) : (
                  <form onSubmit={handleVerifyEmail} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="teacher@school.gov.in"
                        className="min-h-[40px] bg-card border border-border px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary rounded-[2px]"
                      />
                      <input
                        type="text"
                        value={emailCode}
                        onChange={(e) => setEmailCode(e.target.value)}
                        placeholder="Enter email code or link token"
                        className="min-h-[40px] bg-card border border-border px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary rounded-[2px]"
                      />
                    </div>

                    {emailError && <p className="text-xs text-[var(--status-urgent)] font-bold">{emailError}</p>}
                    {emailSuccess && <p className="text-xs text-[var(--status-good)] font-bold">{emailSuccess}</p>}

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={handleResendEmail}
                        disabled={emailCooldown > 0}
                        className="text-xs font-mono text-muted-foreground hover:text-foreground disabled:opacity-50"
                      >
                        {emailCooldown > 0 ? `Resend email in ${emailCooldown}s` : "Resend Email Code"}
                      </button>
                      <button
                        type="submit"
                        disabled={emailLoading}
                        className="min-h-[36px] px-4 bg-primary text-primary-foreground font-mono font-bold text-xs uppercase rounded-[2px] disabled:opacity-50"
                      >
                        {emailLoading ? "Verifying..." : "Verify Email"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <Link href="/login" className="hover:underline">
              &larr; Return to Login
            </Link>
            <span className="font-mono text-xs">DPDP Act 2023 Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata: Metadata = {
  title: `Forgot Password | ${siteConfig.siteName}`,
  description: "Request a password reset link for your ShikshaGap teacher account.",
  openGraph: {
    title: `Forgot Password | ${siteConfig.siteName}`,
    description: "Request a password reset link for your ShikshaGap teacher account.",
    url: `${siteConfig.siteUrl}/forgot-password`,
    siteName: siteConfig.siteName,
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/forgot-password`,
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}

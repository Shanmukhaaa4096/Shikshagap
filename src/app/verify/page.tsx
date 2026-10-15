import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import VerificationClient from "./VerificationClient";

export const metadata: Metadata = {
  title: `Account Verification | ${siteConfig.siteName}`,
  description: "Verify your mobile phone and email address to activate your ShikshaGap teacher account.",
  openGraph: {
    title: `Account Verification | ${siteConfig.siteName}`,
    description: "Verify your mobile phone and email address to activate your ShikshaGap teacher account.",
    url: `${siteConfig.siteUrl}/verify`,
    siteName: siteConfig.siteName,
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/verify`,
  },
};

export default function VerifyPage() {
  return <VerificationClient />;
}

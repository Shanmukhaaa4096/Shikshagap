import type { Metadata } from "next";
import { Suspense } from "react";
import { siteConfig } from "@/config/site";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata: Metadata = {
  title: `Reset Password | ${siteConfig.siteName}`,
  description: "Reset your ShikshaGap teacher account password.",
  openGraph: {
    title: `Reset Password | ${siteConfig.siteName}`,
    description: "Reset your ShikshaGap teacher account password.",
    url: `${siteConfig.siteUrl}/reset-password`,
    siteName: siteConfig.siteName,
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/reset-password`,
  },
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}

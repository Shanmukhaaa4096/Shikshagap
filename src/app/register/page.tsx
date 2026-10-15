import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import TeacherRegisterClient from "./TeacherRegisterClient";

export const metadata: Metadata = {
  title: `Teacher Registration | ${siteConfig.siteName}`,
  description: "Register a verified teacher account on ShikshaGap to conduct student diagnostics and track learning gaps.",
  openGraph: {
    title: `Teacher Registration | ${siteConfig.siteName}`,
    description: "Register a verified teacher account on ShikshaGap to conduct student diagnostics and track learning gaps.",
    url: `${siteConfig.siteUrl}/register`,
    siteName: siteConfig.siteName,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${siteConfig.siteName} Registration` }],
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/register`,
  },
};

export default function RegisterPage() {
  return <TeacherRegisterClient />;
}

import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import DataRequestForm from "./DataRequestForm";

export const metadata: Metadata = {
  title: `Data Rights & Request Form | ${siteConfig.siteName}`,
  description: "Exercise your rights under DPDP Act 2023: Request access to, correction of, or deletion of student diagnostic data.",
  openGraph: {
    title: `Data Rights & Request Form | ${siteConfig.siteName}`,
    description: "Exercise your rights under DPDP Act 2023: Request access to, correction of, or deletion of student diagnostic data.",
    url: `${siteConfig.siteUrl}/data-request`,
    siteName: siteConfig.siteName,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${siteConfig.siteName} Data Request Form` }],
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/data-request`,
  },
};

export default function DataRequestPage() {
  return <DataRequestForm />;
}

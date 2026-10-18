import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import DataRequestForm from "./DataRequestForm";

export const metadata: Metadata = {
  title: `Data Rights & Request Form | ${siteConfig.siteName}`,
  description:
    "Exercise student data rights under India's DPDP Act 2023: Request access to, correction of, or permanent deletion of student diagnostic assessment records.",
  openGraph: {
    title: `Data Rights & Request Form | ${siteConfig.siteName}`,
    description:
      "Exercise student data rights under India's DPDP Act 2023: Request access to, correction of, or permanent deletion of student diagnostic assessment records.",
    url: `${siteConfig.siteUrl}/data-request`,
    siteName: siteConfig.siteName,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${siteConfig.siteName} Data Request Form` }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Data Rights & Request Form | ${siteConfig.siteName}`,
    description:
      "Exercise student data rights under India's DPDP Act 2023: Request access to, correction of, or permanent deletion of student diagnostic assessment records.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/data-request`,
  },
};

export default function DataRequestPage() {
  return <DataRequestForm />;
}

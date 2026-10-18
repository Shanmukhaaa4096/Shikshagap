import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import AssessmentClient from './AssessmentClient';

export const metadata: Metadata = {
  title: `Free Student Maths Assessment & Learning Gap Diagnostic | ${siteConfig.siteName}`,
  description:
    "Take a free adaptive maths diagnostic check for Classes 1 to 10 aligned to NCERT and ICSE syllabi. Pinpoints prerequisite learning gaps with a 5-day action plan.",
  openGraph: {
    title: `Free Student Maths Assessment | ${siteConfig.siteName}`,
    description:
      "Take a free adaptive maths diagnostic check for Classes 1 to 10 aligned to NCERT and ICSE syllabi. Pinpoints prerequisite learning gaps with a 5-day action plan.",
    url: `${siteConfig.siteUrl}/assessment`,
    siteName: siteConfig.siteName,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${siteConfig.siteName} Adaptive Assessment` }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Free Student Maths Assessment | ${siteConfig.siteName}`,
    description:
      "Take a free adaptive maths diagnostic check for Classes 1 to 10 aligned to NCERT and ICSE syllabi. Pinpoints prerequisite learning gaps with a 5-day action plan.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/assessment`,
  },
};

export default function AssessmentPage() {
  return <AssessmentClient />;
}

import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import AssessmentClient from './AssessmentClient';
import { LIVE_CLASS_RANGE_LABEL } from '@/lib/coverage';

export const metadata: Metadata = {
  title: `Free Student Maths Assessment & Learning Gap Diagnostic | ${siteConfig.siteName}`,
  description:
    `Take a free adaptive maths diagnostic check for ${LIVE_CLASS_RANGE_LABEL} (with Classes 1, 2, 6 to 10 in preparation) across NCERT (CBSE) and ICSE syllabi. Pinpoints prerequisite learning gaps with a 5-day action plan.`,
  openGraph: {
    title: `Free Student Maths Assessment | ${siteConfig.siteName}`,
    description:
      `Take a free adaptive maths diagnostic check for ${LIVE_CLASS_RANGE_LABEL} (with Classes 1, 2, 6 to 10 in preparation) across NCERT (CBSE) and ICSE syllabi. Pinpoints prerequisite learning gaps with a 5-day action plan.`,
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
      `Take a free adaptive maths diagnostic check for ${LIVE_CLASS_RANGE_LABEL} (with Classes 1, 2, 6 to 10 in preparation) across NCERT (CBSE) and ICSE syllabi. Pinpoints prerequisite learning gaps with a 5-day action plan.`,
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/assessment`,
  },
};

export default function AssessmentPage() {
  return <AssessmentClient />;
}

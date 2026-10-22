import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import HowItWorksClient from './HowItWorksClient';

export const metadata: Metadata = {
  title: `How It Works | ${siteConfig.siteName}`,
  description:
    "Learn how ShikshaGap traces prerequisite learning gaps across Classes 3 to 5 maths (with more classes in preparation) using adaptive testing, NCERT (CBSE) and ICSE concept graphs, and 5-day action plans.",
  openGraph: {
    title: `How It Works | ${siteConfig.siteName}`,
    description:
      "Learn how ShikshaGap traces prerequisite learning gaps across Classes 3 to 5 maths (with more classes in preparation) using adaptive testing, NCERT (CBSE) and ICSE concept graphs, and 5-day action plans.",
    url: `${siteConfig.siteUrl}/how-it-works`,
    siteName: siteConfig.siteName,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${siteConfig.siteName} How It Works` }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `How It Works | ${siteConfig.siteName}`,
    description:
      "Learn how ShikshaGap traces prerequisite learning gaps across Classes 3 to 5 maths (with more classes in preparation) using adaptive testing, NCERT (CBSE) and ICSE concept graphs, and 5-day action plans.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/how-it-works`,
  },
};

export default function HowItWorksPage() {
  return <HowItWorksClient />;
}

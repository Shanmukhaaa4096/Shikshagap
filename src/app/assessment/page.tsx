import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import AssessmentClient from './AssessmentClient';

export const metadata: Metadata = {
  title: `Free Student Maths Assessment & Learning Gap Diagnostic | ${siteConfig.siteName}`,
  description:
    'Start a 6-minute adaptive diagnostic check for Classes 3, 4, or 5 mathematics. No sign-in required. Identifies prerequisite gaps with an actionable 5-day classroom remediation plan.',
  openGraph: {
    title: `Free Student Maths Assessment | ${siteConfig.siteName}`,
    description:
      'Adaptive learning-gap assessment for Indian school students in English, Hindi, and Telugu. Zero child surveillance and instant gap diagnosis.',
    url: `${siteConfig.siteUrl}/assessment`,
    siteName: siteConfig.siteName,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${siteConfig.siteName} Adaptive Assessment` }],
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/assessment`,
  },
};

export default function AssessmentPage() {
  return <AssessmentClient />;
}

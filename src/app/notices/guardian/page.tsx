import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import GuardianNoticeClient from './GuardianNoticeClient';

export const metadata: Metadata = {
  title: `Parent & Guardian Notice | ${siteConfig.siteName}`,
  description: 'Download and print the official parent/guardian DPDP Act 2023 consent record for primary school diagnostic checks in English, Hindi, and Telugu.',
  openGraph: {
    title: `Parent & Guardian Notice | ${siteConfig.siteName}`,
    description: 'Download and print the official parent/guardian DPDP Act 2023 consent record for primary school diagnostic checks in English, Hindi, and Telugu.',
    url: `${siteConfig.siteUrl}/notices/guardian`,
    siteName: siteConfig.siteName,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${siteConfig.siteName} Guardian Notice` }],
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/notices/guardian`,
  },
};

export default function GuardianNoticePage() {
  return <GuardianNoticeClient />;
}

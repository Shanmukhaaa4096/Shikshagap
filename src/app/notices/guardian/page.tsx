import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import GuardianNoticeClient from './GuardianNoticeClient';

export const metadata: Metadata = {
  title: `Parent & Guardian Notice | ${siteConfig.siteName}`,
  description:
    "Official parent and guardian notice under India's DPDP Act 2023 for school mathematics diagnostic checks, with trilingual consent forms in EN, HI, and TE.",
  openGraph: {
    title: `Parent & Guardian Notice | ${siteConfig.siteName}`,
    description:
      "Official parent and guardian notice under India's DPDP Act 2023 for school mathematics diagnostic checks, with trilingual consent forms in EN, HI, and TE.",
    url: `${siteConfig.siteUrl}/notices/guardian`,
    siteName: siteConfig.siteName,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${siteConfig.siteName} Guardian Notice` }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Parent & Guardian Notice | ${siteConfig.siteName}`,
    description:
      "Official parent and guardian notice under India's DPDP Act 2023 for school mathematics diagnostic checks, with trilingual consent forms in EN, HI, and TE.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/notices/guardian`,
  },
};

export default function GuardianNoticePage() {
  return <GuardianNoticeClient />;
}

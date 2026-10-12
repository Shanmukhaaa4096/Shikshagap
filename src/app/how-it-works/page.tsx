import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import HowItWorksClient from './HowItWorksClient';

export const metadata: Metadata = {
  title: `How It Works | ${siteConfig.siteName}`,
  description: 'Learn how ShikshaGap traces prerequisite learning gaps in primary mathematics using diagnostic algorithms.',
  openGraph: {
    title: `How It Works | ${siteConfig.siteName}`,
    description: 'Learn how ShikshaGap traces prerequisite learning gaps in primary mathematics using diagnostic algorithms.',
    url: `${siteConfig.siteUrl}/how-it-works`,
    siteName: siteConfig.siteName,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${siteConfig.siteName} How It Works` }],
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/how-it-works`,
  },
};

export default function HowItWorksPage() {
  return <HowItWorksClient />;
}

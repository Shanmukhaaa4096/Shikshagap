import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import PublicLandingPage from './LandingPageClient';
import { FAQS } from '@/data/faqs';

export const metadata: Metadata = {
  title: `${siteConfig.siteName} | Find out what each student needs to learn next`,
  description:
    'ShikshaGap checks a student\'s understanding, finds the topics that need more practice and helps teachers plan the next lesson in Indian primary schools.',
  openGraph: {
    title: `${siteConfig.siteName} | Primary School Learning Diagnostic`,
    description:
      'ShikshaGap checks a student\'s understanding, finds the topics that need more practice and helps teachers plan the next lesson in Indian primary schools.',
    url: siteConfig.siteUrl,
    siteName: siteConfig.siteName,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${siteConfig.siteName} - Primary Mathematics Diagnostic`,
      },
    ],
  },
  alternates: {
    canonical: siteConfig.siteUrl,
  },
};

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        'name': siteConfig.siteName,
        'url': siteConfig.siteUrl,
        'logo': `${siteConfig.siteUrl}/icon.svg`,
        'contactPoint': {
          '@type': 'ContactPoint',
          'email': siteConfig.contactEmail,
          'contactType': 'Educational Support',
        },
      },
      {
        '@type': 'WebSite',
        'name': siteConfig.siteName,
        'url': siteConfig.siteUrl,
        'description':
          'AI educational diagnostic agent identifying foundational learning gaps in primary mathematics.',
      },
      {
        '@type': 'FAQPage',
        'mainEntity': FAQS.map((faq) => ({
          '@type': 'Question',
          'name': faq.q,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': faq.a,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicLandingPage />
    </>
  );
}

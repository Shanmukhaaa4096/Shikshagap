import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import PublicLandingPage from './LandingPageClient';
import { FAQS } from '@/data/faqs';

import { LIVE_CLASS_RANGE_LABEL } from '@/lib/coverage';

export const metadata: Metadata = {
  title: `${siteConfig.siteName} | Find out what each student needs to learn next`,
  description:
    `ShikshaGap detects learning gaps in school maths for ${LIVE_CLASS_RANGE_LABEL} (with more classes in preparation) across NCERT (CBSE) and ICSE, giving teachers root-cause insights and targeted practice plans.`,
  openGraph: {
    title: `${siteConfig.siteName} | Find out what each student needs to learn next`,
    description:
      `ShikshaGap detects learning gaps in school maths for ${LIVE_CLASS_RANGE_LABEL} (with more classes in preparation) across NCERT (CBSE) and ICSE, giving teachers root-cause insights and targeted practice plans.`,
    url: siteConfig.siteUrl,
    siteName: siteConfig.siteName,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${siteConfig.siteName} - Mathematics Learning Diagnostic`,
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.siteName} | Find out what each student needs to learn next`,
    description:
      `ShikshaGap detects learning gaps in school maths for ${LIVE_CLASS_RANGE_LABEL} (with more classes in preparation) across NCERT (CBSE) and ICSE, giving teachers root-cause insights and targeted practice plans.`,
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: siteConfig.siteUrl,
    languages: {
      "en": siteConfig.siteUrl,
      "x-default": siteConfig.siteUrl,
    },
  },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "name": siteConfig.legalEntityName || "ShikshaGap Educational Initiative",
        "url": siteConfig.siteUrl,
        "logo": `${siteConfig.siteUrl}/icon.svg`,
        "description":
          "Non-profit educational initiative providing diagnostic assessment and prerequisite remediation tools for Indian schools.",
        "contactPoint": {
          "@type": "ContactPoint",
          "email": siteConfig.contactEmail,
          "contactType": "Educational Support",
        },
      },
      {
        "@type": "SoftwareApplication",
        "name": siteConfig.siteName,
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "Any modern web browser",
        "url": siteConfig.siteUrl,
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "INR",
        },
        "description":
          `Adaptive diagnostic assessment detecting prerequisite learning gaps in school mathematics across ${LIVE_CLASS_RANGE_LABEL} (with more classes in preparation) for NCERT (CBSE) and ICSE syllabi.`,
      },
      {
        "@type": "WebSite",
        "name": siteConfig.siteName,
        "url": siteConfig.siteUrl,
        "description":
          `AI educational diagnostic agent identifying prerequisite learning gaps in school mathematics for ${LIVE_CLASS_RANGE_LABEL} (with more classes in preparation).`,
      },
      {
        "@type": "FAQPage",
        "mainEntity": FAQS.map((faq) => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a,
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

import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: `Staff Login | ${siteConfig.siteName}`,
  description: 'Authorized access portal for verified teachers and school administrators using the ShikshaGap diagnostic platform.',
  openGraph: {
    title: `Staff Login | ${siteConfig.siteName}`,
    description: 'Authorized access portal for verified teachers and school administrators using the ShikshaGap diagnostic platform.',
    url: `${siteConfig.siteUrl}/login`,
    siteName: siteConfig.siteName,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${siteConfig.siteName} Login` }],
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/login`,
  },
};

export default function LoginPage() {
  return <LoginForm />;
}

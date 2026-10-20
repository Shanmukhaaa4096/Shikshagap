import type { Metadata } from 'next';
import { Suspense } from 'react';
import { siteConfig } from '@/config/site';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: `Teacher Login | ${siteConfig.siteName}`,
  description: 'Authorized access portal for verified teachers and school educators with Google Sign-In and institutional credentials.',
  openGraph: {
    title: `Teacher Login | ${siteConfig.siteName}`,
    description: 'Authorized access portal for verified teachers and school educators with Google Sign-In and institutional credentials.',
    url: `${siteConfig.siteUrl}/login`,
    siteName: siteConfig.siteName,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${siteConfig.siteName} Login` }],
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/login`,
  },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-sm font-mono text-muted-foreground">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

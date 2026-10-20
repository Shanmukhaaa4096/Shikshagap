import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

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

interface LoginPageProps {
  searchParams?: Promise<{ error?: string; redirect?: string }> | { error?: string; redirect?: string };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolved = await Promise.resolve(searchParams);
  const initialError = resolved?.error === 'auth_callback_failed'
    ? 'Google authentication failed or was cancelled. Please try again.'
    : null;
  const initialRedirect = resolved?.redirect || '/app';

  return <LoginForm initialError={initialError} initialRedirect={initialRedirect} />;
}

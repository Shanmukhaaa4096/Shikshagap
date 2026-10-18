import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.siteUrl;

  const publicAllowed = [
    '/',
    '/assessment',
    '/how-it-works',
    '/learning-gaps',
    '/curriculum/classes-1-3',
    '/curriculum/classes-4-5',
    '/curriculum/classes-6-8',
    '/curriculum/classes-9-10',
    '/privacy',
    '/terms',
    '/cookies',
    '/licenses',
    '/data-request',
    '/notices/guardian',
    '/llms.txt',
    '/ai.txt',
    '/ads.txt',
    '/humans.txt',
    '/.well-known/security.txt',
  ];

  const privateDisallowed = [
    '/app',
    '/app/',
    '/api',
    '/api/',
    '/login',
    '/login/',
    '/register',
    '/register/',
    '/verify',
    '/verify/',
    '/forgot-password',
    '/forgot-password/',
    '/reset-password',
    '/reset-password/',
    '/report',
    '/report/',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: publicAllowed,
        disallow: privateDisallowed,
      },
      {
        userAgent: 'Googlebot',
        allow: publicAllowed,
        disallow: privateDisallowed,
      },
      {
        userAgent: 'Bingbot',
        allow: publicAllowed,
        disallow: privateDisallowed,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.siteUrl;

  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/privacy',
        '/terms',
        '/cookies',
        '/licenses',
        '/data-request',
        '/how-it-works',
        '/assessment',
        '/notices/guardian',
      ],
      disallow: ['/app', '/app/', '/api', '/api/', '/login', '/login/', '/report', '/report/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

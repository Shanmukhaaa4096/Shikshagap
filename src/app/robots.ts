import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://shikshagap.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/login',
        '/privacy',
        '/terms',
        '/cookies',
        '/licenses',
        '/data-request',
        '/how-it-works',
        '/notices/guardian',
      ],
      disallow: ['/app', '/app/', '/api', '/api/', '/report', '/report/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

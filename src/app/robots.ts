import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://shikshagap.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/privacy', '/terms', '/cookies', '/licenses', '/data-request'],
      disallow: ['/app', '/app/', '/api', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

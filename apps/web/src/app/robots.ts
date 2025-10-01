import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_CANONICAL_BASE_URL || 'https://www.example.com';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: [`${base}/sitemap.xml`],
  };
}


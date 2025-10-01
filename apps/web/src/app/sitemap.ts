import type { MetadataRoute } from 'next';
import { fetchAllPropertySlugs } from '@/lib/strapi';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_CANONICAL_BASE_URL || 'https://www.example.com';
  const locales = ['en', 'tr', 'ru'] as const;
  const urls: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    urls.push({ url: `${base}/${locale}`, lastModified: new Date() });
    const slugs = await fetchAllPropertySlugs(locale);
    for (const slug of slugs) urls.push({ url: `${base}/${locale}/properties/${slug}`, lastModified: new Date() });
  }
  return urls;
}


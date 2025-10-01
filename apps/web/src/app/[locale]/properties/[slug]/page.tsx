import { fetchAllPropertySlugs, fetchPropertyBySlug, buildSeoMetadata } from '@/lib/strapi';
import type { Metadata } from 'next';
import React from 'react';

function JsonLd({ json }: { json: Record<string, unknown> }) {
  return <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const locales = ['en', 'tr', 'ru'] as const;
  const params: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    const slugs = await fetchAllPropertySlugs(locale);
    for (const slug of slugs) params.push({ locale, slug });
  }
  return params;
}

export default async function PropertyDetail({ params }: { params: { locale: 'en' | 'tr' | 'ru'; slug: string } }) {
  const data = await fetchPropertyBySlug(params.locale, params.slug);
  const prop = Array.isArray(data?.data) ? data.data[0] : null;
  if (!prop) return <main>Not found</main>;
  const a = prop.attributes;
  const base = process.env.NEXT_PUBLIC_CANONICAL_BASE_URL || 'https://www.example.com';
  type MediaItem = { attributes?: { url?: string } };
  const images = Array.isArray(a.images?.data)
    ? (a.images.data as MediaItem[]).map((img) => img?.attributes?.url).filter((u): u is string => Boolean(u))
    : [];
  const absoluteImages = images.map((u: string) => (u.startsWith('http') ? u : `${base}${u}`));
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Residence',
    name: a.title,
    url: `${base}/${params.locale}/properties/${params.slug}`,
    description: a.seo?.metaDescription || a.description?.slice(0, 160),
    numberOfRoomsTotal: a.bedrooms,
    numberOfBathroomsTotal: a.bathrooms,
    floorSize: a.area ? { '@type': 'QuantitativeValue', value: a.area, unitCode: 'MTK' } : undefined,
    image: absoluteImages,
    offers: a.price
      ? {
          '@type': 'Offer',
          price: a.price,
          priceCurrency: a.currency || 'TRY',
          availability: 'https://schema.org/InStock',
        }
      : undefined,
  };
  return (
    <main>
      <h1>{a.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: a.description }} />
      <JsonLd json={ld} />
    </main>
  );
}

type PropertyResponse = {
  data?: Array<{ attributes?: { seo?: Record<string, unknown>; localizations?: { data?: Array<{ attributes?: { locale?: string; slug?: string } }> } } }>;
};

export async function generateMetadata({ params }: { params: { locale: 'en' | 'tr' | 'ru'; slug: string } }): Promise<Metadata> {
  const data = (await fetchPropertyBySlug(params.locale, params.slug)) as unknown as PropertyResponse;
  const prop = Array.isArray(data?.data) ? data.data[0] : null;
  const seo = prop?.attributes?.seo || {};
  const localizations = prop?.attributes?.localizations?.data || [];
  const base = process.env.NEXT_PUBLIC_CANONICAL_BASE_URL || 'https://www.example.com';
  const languages: Record<string, string> = { [params.locale]: `${base}/${params.locale}/properties/${params.slug}` };
  for (const loc of localizations as { attributes?: { locale?: string; slug?: string } }[]) {
    const code = loc?.attributes?.locale as 'en' | 'tr' | 'ru' | undefined;
    const slug = loc?.attributes?.slug as string | undefined;
    if (code && slug) languages[code] = `${base}/${code}/properties/${slug}`;
  }
  return buildSeoMetadata(seo, languages[params.locale], {
    locale: params.locale,
    languageAlternates: languages,
    type: 'article',
  }) as Metadata;
}



import type { Metadata } from 'next';
import { use } from 'react';
import '../globals.css';
import { fetchGlobal, buildSeoMetadata } from '@/lib/strapi';

export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'tr' }, { locale: 'ru' }];
}

type GlobalResponse = {
  data?: {
    attributes?: {
      siteName?: string;
      defaultSeo?: {
        metaTitle?: string;
        metaDescription?: string;
        canonicalURL?: string;
        ogTitle?: string;
        ogDescription?: string;
        ogImage?: { data?: { attributes?: { url?: string } } };
      };
    };
  };
};

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en' | 'tr' | 'ru' }> }): Promise<Metadata> {
  const { locale } = await params;
  const data = (await fetchGlobal(locale)) as unknown as GlobalResponse;
  const seo = data?.data?.attributes?.defaultSeo as {
    metaTitle?: string;
    metaDescription?: string;
    canonicalURL?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: { data?: Array<{ attributes?: { url?: string } }> | { attributes?: { url?: string } } };
  } | undefined;
  const siteName = data?.data?.attributes?.siteName || 'Kadir Emlak';
  const base = process.env.NEXT_PUBLIC_CANONICAL_BASE_URL || 'https://www.example.com';
  const languages = {
    en: `${base}/en`,
    tr: `${base}/tr`,
    ru: `${base}/ru`,
  } as const;
  // Normalize ogImage into the MediaRelation shape expected by buildSeoMetadata
  const normalizedSeo = seo
    ? {
        ...seo,
        ogImage: seo.ogImage
          ? {
              data: Array.isArray(seo.ogImage.data)
                ? seo.ogImage.data.map((d) => ({ id: 0, attributes: { url: d?.attributes?.url } }))
                : seo.ogImage.data
                ? { id: 0, attributes: { url: (seo.ogImage.data as { attributes?: { url?: string } })?.attributes?.url } }
                : null,
            }
          : undefined,
      }
    : undefined;

  return buildSeoMetadata((normalizedSeo as unknown) as {
    metaTitle?: string;
    metaDescription?: string;
    canonicalURL?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: { data?: Array<{ id: number; attributes?: { url?: string } }> | { id: number; attributes?: { url?: string } } | null };
  }, `${base}/${locale}`, {
    locale,
    siteName,
    languageAlternates: languages,
    type: 'website',
  }) as Metadata;
}

export default function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: 'en' | 'tr' | 'ru' }> }) {
  const { locale } = use(params);
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}



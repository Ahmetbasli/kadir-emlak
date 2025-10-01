import { strapi as createStrapiClient } from '@strapi/client';
import type { Metadata } from 'next';
import type {
  Locale,
  StrapiListResponse,
  StrapiSingleResponse,
  PropertyAttributes,
  GlobalAttributes,
  Seo,
} from '@/types/cms';

const baseURL = `${process.env.STRAPI_BASE_URL || 'http://localhost:1337'}/api`;
const client = createStrapiClient({ baseURL });

export async function fetchAllProperties(locale: Locale): Promise<StrapiListResponse<PropertyAttributes>> {
  return (await client.collection('properties').find({
    locale,
    sort: 'publishedAt:desc',
    pagination: { pageSize: 1000 },
    populate: { images: '*', location: '*', agent: '*', seo: '*' },
  })) as unknown as StrapiListResponse<PropertyAttributes>;
}

export async function fetchPropertyBySlug(
  locale: Locale,
  slug: string
): Promise<StrapiListResponse<PropertyAttributes>> {
  return (await client.collection('properties').find({
    locale,
    filters: { slug: { $eq: slug } },
    populate: { images: '*', location: '*', agent: '*', seo: '*', localizations: '*' },
  })) as unknown as StrapiListResponse<PropertyAttributes>;
}

export async function fetchAllPropertySlugs(locale: Locale): Promise<string[]> {
  const data = (await client.collection('properties').find({
    locale,
    fields: ['slug'],
    pagination: { pageSize: 1000 },
  })) as unknown as StrapiListResponse<PropertyAttributes>;
  const items = Array.isArray(data?.data) ? data.data : [];
  return items.map((item) => item.attributes?.slug).filter(Boolean) as string[];
}

export async function fetchGlobal(locale: Locale): Promise<StrapiSingleResponse<GlobalAttributes>> {
  return (await client.single('global').find({
    locale,
    populate: { defaultSeo: { populate: ['ogImage'] } },
  })) as unknown as StrapiSingleResponse<GlobalAttributes>;
}

export function buildSeoMetadata(
  seo: Seo = {},
  url: string,
  options?: {
    locale?: Locale;
    siteName?: string;
    languageAlternates?: Record<string, string>;
    type?: 'website' | 'article';
  }
): Metadata {
  const siteName = options?.siteName || 'Kadir Emlak';
  const title = seo?.metaTitle || seo?.ogTitle || siteName;
  const description = seo?.metaDescription || seo?.ogDescription || 'Real estate listings';
  const rel = seo?.ogImage?.data;
  const ogImageUrl: string | undefined = Array.isArray(rel)
    ? rel?.[0]?.attributes?.url
    : (rel as { attributes?: { url?: string } } | undefined)?.attributes?.url;
  const base = process.env.NEXT_PUBLIC_CANONICAL_BASE_URL || 'https://www.example.com';
  const absoluteOg = ogImageUrl?.startsWith('http') ? ogImageUrl : ogImageUrl ? `${base}${ogImageUrl}` : undefined;

  const metadataBase = new URL(base);
  const md: Metadata = {
    metadataBase,
    title,
    description,
    alternates: {
      canonical: seo?.canonicalURL || url,
      languages: options?.languageAlternates,
    },
    openGraph: {
      siteName,
      type: options?.type || 'website',
      title,
      description,
      url,
      locale: options?.locale,
      images: absoluteOg ? [{ url: absoluteOg } as { url: string }] : undefined,
    },
    twitter: {
      card: absoluteOg ? 'summary_large_image' : 'summary',
      title,
      description,
      images: absoluteOg ? [absoluteOg] : undefined,
    },
  };

  return md;
}



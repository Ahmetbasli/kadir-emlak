export type Locale = 'en' | 'tr' | 'ru';

export interface MediaFileAttributes {
  url?: string;
}

export interface MediaRelation {
  data?: Array<{ id: number; attributes?: MediaFileAttributes }> | { id: number; attributes?: MediaFileAttributes } | null;
}

export interface Seo {
  metaTitle?: string;
  metaDescription?: string;
  canonicalURL?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: MediaRelation;
}

export interface LocationAttributes {
  name?: string;
  slug?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
}

export interface AgentAttributes {
  name?: string;
  phone?: string;
  email?: string;
}

export interface PropertyAttributes {
  title?: string;
  slug?: string;
  description?: string;
  price?: number;
  currency?: 'TRY' | 'USD' | 'EUR';
  type?: 'apartment' | 'house' | 'land' | 'commercial';
  status?: 'for-sale' | 'for-rent' | 'sold';
  images?: MediaRelation;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  amenities?: unknown;
  location?: { data?: { id: number; attributes?: LocationAttributes } | null };
  agent?: { data?: { id: number; attributes?: AgentAttributes } | null };
  seo?: Seo;
  localizations?: { data?: Array<{ id: number; attributes?: { locale?: Locale; slug?: string } }> };
}

export interface GlobalAttributes {
  siteName?: string;
  defaultSeo?: Seo;
}

export interface StrapiListResponse<T> {
  data: Array<{ id: number; attributes: T }>;
  meta?: unknown;
}

export interface StrapiSingleResponse<T> {
  data: { id: number; attributes: T } | null;
  meta?: unknown;
}



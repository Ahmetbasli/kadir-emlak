import Link from 'next/link';
import { fetchAllProperties } from '@/lib/strapi';

type PropertyEntity = { id: number | string; attributes?: { slug?: string; title?: string } };

export default async function HomeLocalePage({ params }: { params: { locale: 'en' | 'tr' | 'ru' } }) {
  const data = await fetchAllProperties(params.locale);
  const items = Array.isArray(data?.data) ? data.data : [];
  return (
    <main>
      <h1>Home - {params.locale}</h1>
      <ul>
        {items.map((item: PropertyEntity) => {
          const a = item.attributes;
          return (
            <li key={item.id}>
              <Link href={`/${params.locale}/properties/${a.slug}`}>{a.title}</Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}



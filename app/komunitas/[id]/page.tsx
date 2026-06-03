import KomunitasDetailClient from './KomunitasDetailClient';
import { STATIC_ARTICLES } from '@/lib/static-data';

export const dynamicParams = false;

export function generateStaticParams() {
  return STATIC_ARTICLES.map((article) => ({ id: article.id }));
}

export default async function KomunitasDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <KomunitasDetailClient id={id} />;
}

import StoreDetailClient from './StoreDetailClient';
import { STATIC_STORES } from '@/lib/static-data';

export const dynamicParams = false;

export function generateStaticParams() {
  return STATIC_STORES.map((store) => ({ id: store.id }));
}

export default async function PublicStoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StoreDetailClient storeId={id} />;
}

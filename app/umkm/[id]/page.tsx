import ProductDetailClient from './ProductDetailClient';
import { STATIC_PRODUCTS } from '@/lib/static-data';

export const dynamicParams = false;

export function generateStaticParams() {
  return STATIC_PRODUCTS.map((product) => ({ id: product.id }));
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailClient productId={id} />;
}

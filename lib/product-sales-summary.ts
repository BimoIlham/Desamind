import { getSupabaseServerClient } from '@/lib/supabase-server';

const SOLD_STATUSES = ['terbayar', 'diproses', 'dikirim', 'selesai'];

type SellableProduct = {
  id: string;
  sales_count?: number | null;
};

export async function withSalesSummaries<T extends SellableProduct>(products: T[]) {
  const supabase = getSupabaseServerClient();
  const productIds = [...new Set(products.map((product) => product.id).filter(Boolean))];

  if (!supabase || productIds.length === 0) return products;

  const { data, error } = await supabase
    .from('order_items')
    .select('product_id, quantity, orders!inner(status)')
    .in('product_id', productIds)
    .in('orders.status', SOLD_STATUSES);

  if (error) {
    console.error('[API] Failed to summarize product sales:', error);
    return products;
  }

  const sales = new Map<string, number>();

  for (const item of data ?? []) {
    const productId = item.product_id;
    if (!productId) continue;
    sales.set(productId, (sales.get(productId) ?? 0) + Number(item.quantity || 0));
  }

  return products.map((product) => ({
    ...product,
    sales_count: sales.get(product.id) ?? Number(product.sales_count ?? 0),
  }));
}

export async function withSalesSummary<T extends SellableProduct>(product: T | null) {
  if (!product) return null;
  const [summarized] = await withSalesSummaries([product]);
  return summarized ?? product;
}

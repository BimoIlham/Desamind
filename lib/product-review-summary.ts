import { getSupabaseServerClient } from '@/lib/supabase-server';

type ReviewableProduct = {
  id: string;
  rating?: number | null;
  reviews_count?: number | null;
};

export async function withReviewSummaries<T extends ReviewableProduct>(products: T[]) {
  const supabase = getSupabaseServerClient();
  const productIds = [...new Set(products.map((product) => product.id).filter(Boolean))];

  if (!supabase || productIds.length === 0) return products;

  const { data, error } = await supabase
    .from('reviews')
    .select('product_id, rating')
    .in('product_id', productIds);

  if (error) {
    console.error('[API] Failed to summarize product reviews:', error);
    return products;
  }

  const summaries = new Map<string, { total: number; count: number }>();

  for (const review of data ?? []) {
    const productId = review.product_id;
    if (!productId) continue;

    const current = summaries.get(productId) ?? { total: 0, count: 0 };
    current.total += Number(review.rating || 0);
    current.count += 1;
    summaries.set(productId, current);
  }

  return products.map((product) => {
    const summary = summaries.get(product.id);
    if (!summary || summary.count === 0) {
      return {
        ...product,
        rating: Number(product.rating ?? 0),
        reviews_count: 0,
      };
    }

    return {
      ...product,
      rating: summary.total / summary.count,
      reviews_count: summary.count,
    };
  });
}

export async function withReviewSummary<T extends ReviewableProduct>(product: T | null) {
  if (!product) return null;
  const [summarized] = await withReviewSummaries([product]);
  return summarized ?? product;
}

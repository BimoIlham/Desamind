import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

const SOLD_STATUSES = ['terbayar', 'diproses', 'dikirim', 'selesai'];

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({
      activeStores: 0,
      verifiedStores: 0,
      soldProducts: 0,
      averageRating: 0,
      reviewsCount: 0,
    });
  }

  const [
    activeStoresResult,
    soldItemsResult,
    reviewsResult,
  ] = await Promise.all([
    supabase
      .from('stores')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('order_items')
      .select('quantity, orders!inner(status)')
      .in('orders.status', SOLD_STATUSES),
    supabase
      .from('reviews')
      .select('rating'),
  ]);

  if (activeStoresResult.error) {
    console.error('[API] Failed to count active UMKM stores:', activeStoresResult.error);
  }

  if (soldItemsResult.error) {
    console.error('[API] Failed to count sold UMKM products:', soldItemsResult.error);
  }

  if (reviewsResult.error) {
    console.error('[API] Failed to summarize UMKM ratings:', reviewsResult.error);
  }

  const reviews = reviewsResult.data ?? [];
  const reviewsCount = reviews.length;
  const averageRating = reviewsCount > 0
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewsCount
    : 0;

  return NextResponse.json({
    activeStores: activeStoresResult.count ?? 0,
    verifiedStores: activeStoresResult.count ?? 0,
    soldProducts: (soldItemsResult.data ?? []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    averageRating,
    reviewsCount,
  });
}

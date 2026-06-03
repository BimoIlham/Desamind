import { NextRequest, NextResponse } from 'next/server';
import { deleteRow, getRowById, jsonError, listRows, updateRow } from '@/lib/api-helpers';
import { getCurrentAuthUser } from '@/lib/auth-server';
import { withReviewSummary } from '@/lib/product-review-summary';
import { withSalesSummary } from '@/lib/product-sales-summary';
import { normalizeStoreProfile } from '@/lib/store-profile';
import { getSupabaseServerClient } from '@/lib/supabase-server';

async function getActiveStoreForUser(userId: string) {
  const stores = await listRows<any>('stores', [], {
    filters: { user_id: userId, status: 'active' },
    order: { column: 'created_at', ascending: false },
    limit: 1,
  });
  return stores[0] ?? null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const scope = searchParams.get('scope');

  const supabase = getSupabaseServerClient();
  let productData: any = null;
  let productError: any = null;

  if (supabase) {
    const primary = await supabase
      .from('products')
      .select('*, stores(id, name, description, address, logo_url, status, created_at)')
      .eq('id', id)
      .maybeSingle();

    productData = primary.data;
    productError = primary.error;

    if (productError) {
      console.warn('[API] Failed to get product with store address, retrying without address:', productError);
      const fallback = await supabase
        .from('products')
        .select('*, stores(id, name, description, logo_url, status, created_at)')
        .eq('id', id)
        .maybeSingle();

      productData = fallback.data;
      productError = fallback.error;
    }
  } else {
    productData = await getRowById<any>('products', id);
  }

  const product = productData
    ? { ...productData, stores: normalizeStoreProfile((productData as any).stores) }
    : null;

  if (productError) {
    console.error('[API] Failed to get product with store:', productError);
  }

  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (scope === 'admin') return NextResponse.json(await withSalesSummary(await withReviewSummary(product)));

  if (owner === 'me') {
    const user = await getCurrentAuthUser();
    const store = user ? await getActiveStoreForUser(user.id) : null;

    if (!store || product.store_id !== store.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(await withSalesSummary(await withReviewSummary(product)));
  }

  const activeStores = await listRows<any>('stores', [], {
    filters: { id: product.store_id, status: 'active' },
    limit: 1,
  });

  if (activeStores.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(await withSalesSummary(await withReviewSummary(product)));
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentAuthUser();
  if (!user) return jsonError('Login diperlukan untuk mengubah produk.', 401);

  const { id } = await params;
  const updates = await request.json();
  const existing = await getRowById<any>('products', id);

  if (user.role !== 'admin') {
    const store = await getActiveStoreForUser(user.id);
    if (!store || !existing || existing.store_id !== store.id) {
      return jsonError('Produk tidak ditemukan di toko Anda.', 404);
    }
  }

  const { data, error } = await updateRow('products', id, updates, { id, ...updates });

  if (error) return jsonError(error.message);
  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentAuthUser();
  if (!user) return jsonError('Login diperlukan untuk menghapus produk.', 401);

  const { id } = await params;
  const existing = await getRowById<any>('products', id);

  if (user.role !== 'admin') {
    const store = await getActiveStoreForUser(user.id);
    if (!store || !existing || existing.store_id !== store.id) {
      return jsonError('Produk tidak ditemukan di toko Anda.', 404);
    }
  }

  const { error } = await deleteRow('products', id);

  if (error) return jsonError(error.message);
  return NextResponse.json({ deleted: true });
}

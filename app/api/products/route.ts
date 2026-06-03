/**
 * app/api/products/route.ts
 * GET: List all UMKM products. POST: Create. PUT: Update. DELETE: Remove.
 */
import { NextRequest, NextResponse } from 'next/server';
import { deleteRow, getRowById, insertRow, jsonError, listRows, updateRow } from '@/lib/api-helpers';
import { getCurrentAuthUser } from '@/lib/auth-server';
import { withReviewSummary, withReviewSummaries } from '@/lib/product-review-summary';
import { withSalesSummary, withSalesSummaries } from '@/lib/product-sales-summary';
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

async function listPublicProducts(store_id: string | null) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const buildQuery = (select: string) => {
    let query = supabase
      .from('products')
      .select(select)
      .eq('stores.status', 'active')
      .order('created_at', { ascending: false });

    if (store_id) query = query.eq('store_id', store_id);
    return query;
  };

  let { data, error } = await buildQuery('*, stores!inner(id, name, description, address, logo_url, status, created_at)');
  if (error) {
    console.warn('[API] Failed to list public products with store address, retrying without address:', error);
    const fallback = await buildQuery('*, stores!inner(id, name, description, logo_url, status, created_at)');
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error('[API] Failed to list public products:', error);
    return [];
  }

  return withSalesSummaries(await withReviewSummaries(
    (data ?? []).map((product: any) => ({
      ...product,
      stores: normalizeStoreProfile(product.stores),
    }))
  ));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const store_id = searchParams.get('store_id');
  const id = searchParams.get('id');
  const owner = searchParams.get('owner');
  const scope = searchParams.get('scope');

  if (id) {
    const product = await withSalesSummary(await withReviewSummary(await getRowById<any>('products', id)));
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(product);
  }

  if (scope === 'admin') {
    const products = await listRows('products', [], {
      filters: { store_id },
      order: { column: 'created_at', ascending: false },
    });
    return NextResponse.json(await withSalesSummaries(await withReviewSummaries(products)));
  }

  if (owner === 'me') {
    const user = await getCurrentAuthUser();
    if (!user) return NextResponse.json([]);

    const store = await getActiveStoreForUser(user.id);
    if (!store) return NextResponse.json([]);

    const products = await listRows('products', [], {
      filters: { store_id: store.id },
      order: { column: 'created_at', ascending: false },
    });
    return NextResponse.json(await withSalesSummaries(await withReviewSummaries(products)));
  }

  const products = await listPublicProducts(store_id);
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentAuthUser();
  if (!user) return jsonError('Login diperlukan untuk menambah produk.', 401);

  const store = await getActiveStoreForUser(user.id);
  if (!store) {
    return jsonError('Toko Anda belum aktif. Produk hanya bisa ditambahkan setelah diverifikasi admin.', 403);
  }

  const body = await request.json();
  const { name, description, price, phone_number, image_url, category, stock } = body;

  if (!name || !price) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const fallback = {
    id: `product-${Date.now()}`,
    user_id: user.id,
    store_id: store.id,
    seller_name: store.name,
    name,
    description: description ?? '',
    price: Number(price),
    phone_number: phone_number ?? '',
    whatsapp: body.whatsapp ?? phone_number ?? '',
    image_url: image_url ?? '',
    category: category ?? 'Makanan',
    stock: Number(stock ?? 0),
    featured: Boolean(body.featured ?? false),
    sales_count: Number(body.sales_count ?? 0),
    rating: Number(body.rating ?? 0),
    created_at: new Date().toISOString(),
  };

  const { data, error } = await insertRow('products', fallback, fallback);
  if (error) return jsonError(error.message);

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentAuthUser();
  if (!user) return jsonError('Login diperlukan untuk mengubah produk.', 401);

  const store = await getActiveStoreForUser(user.id);
  if (!store) {
    return jsonError('Toko Anda belum aktif. Produk hanya bisa diubah setelah diverifikasi admin.', 403);
  }

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return jsonError('Missing product id', 400);

  const existing = await getRowById<any>('products', id);
  if (!existing || existing.store_id !== store.id) {
    return jsonError('Produk tidak ditemukan di toko Anda.', 404);
  }

  const allowedUpdates = {
    name: updates.name,
    description: updates.description,
    price: updates.price !== undefined ? Number(updates.price) : undefined,
    phone_number: updates.phone_number,
    whatsapp: updates.whatsapp ?? updates.phone_number,
    image_url: updates.image_url,
    category: updates.category,
    stock: updates.stock !== undefined ? Number(updates.stock) : undefined,
  };

  const { data, error } = await updateRow('products', id, allowedUpdates, { id, ...allowedUpdates });
  if (error) return jsonError(error.message);
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentAuthUser();
  if (!user) return jsonError('Login diperlukan untuk menghapus produk.', 401);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return jsonError('Missing product id', 400);

  if (user.role !== 'admin') {
    const store = await getActiveStoreForUser(user.id);
    const existing = id ? await getRowById<any>('products', id) : null;
    if (!store || !existing || existing.store_id !== store.id) {
      return jsonError('Produk tidak ditemukan di toko Anda.', 404);
    }
  }

  const { error } = await deleteRow('products', id);
  if (error) return jsonError(error.message);
  return NextResponse.json({ deleted: true });
}


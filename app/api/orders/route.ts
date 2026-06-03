/**
 * app/api/orders/route.ts
 * GET: List orders (by buyer_id or store_id).
 * PATCH: Update order status / AWB number.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getRowById, jsonError, listRows, updateRow } from '@/lib/api-helpers';
import { getCurrentAuthUser } from '@/lib/auth-server';

async function getActiveStoreForUser(userId: string) {
  const stores = await listRows<any>('stores', [], {
    filters: { user_id: userId, status: 'active' },
    order: { column: 'created_at', ascending: false },
    limit: 1,
  });
  return stores[0] ?? null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const buyer = searchParams.get('buyer');
  let buyer_id = searchParams.get('buyer_id');
  const owner = searchParams.get('owner');
  let store_id = searchParams.get('store_id');

  if (buyer === 'me') {
    const user = await getCurrentAuthUser();
    if (!user) return NextResponse.json([]);
    buyer_id = user.id;
  }

  if (owner === 'me') {
    const user = await getCurrentAuthUser();
    if (!user) return NextResponse.json([]);

    const store = await getActiveStoreForUser(user.id);
    if (!store) return NextResponse.json([]);

    store_id = store.id;
  }

  const orders = await listRows('orders', [], {
    filters: { buyer_id, store_id },
    order: { column: 'created_at', ascending: false },
    select: '*, order_items(*, products(*))',
  });

  return NextResponse.json(orders);
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentAuthUser();
  if (!user) return jsonError('Login diperlukan untuk mengubah pesanan.', 401);

  const body = await request.json();
  const { order_id, status, awb_number } = body;

  if (!order_id) {
    return jsonError('order_id is required', 400);
  }

  const existing = await getRowById<any>('orders', order_id);
  if (!existing) return jsonError('Pesanan tidak ditemukan.', 404);

  if (user.role !== 'admin' && existing.buyer_id !== user.id) {
    const store = await getActiveStoreForUser(user.id);
    if (!store || existing.store_id !== store.id) {
      return jsonError('Pesanan tidak ditemukan di toko Anda.', 404);
    }
  }

  const updateData: any = { updated_at: new Date().toISOString() };
  if (status) updateData.status = status;
  if (awb_number) updateData.awb_number = awb_number;
  if (body.cancellation_reason !== undefined) updateData.cancellation_reason = body.cancellation_reason;
  if (body.cancellation_requested_by !== undefined) updateData.cancellation_requested_by = body.cancellation_requested_by;
  if (body.cancellation_status !== undefined) updateData.cancellation_status = body.cancellation_status;
  if (body.completion_photo_base64 !== undefined) updateData.completion_photo_base64 = body.completion_photo_base64;
  if (body.is_reviewed !== undefined) updateData.is_reviewed = body.is_reviewed;

  const { data, error } = await updateRow('orders', order_id, updateData, {
    id: order_id,
    ...updateData,
  });

  if (error) return jsonError(error.message);
  return NextResponse.json(data);
}

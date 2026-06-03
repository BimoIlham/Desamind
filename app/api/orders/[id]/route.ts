/**
 * app/api/orders/[id]/route.ts
 * PATCH: Update order (status change, add AWB, etc.)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getRowById, jsonError, updateRow } from '@/lib/api-helpers';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const { data, error } = await updateRow('orders', id, body, { id, ...body });

  if (error) return jsonError(error.message);
  return NextResponse.json(data);
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getRowById('orders', id, null, '*, order_items(*, products(*))');

  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(order);
}

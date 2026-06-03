import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuthUser } from '@/lib/auth-server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

function isPaidMidtransStatus(transactionStatus: string | null, fraudStatus: string | null) {
  return transactionStatus === 'settlement' || (transactionStatus === 'capture' && fraudStatus !== 'deny');
}

async function verifyMidtransPayment(orderId: string) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  if (!serverKey) return { ok: true, reason: 'test-mode' };

  const isSandbox = process.env.MIDTRANS_IS_SANDBOX !== 'false';
  const baseUrl = isSandbox
    ? 'https://api.sandbox.midtrans.com/v2'
    : 'https://api.midtrans.com/v2';
  const authString = Buffer.from(`${serverKey}:`).toString('base64');

  const response = await fetch(`${baseUrl}/${encodeURIComponent(orderId)}/status`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${authString}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { ok: false, reason: `Midtrans status check failed: ${errorText}` };
  }

  const data = await response.json();
  return {
    ok: isPaidMidtransStatus(data.transaction_status ?? null, data.fraud_status ?? null),
    reason: data.transaction_status ?? 'unknown',
  };
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Login diperlukan untuk mengonfirmasi pembayaran.' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database is not configured' }, { status: 500 });
  }

  const { data: order, error: getError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (getError) {
    return NextResponse.json({ error: getError.message }, { status: 500 });
  }

  if (!order || order.buyer_id !== user.id) {
    return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
  }

  if (['terbayar', 'diproses', 'dikirim', 'selesai'].includes(order.status)) {
    return NextResponse.json(order);
  }

  if (order.status === 'dibatalkan') {
    return NextResponse.json({ error: 'Pesanan sudah dibatalkan.' }, { status: 409 });
  }

  const verification = await verifyMidtransPayment(id);
  if (!verification.ok) {
    return NextResponse.json(
      { error: `Pembayaran belum terverifikasi sebagai berhasil (${verification.reason}).` },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'terbayar', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('buyer_id', user.id)
    .select('*, order_items(*, products(*))')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

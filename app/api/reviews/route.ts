import { NextRequest, NextResponse } from 'next/server';
import { getRowById, jsonError, listRows } from '@/lib/api-helpers';
import { getCurrentAuthUser } from '@/lib/auth-server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const product_id = searchParams.get('product_id');
  const order_id = searchParams.get('order_id');

  const reviews = await listRows('reviews', [], {
    filters: { product_id, order_id },
    order: { column: 'created_at', ascending: false },
    select: '*, orders(buyer_name, completion_photo_base64)',
  });

  return NextResponse.json(reviews);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return jsonError('Login diperlukan untuk memberi ulasan.', 401);

    const body = await request.json();
    const { order_id, product_id, rating, comment } = body;

    if (!order_id || !product_id || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const order = await getRowById<any>('orders', order_id);
    if (!order || order.buyer_id !== user.id || order.status !== 'selesai') {
      return jsonError('Pesanan tidak valid untuk ulasan.', 403);
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return jsonError('Database is not configured');
    }

    const { data: orderItem, error: orderItemError } = await supabase
      .from('order_items')
      .select('id')
      .eq('order_id', order_id)
      .eq('product_id', product_id)
      .maybeSingle();

    if (orderItemError) throw orderItemError;
    if (!orderItem) {
      return jsonError('Produk ini tidak ditemukan pada pesanan tersebut.', 403);
    }

    // Insert review
    const { data, error } = await supabase
      .from('reviews')
      .insert([{ order_id, product_id, buyer_id: user.id, rating, comment }])
      .select()
      .single();

    if (error) {
       // Check for duplicate constraint
       if (error.code === '23505') {
          return NextResponse.json({ error: 'Anda sudah memberikan ulasan untuk produk ini.' }, { status: 409 });
       }
       throw error;
    }

    // Mark order as reviewed
    await supabase.from('orders').update({ is_reviewed: true }).eq('id', order_id);

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Review API Error:', err);
    return jsonError(err.message);
  }
}

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    
    // Validate signature key to ensure request comes from Midtrans
    const hash = crypto.createHash('sha512').update(`${order_id}${status_code}${gross_amount}${serverKey}`).digest('hex');
    if (hash !== signature_key) {
      console.warn("Midtrans webhook: Invalid signature");
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    let orderStatus = 'pending';
    if (transaction_status === 'capture' && fraud_status !== 'deny') {
      orderStatus = 'terbayar';
    } else if (transaction_status === 'settlement') {
      orderStatus = 'terbayar';
    } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire') {
      orderStatus = 'dibatalkan';
    } else if (transaction_status === 'pending') {
      orderStatus = 'pending';
    }

    // Update order status in Supabase securely (if available)
    const supabase = getSupabaseServerClient();
    if (supabase) {
       const { error } = await supabase
         .from('orders')
         .update({ status: orderStatus, updated_at: new Date().toISOString() })
         .eq('id', order_id);
       if (error) console.error("Midtrans webhook Supabase error:", error);
    }

    return NextResponse.json({ status: 'success' });
  } catch (err: any) {
    console.error("Midtrans webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

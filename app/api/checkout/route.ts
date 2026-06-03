import { NextResponse } from 'next/server';
import { getCurrentAuthUser } from '@/lib/auth-server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return NextResponse.json({ error: 'Login diperlukan untuk checkout.' }, { status: 401 });

    const body = await request.json();
    const { store_id, total_amount, items, customer_details, payment_method } = body;
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database is not configured' }, { status: 500 });
    }

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, status')
      .eq('id', store_id)
      .eq('status', 'active')
      .maybeSingle();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Toko belum aktif atau tidak ditemukan.' }, { status: 400 });
    }

    const productIds = Array.isArray(items) ? items.map((item: any) => item.id).filter(Boolean) : [];
    if (productIds.length === 0) {
      return NextResponse.json({ error: 'Keranjang kosong.' }, { status: 400 });
    }

    const { data: validProducts, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('store_id', store.id)
      .in('id', productIds);

    if (productsError || (validProducts?.length ?? 0) !== productIds.length) {
      return NextResponse.json({ error: 'Produk tidak valid untuk toko ini.' }, { status: 400 });
    }

    // 1. Generate Order ID
    const order_id = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const isCOD = payment_method === 'cod';

    // 2. Insert order into Supabase — fail loudly if DB fails
    {
      const { error: orderError } = await supabase.from('orders').insert([{
        id: order_id,
        buyer_id: user.id,
        store_id: store.id,
        total_amount,
        status: isCOD ? 'diproses' : 'pending',
        payment_method: payment_method || 'midtrans',
        buyer_name: customer_details?.first_name || null,
        buyer_phone: customer_details?.phone || null,
        shipping_address: customer_details?.address
          ? `${customer_details.address}, ${customer_details.city || ''}`
          : null
      }]);

      if (orderError) {
        console.error('Supabase order insert error:', orderError);
        return NextResponse.json({ error: 'Gagal menyimpan pesanan: ' + orderError.message }, { status: 500 });
      }

      // Insert order items
      if (items && items.length > 0) {
        const orderItems = items.map((item: any) => ({
          order_id,
          product_id: item.id,
          quantity: item.quantity,
          price: item.price
        }));
        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) {
          console.error('Supabase order_items insert error:', itemsError);
        }
      }
    }

    if (isCOD) {
       return NextResponse.json({ 
          success: true,
          token: 'COD',
          order_id 
       });
    }

    // 3. Request Snap Token from Midtrans
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';

    if (!serverKey) {
      await supabase
        .from('orders')
        .update({ status: 'terbayar', updated_at: new Date().toISOString() })
        .eq('id', order_id);

      return NextResponse.json({
        success: true,
        token: 'MIDTRANS_NOT_CONFIGURED',
        order_id,
        redirect_url: `/umkm/pesanan?id=${order_id}&status=success`,
      });
    }
    const isSandbox = process.env.MIDTRANS_IS_SANDBOX !== 'false'; // default true
    const baseUrl = isSandbox ? 'https://app.sandbox.midtrans.com/snap/v1/transactions' : 'https://app.midtrans.com/snap/v1/transactions';

    const authString = Buffer.from(`${serverKey}:`).toString('base64');

    const origin = request.headers.get('origin') || 'http://localhost:3000';

    const midtransPayload: any = {
      transaction_details: {
        order_id: order_id,
        gross_amount: total_amount
      },
      customer_details: {
        first_name: customer_details?.first_name || 'Pembeli',
        email: customer_details?.email || 'guest@example.com',
        phone: customer_details?.phone || '08111222333',
        billing_address: {
           address: customer_details?.address || 'Alamat tidak diketahui',
           city: customer_details?.city || 'Kota'
        }
      },
      item_details: items.map((item: any) => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.name.substring(0, 50)
      })),
      callbacks: {
        finish: `${origin}/umkm/pesanan?id=${order_id}&status=success`
      }
    };

    // Include shipping in item_details if provided separately
    if (customer_details?.shipping_cost) {
       midtransPayload.item_details.push({
          id: 'shipping',
          price: customer_details.shipping_cost,
          quantity: 1,
          name: 'Ongkos Kirim'
       });
    }

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify(midtransPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Midtrans Error:', data);
      throw new Error(data.error_messages?.[0] || 'Midtrans configuration invalid or unauthorized.');
    }

    return NextResponse.json({ 
       token: data.token,
       redirect_url: data.redirect_url,
       order_id 
    });

  } catch (error: any) {
    console.error('Checkout API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

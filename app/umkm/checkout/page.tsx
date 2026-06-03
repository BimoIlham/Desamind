'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/components/marketplace/CartContext';
import { formatRupiah } from '@/lib/utils';
import { Loader2, ArrowLeft, MapPin, Truck, ShieldCheck, CreditCard, ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

export default function CheckoutPage() {
  const { items, total, clear, updateQty, removeItem, validateCart, isValidating } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedProv, setSelectedProv] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [form, setForm] = useState({
     name: user?.name || '',
     phone: '',
     address: '',
     city: '',
     district: '',
     courier: 'jne',
     paymentMethod: 'cod'
  });


  const grandTotal = total + shippingCost;



  useEffect(() => {
    validateCart();
  }, [validateCart]);

  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(e => console.error(e));
  }, []);

  useEffect(() => {
    if (selectedProv) {
      setForm(prev => ({ ...prev, city: '', district: '' }));
      setSelectedCityId('');
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProv}.json`)
        .then(res => res.json())
        .then(data => setCities(data))
        .catch(e => console.error(e));
    } else {
      setCities([]);
    }
  }, [selectedProv]);

  useEffect(() => {
    if (selectedCityId) {
      setForm(prev => ({ ...prev, district: '' }));
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedCityId}.json`)
        .then(res => res.json())
        .then(data => setDistricts(data))
        .catch(e => console.error(e));
    } else {
      setDistricts([]);
    }
  }, [selectedCityId]);
  
  // Store city logic removed for static mode

  async function checkShipping() {
     if (!form.city) return alert("Pilih kota tujuan terlebih dahulu");
     setShippingLoading(true);
     try {
       const res = await fetch('/api/shipping', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           origin: '1101',
           destination: selectedCityId || form.city,
           weight: Math.max(1000, items.reduce((sum, item) => sum + item.quantity * 500, 0)),
           courier: form.courier,
         }),
       });
       const costs = res.ok ? await res.json() : [];
       const firstCost = costs?.[0]?.cost?.[0]?.value;
       setShippingCost(Number(firstCost) || 15000);
     } catch (e) {
       setShippingCost(15000);
     } finally {
       setShippingLoading(false);
     }
  }

  async function handleCheckout() {
     if (!form.name || !form.phone || !form.address) return alert("Lengkapi data pengiriman");
     if (shippingCost === 0) return alert("Silakan cek ongkir terlebih dahulu dengan menekan tombol Cek Ongkir");

     setLoading(true);
     try {
       const validItems = await validateCart();
       if (validItems.length === 0) {
          alert('Keranjang sudah kosong karena produk tidak tersedia lagi.');
          return;
       }
       const validTotal = validItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
       const validGrandTotal = validTotal + shippingCost;

       const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             buyer_id: user?.id || 'guest',
             store_id: validItems[0]?.product.store_id,
             total_amount: validGrandTotal,
             payment_method: form.paymentMethod,
             customer_details: {
                first_name: form.name,
                phone: form.phone,
                address: form.address,
                city: form.city,
                shipping_cost: shippingCost,
             },
             items: validItems.map((item) => ({
                id: item.product.id,
                name: item.product.name,
                price: item.product.price,
                quantity: item.quantity,
             })),
          }),
       });
       const data = await response.json();
       if (!response.ok) throw new Error(data.error || 'Gagal membuat pesanan');

       if (form.paymentMethod === 'cod' || data.token === 'MIDTRANS_NOT_CONFIGURED') {
          clear();
          window.location.href = `/umkm/pesanan?id=${data.order_id}&status=success`;
          return;
       }
       
       if (form.paymentMethod === 'midtrans' && data.redirect_url) {
          clear();
          window.location.href = data.redirect_url;
          return;
       }
     } catch (e: any) {
       alert("Terjadi kesalahan saat checkout: " + e.message);
     } finally {
       setLoading(false);
     }
  }

  if (items.length === 0) {
    return (
       <div className="min-h-screen bg-bg flex items-center justify-center p-4">
         <div className="text-center p-8 bg-white shadow-sm border border-gray-200 border-t-4 border-t-primary-600 max-w-sm w-full">
            <ShoppingBag className="w-12 h-12 text-primary-200 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-primary-900 mb-2">Keranjang Kosong</h2>
            <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-6">Pilih produk UMKM terbaik dari desa kami.</p>
            <Link href="/umkm" className="block w-full bg-primary-800 text-white text-[10px] uppercase tracking-widest font-bold py-3 hover:bg-primary-950 transition-colors">
               MULAI BELANJA
            </Link>
         </div>
       </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pt-12 lg:pt-14 pb-12 lg:pb-14 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-2 mb-8">
           <Link href="/umkm" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-primary-700 transition-colors">
             <ArrowLeft className="w-3 h-3" /> Kembali Belanja
           </Link>
           <h1 className="text-3xl font-semibold text-primary-900 border-l-4 border-primary-600 pl-4">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
           {/* Left Column: Forms */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Shipping Address */}
              <div className="bg-white p-6 md:p-8 border border-gray-200 shadow-sm">
                 <h2 className="text-sm font-bold text-primary-900 border-b border-gray-100 pb-4 mb-6 flex items-center gap-2 uppercase tracking-widest">
                   <div className="p-1.5 bg-primary-50 text-primary-800 border border-primary-100"><MapPin className="w-4 h-4" /></div> ALAMAT PENGIRIMAN
                 </h2>
                 <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Nama Lengkap</label>
                          <input type="text" className="w-full border border-gray-300 p-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-white" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">No. HP / WhatsApp</label>
                          <input type="tel" className="w-full border border-gray-300 p-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-white" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="08..." />
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Provinsi Tujuan *</label>
                          <select required className="w-full border border-gray-300 p-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-white" value={selectedProv} onChange={e => { setSelectedProv(e.target.value); setShippingCost(0); }}>
                            <option value="">-- Pilih Provinsi --</option>
                            {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Kota / Kabupaten *</label>
                          <select required disabled={!selectedProv} className="w-full border border-gray-300 p-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-white disabled:bg-gray-50" value={selectedCityId} onChange={e => { 
                             setSelectedCityId(e.target.value);
                             setForm({...form, city: e.target.selectedOptions[0].text}); 
                             setShippingCost(0); 
                          }}>
                            <option value="">-- Pilih Kota/Kab. --</option>
                            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Kecamatan *</label>
                       <select required disabled={!selectedCityId} className="w-full border border-gray-300 p-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-white disabled:bg-gray-50" value={form.district} onChange={e => { 
                          setForm({...form, district: e.target.value}); 
                          setShippingCost(0); 
                       }}>
                         <option value="">-- Pilih Kecamatan --</option>
                         {districts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                       </select>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Alamat Lengkap (Jalan, RT/RW, Patokan)</label>
                       <textarea className="w-full border border-gray-300 p-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-white h-24 resize-none" value={form.address} onChange={e => setForm({...form, address: e.target.value})}></textarea>
                    </div>
                 </div>
              </div>

              {/* Courier Option */}
              <div className="bg-white p-6 md:p-8 border border-gray-200 shadow-sm">
                 <h2 className="text-sm font-bold text-primary-900 border-b border-gray-100 pb-4 mb-6 flex items-center gap-2 uppercase tracking-widest">
                   <div className="p-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100"><Truck className="w-4 h-4" /></div> KURIR & ONGKIR (BINDERBYTE)
                 </h2>
                 <div className="flex flex-col sm:flex-row gap-4">
                    <select className="flex-1 border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white font-medium" value={form.courier} onChange={e => { setForm({...form, courier: e.target.value}); setShippingCost(0); }}>
                      <option value="jne">JNE Reguler</option>
                      <option value="sicepat">SiCepat Ekspress</option>
                      <option value="pos">POS Indonesia</option>
                    </select>
                    <button onClick={checkShipping} disabled={shippingLoading || !form.city} className="flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 shrink-0">
                    {shippingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'CEK ONGKIR'}
                    </button>
                 </div>
                 {shippingCost > 0 && (
                    <div className="mt-6 p-4 border border-green-200 bg-green-50 flex items-center justify-between">
                       <span className="text-[11px] font-bold uppercase tracking-widest text-green-800">BIAYA PENGIRIMAN</span>
                       <span className="font-bold text-green-800 text-lg">{formatRupiah(shippingCost)}</span>
                    </div>
                 )}
              </div>

              {/* Payment Method Option */}
              <div className="bg-white p-6 md:p-8 border border-gray-200 shadow-sm">
                 <h2 className="text-sm font-bold text-primary-900 border-b border-gray-100 pb-4 mb-6 flex items-center gap-2 uppercase tracking-widest">
                   <div className="p-1.5 bg-green-50 text-green-700 border border-green-100"><CreditCard className="w-4 h-4" /></div> METODE PEMBAYARAN
                 </h2>
                 <div className="flex flex-col gap-3">
                    <label className={`border p-4 flex items-center gap-3 cursor-pointer transition-colors ${form.paymentMethod === 'midtrans' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'}`}>
                       <input type="radio" name="payment" value="midtrans" checked={form.paymentMethod === 'midtrans'} onChange={() => setForm({...form, paymentMethod: 'midtrans'})} className="text-primary-600 focus:ring-primary-500 w-4 h-4" />
                       <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">Digital Payment (Otomatis)</p>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Qris, Bank Transfer, E-Wallet (Midtrans)</p>
                       </div>
                    </label>
                    <label className={`border p-4 flex items-center gap-3 cursor-pointer transition-colors ${form.paymentMethod === 'cod' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'}`}>
                       <input type="radio" name="payment" value="cod" checked={form.paymentMethod === 'cod'} onChange={() => setForm({...form, paymentMethod: 'cod'})} className="text-primary-600 focus:ring-primary-500 w-4 h-4" />
                       <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">Bayar di Tempat (COD)</p>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Bayar langsung ke kurir saat barang tiba</p>
                       </div>
                    </label>
                 </div>
              </div>
           </div>

           {/* Right Column: Order Summary */}
           <div className="lg:col-span-5 relative">
              <div className="bg-white p-6 md:p-8 border border-gray-200 shadow-sm sticky top-28">
                 <h2 className="text-sm font-bold text-primary-900 border-b border-gray-100 pb-4 mb-6 flex items-center gap-2 uppercase tracking-widest">
                   <div className="p-1.5 bg-amber-50 text-amber-600 border border-amber-200"><ShoppingBag className="w-4 h-4" /></div> RINGKASAN PESANAN
                 </h2>
                 
                 <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                    {isValidating && (
                       <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary-700 bg-primary-50 border border-primary-100 px-3 py-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Memeriksa ketersediaan produk
                       </div>
                    )}
                    {items.map(item => (
                       <div key={item.product.id} className="flex gap-4 items-center">
                          <div className="relative w-14 h-14 overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                             <Image src={item.product.image_url || '/placeholder.jpg'} alt="" fill className="object-cover" />
                             <span className="absolute top-0 right-0 bg-primary-800 text-white text-[9px] font-bold px-1.5 py-0.5">
                               x{item.quantity}
                             </span>
                          </div>
                          <div className="flex-1 min-w-0">
                             <h4 className="text-sm font-semibold text-primary-950 truncate">{item.product.name}</h4>
                             <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">{formatRupiah(item.product.price)} <span className="font-normal">/ pcs</span></p>
                             <div className="flex items-center gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => updateQty(item.product.id, item.quantity - 1)}
                                  className="w-7 h-7 border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
                                  aria-label="Kurangi jumlah"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center text-xs font-bold text-gray-800">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQty(item.product.id, item.quantity + 1)}
                                  disabled={item.quantity >= Number(item.product.stock ?? 0)}
                                  className="w-7 h-7 border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  aria-label="Tambah jumlah"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.product.id)}
                                  className="w-7 h-7 text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                                  aria-label="Hapus produk"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                             </div>
                          </div>
                          <div className="font-bold text-sm text-primary-900 shrink-0">
                             {formatRupiah(item.product.price * item.quantity)}
                          </div>
                       </div>
                    ))}
                 </div>

                 <div className="border-t border-gray-100 pt-6 space-y-3">
                    <div className="flex justify-between text-[11px] font-bold tracking-widest uppercase text-gray-500">
                       <span>TOTAL BARANG</span>
                       <span className="text-gray-900">{formatRupiah(total)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold tracking-widest uppercase text-gray-500">
                       <span>ONGKOS KIRIM</span>
                       <span className="text-gray-900">{shippingCost > 0 ? formatRupiah(shippingCost) : '-'}</span>
                    </div>
                 </div>

                 <div className="border-t border-gray-100 pt-4 mt-4 flex items-end justify-between mb-8">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">TOTAL BAYAR</span>
                    <span className="text-2xl font-black text-primary-900">{formatRupiah(grandTotal)}</span>
                 </div>

                 <button
                    onClick={handleCheckout}
                    disabled={loading || shippingCost === 0}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-primary-800 hover:bg-primary-950 text-white text-[11px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                 >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                       <> <CreditCard className="w-5 h-5" /> BAYAR SEKARANG </>
                    )}
                 </button>

                 <div className="flex items-center justify-center gap-2 mt-4 text-[9px] uppercase tracking-widest font-bold text-gray-400 bg-gray-50 py-2 border border-gray-100">
                    <ShieldCheck className="w-3 h-3 text-green-600" />
                    TRANSAKSI AMAN OLEH MIDTRANS
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

'use client';
import { ShoppingBag, Package, CheckCircle2, Clock, Truck, Loader2, XCircle, AlertCircle, Camera, Star } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Suspense, useState, useEffect } from 'react';
import { formatRupiah } from '@/lib/utils';
import { fetchJson } from '@/lib/api-client';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Menunggu Bayar', color: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock },
  terbayar: { label: 'Terbayar', color: 'bg-green-50 text-green-800 border-green-200', icon: CheckCircle2 },
  diproses: { label: 'Diproses', color: 'bg-blue-50 text-blue-800 border-blue-200', icon: Package },
  dikirim: { label: 'Dikirim', color: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: Truck },
  selesai: { label: 'Selesai', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  dibatalkan: { label: 'Dibatalkan', color: 'bg-red-50 text-red-800 border-red-200', icon: XCircle },
};


function OrderList() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const orderIdParam = searchParams.get('id');
  const [orders, setOrders] = useState<any[]>([]);
  const [paymentSyncing, setPaymentSyncing] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState('');
  
  // Modals State
  const [cancelModal, setCancelModal] = useState<{open: boolean, orderId: string, reason: string}>({open: false, orderId: '', reason: ''});
  const [completeModal, setCompleteModal] = useState<{open: boolean, orderId: string, photoBase64: string}>({open: false, orderId: '', photoBase64: ''});
  const [reviewModal, setReviewModal] = useState<{open: boolean, orderId: string, productId: string, rating: number, comment: string}>({open: false, orderId: '', productId: '', rating: 5, comment: ''});
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      if (statusParam === 'success' && orderIdParam) {
        setPaymentSyncing(true);
        const paidResponse = await fetch(`/api/orders/${orderIdParam}/mark-paid`, {
          method: 'POST',
        })
          .then(async (res) => ({
            ok: res.ok,
            data: await res.json().catch(() => ({})),
          }))
          .catch(() => null);

        const paidOrder = paidResponse?.ok ? paidResponse.data : null;

        if (mounted && paidOrder?.id) {
          setOrders((prev) => {
            const exists = prev.some((order) => order.id === paidOrder.id);
            return exists
              ? prev.map((order) => (order.id === paidOrder.id ? paidOrder : order))
              : [paidOrder, ...prev];
          });
          setPaymentNotice('Pembayaran berhasil dan pesanan sudah ditandai terbayar.');
        } else if (mounted) {
          setPaymentNotice(paidResponse?.data?.error || 'Pembayaran sedang diverifikasi. Status pesanan akan diperbarui otomatis setelah konfirmasi diterima.');
        }
        if (mounted) setPaymentSyncing(false);
      }

      const data = await fetchJson('/api/orders?buyer=me', []);
      if (mounted) setOrders(data);
    }

    loadOrders();
    return () => { mounted = false; };
  }, [orderIdParam, statusParam]);

  async function submitCancel() {
    if (!cancelModal.reason) return alert('Pilih atau tulis alasan pembatalan');
    setActionLoading(true);
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: cancelModal.orderId,
        cancellation_status: 'requested',
        cancellation_reason: cancelModal.reason,
        cancellation_requested_by: 'buyer',
      }),
    }).catch(() => undefined);
    setOrders(prev => prev.map(o => o.id === cancelModal.orderId ? { ...o, cancellation_status: 'requested', cancellation_reason: cancelModal.reason } : o));
    setCancelModal({open: false, orderId: '', reason: ''});
    setActionLoading(false);
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCompleteModal(prev => ({...prev, photoBase64: reader.result as string}));
      reader.readAsDataURL(file);
    }
  }

  async function submitComplete() {
    if (!completeModal.photoBase64) return alert('Silakan unggah foto bukti terima barang');
    setActionLoading(true);
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: completeModal.orderId,
        status: 'selesai',
        completion_photo_base64: completeModal.photoBase64,
      }),
    }).catch(() => undefined);
    setOrders(prev => prev.map(o => o.id === completeModal.orderId ? { ...o, status: 'selesai', completion_photo_base64: completeModal.photoBase64 } : o));
    setCompleteModal({open: false, orderId: '', photoBase64: ''});
    setActionLoading(false);
  }

  async function submitReview() {
    setActionLoading(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: reviewModal.orderId,
          product_id: reviewModal.productId,
          rating: reviewModal.rating,
          comment: reviewModal.comment,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(result.error || 'Ulasan gagal disimpan. Silakan coba lagi.');
        return;
      }

      setOrders(prev => prev.map(o => o.id === reviewModal.orderId ? { ...o, is_reviewed: true } : o));
      setReviewModal({open: false, orderId: '', productId: '', rating: 5, comment: ''});
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <>
        {statusParam === 'success' && (
          <div className="bg-green-50 border border-green-200 border-l-4 border-l-green-600 p-6 mb-8 flex items-start gap-4 shadow-sm">
            <div className="bg-white p-2 shrink-0 border border-green-200">
               <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
               <h3 className="text-sm font-bold uppercase tracking-widest text-green-900 mb-1">Pembayaran Berhasil</h3>
               <p className="text-green-800 text-sm">
                 Pesanan <strong>{orderIdParam || 'BARU'}</strong>{' '}
                 {paymentSyncing ? 'sedang disinkronkan...' : paymentNotice || 'sedang diverifikasi.'}
               </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {orders.length === 0 ? (
             <div className="bg-white border border-gray-200 border-t-4 border-t-primary-600 p-12 text-center shadow-sm">
                <ShoppingBag className="w-12 h-12 text-primary-200 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-primary-900 mb-2">Belum ada pesanan</h2>
                <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-6">Ayo mulai belanja produk-produk hebat dari desa kita.</p>
                <Link href="/umkm" className="inline-block bg-primary-800 text-white text-[10px] font-bold uppercase tracking-widest py-3 px-8 hover:bg-primary-950 transition-colors">
                  Mulai Belanja
                </Link>
             </div>
          ) : (
             orders.map(order => {
               const sc = statusConfig[order.status] || statusConfig.pending;
               const StatusIcon = sc.icon;
               const orderDate = new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
               const orderItems = order.order_items || [];
               const firstItem = orderItems[0];
               const productName = firstItem?.products?.name || 'Produk Marketplace';
               const productImage = firstItem?.products?.image_url || '';
               const totalItems = orderItems.reduce((s: number, i: any) => s + (i.quantity || 1), 0);
               const subtotal = orderItems.reduce((s: number, i: any) => s + Number(i.price || 0) * Number(i.quantity || 1), 0);
               const shippingCost = Math.max(0, Number(order.total_amount || 0) - subtotal);
               
               const canCancel = ['pending', 'terbayar', 'diproses'].includes(order.status) && !order.cancellation_status;
               const isCancelRequested = order.cancellation_status === 'requested';

               return (
                 <div key={order.id} className="bg-white border border-gray-200 shadow-sm overflow-hidden hover:border-primary-400 transition-colors">
                    <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                       <div className="flex items-center gap-3">
                          <div className="bg-white p-2 border border-primary-200">
                             <Package className="w-4 h-4 text-primary-600" />
                          </div>
                          <div>
                             <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">Belanja • {orderDate}</p>
                             <p className="text-xs font-mono text-primary-700">{order.id}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest border flex items-center gap-1.5 ${sc.color}`}>
                             <StatusIcon className="w-3 h-3" />
                             {sc.label}
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="text-sm font-bold text-gray-900">{formatRupiah(order.total_amount)}</span>
                       </div>
                    </div>

                    {isCancelRequested && (
                      <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2 text-xs text-amber-800 font-bold uppercase tracking-widest">
                         <AlertCircle className="w-4 h-4" /> Pengajuan pembatalan menunggu persetujuan penjual.
                      </div>
                    )}

                    <div className="p-6 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200 relative overflow-hidden">
                             {productImage ? (
                               <Image src={productImage} alt="" fill className="object-cover" />
                             ) : (
                               <Package className="w-6 h-6 text-gray-400 absolute z-0" />
                             )}
                          </div>
                          <div>
                             <h4 className="font-bold text-gray-800">{productName}</h4>
                             <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mt-1">
                               {totalItems} BARANG{orderItems.length > 1 ? ` (${orderItems.length} produk)` : ''}
                             </p>
                          </div>
                       </div>
                    </div>

                    <div className="px-6 pb-6">
                      <div className="border border-gray-200 bg-gray-50/60 p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Metode Bayar</p>
                            <p className="font-semibold text-gray-800 uppercase">{order.payment_method || 'midtrans'}</p>
                          </div>
                          {order.shipping_address && (
                            <div className="md:col-span-2">
                              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Alamat Pengiriman</p>
                              <p className="font-semibold text-gray-800 leading-relaxed">{order.shipping_address}</p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Detail Produk</p>
                          {orderItems.map((item: any, idx: number) => (
                            <div key={item.id || idx} className="flex items-center justify-between gap-3 border-t border-gray-200 pt-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="relative w-10 h-10 bg-white border border-gray-200 shrink-0 overflow-hidden">
                                  {item.products?.image_url ? (
                                    <Image src={item.products.image_url} alt="" fill className="object-cover" />
                                  ) : (
                                    <Package className="w-4 h-4 text-gray-300 absolute left-3 top-3" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-800 truncate">{item.products?.name || 'Produk'}</p>
                                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                                    {item.quantity}x @ {formatRupiah(item.price)}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm font-bold text-gray-900 shrink-0">
                                {formatRupiah(Number(item.price || 0) * Number(item.quantity || 1))}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-gray-200 pt-3 space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Subtotal Produk</span>
                            <span className="font-semibold text-gray-800">{formatRupiah(subtotal)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Ongkos Kirim</span>
                            <span className="font-semibold text-gray-800">{shippingCost > 0 ? formatRupiah(shippingCost) : '-'}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm font-bold text-primary-900 pt-1">
                            <span>Total Bayar</span>
                            <span>{formatRupiah(order.total_amount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {order.awb_number && (
                      <div className="px-6 py-3 bg-indigo-50/50 border-t border-indigo-100 flex items-center justify-between">
                         <div className="flex items-center gap-2 text-xs text-indigo-800 font-bold uppercase tracking-widest">
                            <Truck className="w-4 h-4" /> NO. RESI: {order.awb_number}
                         </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap justify-end gap-3">
                       {canCancel && (
                         <button onClick={() => setCancelModal({open: true, orderId: order.id, reason: ''})} className="px-4 py-2 border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-[10px] font-bold uppercase tracking-widest transition-colors">
                           {order.status === 'pending' ? 'Batalkan Pesanan' : 'Ajukan Pembatalan'}
                         </button>
                       )}
                       {order.status === 'dikirim' && (
                         <button onClick={() => setCompleteModal({open: true, orderId: order.id, photoBase64: ''})} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold uppercase tracking-widest transition-colors">
                           Selesaikan Pesanan
                         </button>
                       )}
                       {order.status === 'selesai' && !order.is_reviewed && firstItem?.product_id && (
                         <button onClick={() => setReviewModal({open: true, orderId: order.id, productId: firstItem.product_id, rating: 5, comment: ''})} className="px-4 py-2 bg-primary-800 hover:bg-primary-950 text-white text-[10px] font-bold uppercase tracking-widest transition-colors">
                           Beri Ulasan
                         </button>
                       )}
                       {order.status === 'selesai' && order.is_reviewed && (
                         <span className="px-4 py-2 text-primary-700 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                           <CheckCircle2 className="w-3.5 h-3.5" /> Telah Diulas
                         </span>
                       )}
                    </div>
                 </div>
               );
             })
          )}
        </div>

        {/* --- MODALS --- */}
        
        {/* Cancel Modal */}
        {cancelModal.open && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white p-6 max-w-md w-full border border-gray-200 shadow-xl">
                 <h3 className="text-lg font-bold text-gray-900 mb-4">{
                   orders.find(o => o.id === cancelModal.orderId)?.status === 'pending' ? 'Batalkan Pesanan' : 'Ajukan Pembatalan'
                 }</h3>
                 <p className="text-xs text-gray-500 mb-4 tracking-widest uppercase font-bold">Pilih alasan pembatalan:</p>
                 <select className="w-full border p-3 border-gray-300 mb-4 text-sm" value={cancelModal.reason} onChange={e => setCancelModal({...cancelModal, reason: e.target.value})}>
                    <option value="">-- Pilih Alasan --</option>
                    <option value="Ingin mengubah alamat pengiriman">Ingin mengubah alamat pengiriman</option>
                    <option value="Ingin mengubah metode pembayaran">Ingin mengubah metode pembayaran</option>
                    <option value="Menemukan harga yang lebih murah">Menemukan harga yang lebih murah</option>
                    <option value="Berubah pikiran">Berubah pikiran</option>
                    <option value="Lainnya">Lainnya</option>
                 </select>
                 <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setCancelModal({open: false, orderId: '', reason: ''})} className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-700 transition">Tutup</button>
                    <button onClick={submitCancel} disabled={actionLoading || !cancelModal.reason} className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition">
                       {actionLoading ? 'Memproses...' : 'Konfirmasi Batal'}
                    </button>
                 </div>
              </div>
           </div>
        )}

        {/* Complete Modal */}
        {completeModal.open && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white p-6 max-w-md w-full border border-gray-200 shadow-xl">
                 <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /> Selesaikan Pesanan</h3>
                 <p className="text-xs text-gray-600 mb-4">Mohon unggah foto bukti bahwa paket telah Anda terima dengan baik. Setelah diselesaikan, pesanan tidak dapat dibatalkan.</p>
                 
                 <label className="border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center h-40 cursor-pointer hover:bg-gray-100 transition relative overflow-hidden">
                    {completeModal.photoBase64 ? (
                      <Image src={completeModal.photoBase64} alt="Bukti Terima" fill className="object-cover" />
                    ) : (
                      <>
                         <Camera className="w-8 h-8 text-gray-400 mb-2" />
                         <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Klik untuk Unggah Foto</span>
                      </>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                 </label>

                 <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setCompleteModal({open: false, orderId: '', photoBase64: ''})} className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-700 transition">Tutup</button>
                    <button onClick={submitComplete} disabled={actionLoading || !completeModal.photoBase64} className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition">
                       {actionLoading ? 'Memproses...' : 'Selesaikan Sekarang'}
                    </button>
                 </div>
              </div>
           </div>
        )}

        {/* Review Modal */}
        {reviewModal.open && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white p-6 max-w-md w-full border border-gray-200 shadow-xl">
                 <h3 className="text-lg font-bold text-gray-900 mb-4">Beri Ulasan Produk</h3>
                 <div className="flex justify-center gap-2 mb-6">
                    {[1,2,3,4,5].map(star => (
                       <button key={star} onClick={() => setReviewModal({...reviewModal, rating: star})}>
                          <Star className={`w-10 h-10 ${star <= reviewModal.rating ? 'text-accent-500 fill-accent-500 hover:scale-110' : 'text-gray-200 hover:text-gray-300'} transition-all`} />
                       </button>
                    ))}
                 </div>
                 <textarea placeholder="Tulis pengalaman belanja dan review produk ini (opsional)..." className="w-full border border-gray-300 p-3 text-sm h-28 resize-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" value={reviewModal.comment} onChange={e => setReviewModal({...reviewModal, comment: e.target.value})} />
                 
                 <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setReviewModal({open: false, orderId: '', productId: '', rating: 5, comment: ''})} className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-700 transition">Tutup</button>
                    <button onClick={submitReview} disabled={actionLoading} className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white bg-primary-800 hover:bg-primary-950 disabled:opacity-50 transition">
                       {actionLoading ? 'Menyimpan...' : 'Kirim Ulasan'}
                    </button>
                 </div>
              </div>
           </div>
        )}

    </>
  );
}

export default function BuyerOrdersPage() {
  return (
    <div className="min-h-screen bg-bg pt-12 lg:pt-14 pb-12 lg:pb-14 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold text-primary-900 border-l-4 border-primary-600 pl-4 mb-8">Pesanan Saya</h1>
        <Suspense fallback={<div className="flex justify-center py-14 lg:py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>}>
          <OrderList />
        </Suspense>
      </div>
    </div>
  );
}

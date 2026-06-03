'use client';
import { ShoppingBag, Package, CheckCircle2, Clock, Truck, Send, Loader2, XCircle, Search, AlertCircle, Camera } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { formatRupiah } from '@/lib/utils';
import Image from 'next/image';
import { fetchJson } from '@/lib/api-client';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Menunggu Bayar', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200' },
  terbayar: { label: 'Pesanan Baru', color: 'text-green-800', bg: 'bg-green-50 border-green-200' },
  diproses: { label: 'Diproses', color: 'text-blue-800', bg: 'bg-blue-50 border-blue-200' },
  dikirim: { label: 'Dikirim', color: 'text-indigo-800', bg: 'bg-indigo-50 border-indigo-200' },
  selesai: { label: 'Selesai', color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200' },
  dibatalkan: { label: 'Dibatalkan', color: 'text-red-800', bg: 'bg-red-50 border-red-200' },
};

const nextStatus: Record<string, string> = {
  terbayar: 'diproses',
  diproses: 'dikirim',
};

const nextStatusLabel: Record<string, string> = {
  terbayar: 'Tandai Diproses',
  diproses: 'Tandai Dikirim',
};


export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  // States for actions
  const [updating, setUpdating] = useState<string | null>(null);
  const [awbInputs, setAwbInputs] = useState<Record<string, string>>({});
  
  // Modals
  const [cancelModal, setCancelModal] = useState<{open: boolean, orderId: string, reason: string}>({open: false, orderId: '', reason: ''});
  const [photoModal, setPhotoModal] = useState<{open: boolean, photoUrl: string}>({open: false, photoUrl: ''});

  useEffect(() => {
    let mounted = true;
    fetchJson('/api/orders?owner=me', []).then((data) => {
      if (mounted) setOrders(data);
    });
    return () => { mounted = false; };
  }, []);

  async function updateOrderStatus(orderId: string, newStatus: string, additionalPayload: any = {}) {
    setUpdating(orderId);
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
        status: newStatus,
        awb_number: newStatus === 'dikirim' ? awbInputs[orderId] : undefined,
        ...additionalPayload,
      }),
    }).catch(() => undefined);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, ...additionalPayload } : o));
    if (newStatus === 'dikirim' && awbInputs[orderId]) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, awb_number: awbInputs[orderId] } : o));
    }
    setUpdating(null);
  }

  async function handleSellerCancel() {
    if (!cancelModal.reason) return alert('Silakan isi alasan pembatalan');
    setUpdating(cancelModal.orderId);
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: cancelModal.orderId,
        status: 'dibatalkan',
        cancellation_reason: cancelModal.reason,
        cancellation_requested_by: 'seller',
        cancellation_status: 'approved',
      }),
    }).catch(() => undefined);
    setOrders(prev => prev.map(o => o.id === cancelModal.orderId ? { 
      ...o, status: 'dibatalkan', cancellation_reason: cancelModal.reason, 
      cancellation_requested_by: 'seller', cancellation_status: 'approved' 
    } : o));
    setCancelModal({open: false, orderId: '', reason: ''});
    setUpdating(null);
  }

  const filtered = orders.filter(o => {
    if (filter !== 'all') {
      if (filter === 'pembatalan') {
         if (o.cancellation_status !== 'requested') return false;
      } else {
         if (o.status !== filter) return false;
      }
    }
    if (search) {
      const q = search.toLowerCase();
      const matchId = o.id?.toLowerCase().includes(q);
      const matchName = o.buyer_name?.toLowerCase().includes(q);
      const matchAwb = o.awb_number?.toLowerCase().includes(q);
      return matchId || matchName || matchAwb;
    }
    return true;
  });

  const statusCounts = orders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    if (o.cancellation_status === 'requested') {
       acc['pembatalan'] = (acc['pembatalan'] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-primary-900 border-l-4 border-primary-600 pl-4">Kelola Pesanan</h1>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 pl-5">
          KELOLA SEMUA PESANAN MASUK DARI PEMBELI.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Semua', count: orders.length },
          { key: 'terbayar', label: 'Pesanan Baru', count: statusCounts['terbayar'] || 0 },
          { key: 'diproses', label: 'Diproses', count: statusCounts['diproses'] || 0 },
          { key: 'dikirim', label: 'Dikirim', count: statusCounts['dikirim'] || 0 },
          { key: 'selesai', label: 'Selesai', count: statusCounts['selesai'] || 0 },
          { key: 'pembatalan', label: 'Pengajuan Batal', count: statusCounts['pembatalan'] || 0 },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors flex items-center gap-1.5 ${
              filter === tab.key
                ? 'bg-primary-800 text-white border-primary-800'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[8px] ${filter === tab.key ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-200 shadow-sm p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari ID Pesanan, Nama Pembeli, atau No. Resi..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Orders List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 border-t-4 border-t-primary-600 p-12 text-center shadow-sm">
          <ShoppingBag className="w-12 h-12 text-primary-200 mx-auto mb-4" />
          <p className="text-gray-600 font-bold mb-1">
            {orders.length === 0 ? 'Belum ada pesanan masuk' : 'Tidak ada pesanan cocok filter'}
          </p>
          <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold">
            Pesanan dari pembeli akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => {
            const sc = statusConfig[order.status] || statusConfig.pending;
            const orderDate = new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            const orderItems = order.order_items || [];
            
            // Can advance only if no cancellation is requested
            const canAdvance = nextStatus[order.status] && order.cancellation_status !== 'requested';
            const isCancelRequested = order.cancellation_status === 'requested';
            const canSellerCancel = ['pending', 'terbayar', 'diproses'].includes(order.status) && !isCancelRequested;

            return (
              <div key={order.id} className="bg-white border border-gray-200 shadow-sm flex flex-col xl:flex-row">
                
                {/* Left Area (Details) */}
                <div className="flex-1">
                   {/* Header */}
                   <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                     <div>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">{orderDate}</p>
                       <p className="text-xs font-mono text-primary-700">{order.id}</p>
                     </div>
                     <div className="flex items-center gap-3">
                       <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest border ${sc.bg} ${sc.color}`}>
                         {sc.label}
                       </span>
                       <span className="text-sm font-bold text-gray-900">{formatRupiah(order.total_amount)}</span>
                     </div>
                   </div>

                   {/* Buyer Info */}
                   <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap gap-x-8 gap-y-1 text-xs">
                     <div>
                       <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Pembeli: </span>
                       <span className="font-semibold text-gray-800">{order.buyer_name || order.buyer_id}</span>
                     </div>
                     {order.buyer_phone && (
                       <div>
                         <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">HP: </span>
                         <span className="font-semibold text-gray-800">{order.buyer_phone}</span>
                       </div>
                     )}
                     {order.shipping_address && (
                       <div>
                         <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Alamat: </span>
                         <span className="font-semibold text-gray-800">{order.shipping_address}</span>
                       </div>
                     )}
                     <div>
                       <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Metode: </span>
                       <span className="font-semibold text-gray-800 uppercase">{order.payment_method || 'midtrans'}</span>
                     </div>
                   </div>

                   {/* Items */}
                   <div className="px-6 py-4 space-y-3">
                     {orderItems.map((item: any, idx: number) => (
                       <div key={idx} className="flex items-center justify-between gap-3">
                         <div className="flex items-center gap-3 min-w-0">
                           <div className="w-10 h-10 bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 relative overflow-hidden">
                             {item.products?.image_url ? (
                               <img src={item.products.image_url} alt="" className="w-full h-full object-cover" />
                             ) : (
                               <Package className="w-4 h-4 text-gray-400" />
                             )}
                           </div>
                           <div className="min-w-0">
                             <p className="text-sm font-semibold text-gray-800 truncate">{item.products?.name || 'Produk'}</p>
                             <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{item.quantity}x @ {formatRupiah(item.price)}</p>
                           </div>
                         </div>
                         <p className="text-sm font-bold text-gray-900 shrink-0">{formatRupiah(item.price * item.quantity)}</p>
                       </div>
                     ))}
                   </div>
                   
                   {/* Proof of Completion / Reviews / Cancel Reason */}
                   {order.cancellation_reason && order.status === 'dibatalkan' && (
                     <div className="px-6 py-3 border-t border-red-100 bg-red-50/50 flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-red-800">
                           Dibatalkan oleh {order.cancellation_requested_by === 'buyer' ? 'Pembeli' : 'Penjual'}: {order.cancellation_reason}
                        </span>
                     </div>
                   )}

                   {order.completion_photo_base64 && order.status === 'selesai' && (
                     <div className="px-6 py-3 border-t border-emerald-100 bg-emerald-50/50 flex items-center justify-between text-[10px] uppercase font-bold tracking-widest">
                        <div className="flex items-center gap-2 text-emerald-800">
                           <Camera className="w-4 h-4" /> BUKTI TERIMA BARANG DARI PEMBELI
                        </div>
                        <button onClick={() => setPhotoModal({open: true, photoUrl: order.completion_photo_base64})} className="px-3 py-1 bg-emerald-200 text-emerald-900 hover:bg-emerald-300">
                           Lihat Foto
                        </button>
                     </div>
                   )}
                </div>

                {/* Right Area (Actions) / Bottom Area on mobile */}
                <div className="xl:w-64 border-t xl:border-t-0 xl:border-l border-gray-200 bg-gray-50 flex flex-col">
                   <div className="p-4 flex-1">
                      {/* Cancel Request Panel */}
                      {isCancelRequested ? (
                         <div className="space-y-3">
                            <div className="bg-amber-100 p-3 border border-amber-200">
                               <p className="text-[10px] font-bold tracking-widest uppercase text-amber-900 mb-1 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Pengajuan Batal</p>
                               <p className="text-sm text-amber-950">"{order.cancellation_reason}"</p>
                            </div>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'dibatalkan', { cancellation_status: 'approved' })}
                              disabled={updating === order.id}
                              className="w-full py-2 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 disabled:opacity-50"
                            >
                              Setujui Batal
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order.id, order.status, { cancellation_status: 'rejected' })}
                              disabled={updating === order.id}
                              className="w-full py-2 border border-gray-300 bg-white text-gray-700 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 disabled:opacity-50"
                            >
                              Tolak Pengajuan
                            </button>
                         </div>
                      ) : (
                         <div className="space-y-3">
                            {order.status === 'diproses' && (
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 block">Input No. Resi</label>
                                <input
                                  type="text"
                                  placeholder="Ketik resi kurir..."
                                  className="w-full border border-gray-300 p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                  value={awbInputs[order.id] || ''}
                                  onChange={e => setAwbInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                                />
                              </div>
                            )}

                            {order.awb_number && (
                              <div className="p-2 border border-indigo-200 bg-indigo-50 flex flex-col gap-1">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-500">No. Resi Aktif</span>
                                <span className="text-xs font-bold text-indigo-900">{order.awb_number}</span>
                              </div>
                            )}

                            {canAdvance && (
                              <button
                                onClick={() => updateOrderStatus(order.id, nextStatus[order.status])}
                                disabled={updating === order.id || (order.status === 'diproses' && !awbInputs[order.id])}
                                className="w-full flex justify-center items-center gap-2 bg-primary-800 text-white py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950 transition-colors disabled:opacity-50"
                              >
                                {updating === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {nextStatusLabel[order.status]}
                              </button>
                            )}

                            {canSellerCancel && (
                              <button
                                onClick={() => setCancelModal({open: true, orderId: order.id, reason: ''})}
                                className="w-full border border-red-200 text-red-600 bg-red-50 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 hover:border-red-300 transition-colors"
                              >
                                Batalkan (Toko)
                              </button>
                            )}
                         </div>
                      )}
                   </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* --- MODALS --- */}
      
      {/* Seller Cancel Modal */}
      {cancelModal.open && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white p-6 max-w-md w-full border border-gray-200 shadow-xl">
               <h3 className="text-lg font-bold text-gray-900 mb-4">Pembatalan Oleh Penjual</h3>
               <p className="text-xs text-gray-500 mb-4 tracking-widest uppercase font-bold">Harap sebutkan alasan (misal: Stok habis):</p>
               <input 
                  autoFocus
                  type="text" 
                  placeholder="Ketik alasan pembatalan..." 
                  className="w-full border p-3 border-gray-300 mb-4 text-sm" 
                  value={cancelModal.reason} 
                  onChange={e => setCancelModal({...cancelModal, reason: e.target.value})} 
               />
               <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setCancelModal({open: false, orderId: '', reason: ''})} className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-700 transition">Tutup</button>
                  <button onClick={handleSellerCancel} disabled={updating === cancelModal.orderId || !cancelModal.reason} className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition">
                     {updating === cancelModal.orderId ? 'Memproses...' : 'Konfirmasi Batal'}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Photo Preview Modal */}
      {photoModal.open && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPhotoModal({open: false, photoUrl: ''})}>
            <div className="bg-white p-2 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
               <div className="relative aspect-auto min-h-[50vh]">
                  <Image src={photoModal.photoUrl} alt="Bukti Selesai" fill className="object-contain" />
               </div>
               <button onClick={() => setPhotoModal({open: false, photoUrl: ''})} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[10px] uppercase font-bold tracking-widest mt-2">
                 Tutup Gambar
               </button>
            </div>
         </div>
      )}

    </div>
  );
}

'use client';
/**
 * app/admin/umkm/toko/page.tsx
 * Admin Store Management — approve/reject/activate/deactivate stores.
 */
import { useState, useEffect } from 'react';
import { Store, CheckCircle, XCircle, Loader2, Clock, Activity, Power, PowerOff, RefreshCw } from 'lucide-react';
import { fetchJson } from '@/lib/api-client';

export default function AdminStoreApprovalPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchJson('/api/stores', []).then((data) => {
      if (!mounted) return;
      setStores(data);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  async function updateStoreStatus(storeId: string, status: 'active' | 'rejected' | 'pending') {
    setUpdating(storeId);
    await fetch(`/api/stores/${storeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => undefined);
    setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, status } : s)));
    setUpdating(null);
  }

  const pending = stores.filter((s) => s.status === 'pending');
  const active = stores.filter((s) => s.status === 'active');
  const rejected = stores.filter((s) => s.status === 'rejected');

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    pending: { label: 'Menunggu', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
    active: { label: 'Aktif', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: Activity },
    rejected: { label: 'Nonaktif', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-primary-900 border-l-4 border-primary-600 pl-4">Manajemen Toko</h1>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 pl-5">Setujui, tolak, aktifkan, atau nonaktifkan toko seller</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Menunggu', value: pending.length, color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { label: 'Aktif', value: active.length, color: 'text-green-700 bg-green-50 border-green-200' },
          { label: 'Nonaktif', value: rejected.length, color: 'text-red-700 bg-red-50 border-red-200' },
        ].map((s) => (
          <div key={s.label} className={`border p-6 text-center ${s.color}`}>
            <div className="text-3xl font-semibold">{s.value}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest mt-2">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      ) : stores.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 text-gray-400 flex flex-col items-center justify-center">
          <Store className="w-8 h-8 mb-4 text-gray-300" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Belum ada toko terdaftar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stores.map((store) => {
            const config = statusConfig[store.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            const isUpdating = updating === store.id;

            return (
              <div key={store.id} className="bg-white border border-gray-200 p-5">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="w-12 h-12 bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                    <Store className="w-6 h-6 text-primary-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-primary-900">{store.name}</h4>
                    <p className="text-xs text-gray-500 truncate">{store.description || 'Tidak ada deskripsi'}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      User: {store.user_id?.slice(0, 12)}... · {new Date(store.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>

                  <div className={`flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-bold uppercase tracking-widest ${config.bg} ${config.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {config.label}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 flex-wrap">
                  {/* Pending: Approve / Reject */}
                  {store.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStoreStatus(store.id, 'active')}
                        disabled={isUpdating}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Setujui
                      </button>
                      <button
                        onClick={() => updateStoreStatus(store.id, 'rejected')}
                        disabled={isUpdating}
                        className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Tolak
                      </button>
                    </>
                  )}

                  {/* Active: Deactivate */}
                  {store.status === 'active' && (
                    <button
                      onClick={() => updateStoreStatus(store.id, 'rejected')}
                      disabled={isUpdating}
                      className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <PowerOff className="w-3.5 h-3.5" />}
                      Nonaktifkan
                    </button>
                  )}

                  {/* Rejected/Nonaktif: Reactivate */}
                  {store.status === 'rejected' && (
                    <button
                      onClick={() => updateStoreStatus(store.id, 'active')}
                      disabled={isUpdating}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                      Aktifkan Kembali
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CalendarDays, Loader2, MapPin, Package, ShieldCheck, ShoppingBag, Star, Store, TrendingUp } from 'lucide-react';
import { ProductCard } from '@/components/ui/ProductCard';
import { fetchJson } from '@/lib/api-client';

export default function PublicStoreDetailPage() {
  const params = useParams();
  const storeId = params.id as string;
  const [store, setStore] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadStore() {
      const [storeData, productData] = await Promise.all([
        fetchJson(`/api/stores/${storeId}`, null),
        fetchJson(`/api/products?store_id=${storeId}`, []),
      ]);

      if (!mounted) return;
      setStore(storeData);
      setProducts(Array.isArray(productData) ? productData : []);
      setLoading(false);
    }

    loadStore();
    return () => {
      mounted = false;
    };
  }, [storeId]);

  const stats = useMemo(() => {
    const reviews = products.reduce((sum, product) => sum + Number(product.reviews_count || 0), 0);
    const totalRating = products.reduce((sum, product) => sum + Number(product.rating || 0) * Number(product.reviews_count || 0), 0);
    const sold = products.reduce((sum, product) => sum + Number(product.sales_count || 0), 0);

    return {
      reviews,
      sold,
      rating: reviews > 0 ? (totalRating / reviews).toFixed(1) : '0.0',
    };
  }, [products]);

  if (loading) {
    return (
      <main className="min-h-[calc(100dvh-5rem)] bg-bg pt-24 px-4 flex items-start justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-primary-700" />
      </main>
    );
  }

  if (!store || store.status !== 'active') {
    return (
      <main className="min-h-[calc(100dvh-5rem)] bg-bg pt-24 px-4">
        <section className="max-w-md mx-auto bg-white border border-gray-200 p-10 text-center shadow-sm">
          <Store className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h1 className="text-xl font-bold text-primary-950 mb-2">Toko Tidak Ditemukan</h1>
          <p className="text-sm text-gray-500 mb-6">Toko ini belum aktif atau sudah tidak tersedia.</p>
          <Link href="/umkm" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950 transition-colors">
            Kembali ke UMKM
          </Link>
        </section>
      </main>
    );
  }

  const joinedAt = store.created_at
    ? new Date(store.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    : '-';

  return (
    <main className="min-h-[calc(100dvh-5rem)] bg-bg pt-10 lg:pt-12 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <Link href="/umkm" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-primary-700 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Marketplace
        </Link>

        <section className="bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-primary-900 px-6 md:px-8 py-8 text-white">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex items-center gap-5 min-w-0">
                <div className="relative w-24 h-24 rounded-full bg-white/10 border border-white/20 shrink-0 overflow-hidden">
                  {store.logo_url ? (
                    <Image src={store.logo_url} alt={store.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="w-10 h-10 text-white/70" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/15 text-[10px] font-bold uppercase tracking-widest mb-3">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Seller Terverifikasi
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight truncate">{store.name}</h1>
                  {store.address && (
                    <p className="mt-3 text-sm text-white/80 flex items-start gap-2 max-w-2xl">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{store.address}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 min-w-[260px]">
                {[
                  { label: 'Produk', value: products.length, icon: Package },
                  { label: 'Rating', value: stats.reviews > 0 ? stats.rating : '-', icon: Star },
                  { label: 'Terjual', value: stats.sold, icon: TrendingUp },
                ].map((item) => (
                  <div key={item.label} className="border border-white/15 bg-white/10 px-4 py-3">
                    <item.icon className="w-4 h-4 text-white/70 mb-2" />
                    <p className="text-xl font-bold">{item.value}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6 p-6 md:p-8 border-b border-gray-100">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Tentang Toko</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {store.description || 'Toko ini belum menambahkan deskripsi.'}
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-4 h-fit">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Informasi Toko</p>
              <div className="space-y-3 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary-700" />
                  Bergabung {joinedAt}
                </div>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-primary-700" />
                  {products.length} produk aktif
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary-700" />
                  {stats.reviews} ulasan pembeli
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary-700 mb-1">Etalase Produk</p>
              <h2 className="text-2xl font-bold text-primary-950">Produk dari {store.name}</h2>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="bg-white border border-gray-200 p-10 text-center text-gray-500">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm">Belum ada produk aktif di toko ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

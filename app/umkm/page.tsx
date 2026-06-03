'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Search, Store, Star, ShoppingBag } from 'lucide-react';
import { ProductCard } from '@/components/ui/ProductCard';
import CartDrawer from '@/components/marketplace/CartDrawer';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { fetchJson } from '@/lib/api-client';


export default function UMKMPage() {
  const t = useTranslations('umkm');
  const router = useRouter();
  // Use stable keys (DB values / 'all') so changing language never invalidates the filter.
  const CATEGORY_DEFS = [
    { key: 'all', label: t('cat_all') },
    { key: 'Makanan', label: t('cat_food') },
    { key: 'Kerajinan', label: t('cat_crafts') },
    { key: 'Pertanian', label: t('cat_agri') },
    { key: 'Fashion', label: t('cat_fashion') },
    { key: 'Jasa', label: t('cat_services') },
  ];

  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeStores: 0,
    verifiedStores: 0,
    soldProducts: 0,
    averageRating: 0,
    reviewsCount: 0,
  });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetchJson('/api/products', []),
      fetchJson('/api/umkm/stats', {
        activeStores: 0,
        verifiedStores: 0,
        soldProducts: 0,
        averageRating: 0,
        reviewsCount: 0,
      }),
    ]).then(([productData, statsData]) => {
      if (!mounted) return;
      setProducts(productData);
      setStats(statsData);
    });
    return () => { mounted = false; };
  }, []);

  const featured = products.filter((p) => p.featured);
  const filtered = products.filter((p) => {
    const matchSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.seller_name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || p.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div>
      {/* ── Minimalist Elegant Banner ── */}
      <div className="relative bg-bg pt-12 lg:pt-16 pb-12 lg:pb-14 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-60" />

        <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Text */}
          <div className="lg:col-span-5 flex flex-col justify-center text-center lg:text-left order-2 lg:order-1 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 mb-6 mx-auto lg:mx-0 w-max">
              <ShoppingBag className="w-4 h-4 text-primary-600" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary-700">Marketplace Desa</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[54px] font-semibold text-primary-950 leading-[1.1] mb-6 tracking-tight">
              {t('title_1')} <br className="hidden lg:block" /> {t('title_2')}
            </h1>

            <p className="text-gray-500 text-sm md:text-base leading-relaxed max-w-md mx-auto lg:mx-0">
              {t('subtitle')} Temukan produk unggulan dan kerajinan lokal berkualitas tinggi langsung dari tangan kreatif warga desa.
            </p>
          </div>

          {/* Right Image Container */}
          <div className="lg:col-span-7 relative order-1 lg:order-2">
            <div className="relative w-full aspect-[4/3] lg:aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl shadow-primary-900/10">
              <Image
                src="/umkm-banner.jpg"
                alt="Produk UMKM"
                fill
                className="object-cover hover:scale-105 transition-transform duration-1000"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-900/20 to-transparent mix-blend-overlay" />
            </div>

            <div className="absolute -bottom-6 -left-4 lg:-left-10 bg-white/95 backdrop-blur-md px-5 py-4 rounded-2xl shadow-xl border border-black/5 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 z-20">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                <Store className="w-6 h-6 text-amber-600" />
              </div>
              <div className="pr-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Terverifikasi</p>
                <p className="text-sm font-bold text-gray-800">
                  {stats.verifiedStores} UMKM Lokal
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
          {[
            { label: 'UMKM Aktif', value: stats.activeStores, color: 'bg-primary-50 text-primary-700 border-primary-100' },
            { label: 'Produk Terjual', value: stats.soldProducts, color: 'bg-accent-50 text-amber-700 border-accent-100' },
            { label: 'Rating Rata-Rata', value: stats.reviewsCount > 0 ? stats.averageRating.toFixed(1) : '-', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          ].map((s) => (
            <div key={s.label} className={`p-4 sm:p-4 text-center border flex flex-row sm:flex-col items-center justify-between sm:justify-center ${s.color}`}>
              <div className="text-[10px] font-bold tracking-widest uppercase sm:mt-1 order-2 sm:order-2 text-right sm:text-center max-w-[50%] sm:max-w-none">{s.label}</div>
              <div className="text-2xl font-extrabold order-1 sm:order-1">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Featured section */}
        {featured.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-accent-500 fill-accent-500" />
              <h2 className="font-bold text-gray-900">{t('featured_title')}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featured.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}

        {/* Filters and search */}
        <div className="mb-10 text-center lg:text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6">Filter Kategori</p>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 pb-6">
            <div className="flex gap-2 w-full overflow-x-auto scrollbar-none pb-2 sm:pb-0">
              {CATEGORY_DEFS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`shrink-0 whitespace-nowrap px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    category === c.key ? 'bg-primary-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white text-xs border border-gray-200 focus:border-primary-900 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* All products grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>

        {/* CTA for sellers */}
        <div className="mt-12 lg:mt-14 border-t border-gray-200 pt-10 lg:pt-12 flex flex-col items-center">
          <h3 className="font-bold text-2xl text-primary-950 tracking-tight mb-4">{t('cta_title')}</h3>
          <p className="text-gray-500 text-xs max-w-md text-center leading-relaxed mb-8">{t('cta_desc')}</p>
          <a href="/umkm/daftar" className="bg-primary-800 hover:bg-primary-950 text-white text-[10px] font-bold uppercase tracking-widest px-8 py-3 transition-colors">
            {t('cta_btn')}
          </a>
        </div>
      </div>

      {/* Cart Integration */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false);
          router.push('/umkm/checkout');
        }}
      />
    </div>
  );
}

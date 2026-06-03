'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Store, Trash2, Phone, Plus, Loader2 } from 'lucide-react';
import { CardGridSkeleton } from '@/components/ui/Skeletons';
import AddProductModal from '@/components/admin/AddProductModal';
import { formatRupiah } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { fetchJson } from '@/lib/api-client';

export default function AdminUMKMPage() {
  const t = useTranslations('admin_umkm');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchJson('/api/products?scope=admin', []).then((data) => {
      if (!mounted) return;
      setProducts(data);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  async function deleteProduct(id: string) {
    if (confirm(t('confirm_delete'))) {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) setProducts((p) => p.filter((prod) => prod.id !== id));
    }
  }


  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-primary-900 border-l-4 border-primary-600 pl-4">{t('title')}</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 pl-5">{t('subtitle')}</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('add_product')}
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t('stat_total'), value: products.length, color: 'text-blue-700 bg-blue-50 border-blue-200' },
          { label: t('cat_food'), value: products.filter((p) => p.category === 'Makanan').length, color: 'text-orange-700 bg-orange-50 border-orange-200' },
          { label: t('cat_crafts'), value: products.filter((p) => p.category === 'Kerajinan').length, color: 'text-purple-700 bg-purple-50 border-purple-200' },
          { label: t('cat_others'), value: products.filter((p) => !['Makanan', 'Kerajinan'].includes(p.category)).length, color: 'text-gray-700 bg-gray-50 border-gray-200' },
        ].map((s) => (
          <div key={s.label} className={`border p-6 text-center ${s.color}`}>
            <div className="text-3xl font-semibold">{s.value}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest mt-2">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <CardGridSkeleton count={8} cols={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white border border-gray-200 hover:border-primary-400 transition-colors flex flex-col">
              {/* Image */}
              <div className="relative h-40 bg-gray-100 border-b border-gray-200">
                <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                <span className="absolute top-2 left-2 px-3 py-1 bg-white border border-gray-200 text-[9px] font-bold uppercase tracking-widest text-gray-700">
                  {product.category}
                </span>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <h4 className="font-semibold text-primary-900 text-sm line-clamp-1 mb-1">{product.name}</h4>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">{product.seller_name}</p>
                <p className="font-bold text-primary-800 text-sm mt-auto mb-4">{formatRupiah(product.price)}</p>

                {/* Actions */}
                <div className="flex gap-2">
                  <a
                    href={`https://wa.me/${product.phone_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-widest transition-colors"
                  >
                    <Phone className="w-3 h-3" /> WA
                  </a>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="flex items-center justify-center px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="col-span-full text-center py-16 bg-white border border-gray-200 text-gray-400 flex flex-col items-center justify-center">
              <Store className="w-8 h-8 mb-4 border p-2 text-gray-300" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t('empty')}</p>
            </div>
          )}
        </div>
      )}

      <AddProductModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={(newProduct) => {
          // If we receive the new product, we prepend it to the list
          setProducts([newProduct, ...products]);
        }} 
      />
    </div>
  );
}

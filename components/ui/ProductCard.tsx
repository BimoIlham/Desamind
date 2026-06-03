/**
 * components/ui/ProductCard.tsx — Redesigned v3 with Cart Integration
 * UMKM Product card: image, price, WhatsApp CTA, Add to Cart.
 */
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Phone, Star, ShoppingBag, TrendingUp, Award, ShoppingCart, Check } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useCart } from '@/components/marketplace/CartContext';
import { useState } from 'react';

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const waText = encodeURIComponent(`Halo ${product.seller_name}, saya tertarik dengan produk "${product.name}" yang saya lihat di DesaMind. Apakah masih tersedia?`);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      image_url: product.image_url ?? '',
      seller_name: product.seller_name,
      category: product.category,
      phone_number: product.phone_number || '',
      stock: product.stock ?? 0,
      store_id: (product as any).store_id || undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div
      onClick={() => router.push(`/umkm/${product.id}`)}
      className="block group cursor-pointer bg-white overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <Image
            src={product.image_url || '/file.svg'}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          {product.featured && (
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-500 text-white text-[10px] font-bold shadow-sm">
              <Award className="w-3 h-3" />
              Unggulan
            </div>
          )}
          {product.sales_count && product.sales_count > 50 && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
              <TrendingUp className="w-3 h-3" />
              Bestseller
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary-600 mb-1">{product.category}</p>
          <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 leading-snug">{product.name}</h3>
          <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-1">{product.description}</p>

          {/* Rating + sales */}
          <div className="flex flex-col gap-1 mb-3">
             <div className="flex items-center gap-2">
               <div className="flex items-center gap-0.5">
                 {[1, 2, 3, 4, 5].map((i) => (
                   <Star key={i} className={`w-3 h-3 ${product.reviews_count && product.reviews_count > 0 && i <= Math.round(product.rating ?? 0) ? 'text-accent-500 fill-accent-500' : 'text-gray-300'}`} />
                 ))}
               </div>
               {product.reviews_count && product.reviews_count > 0 ? (
                 <span className="text-[11px] text-gray-500 font-medium">{Number(product.rating).toFixed(1)}</span>
               ) : (
                 <span className="text-[10px] text-gray-400 italic">Belum ada ulasan</span>
               )}
             </div>
             {product.sales_count && product.sales_count > 0 && (
               <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{product.sales_count} terjual</span>
             )}
          </div>

          {/* Seller */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5 text-primary-600" />
            </div>
            <span className="text-xs text-gray-600 font-medium">{product.seller_name}</span>
          </div>

          {/* Price + CTAs */}
          <div className="pt-3 border-t border-gray-50 space-y-2">
            <div className="text-lg font-extrabold text-gray-900">{formatRupiah(product.price)}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold transition-all duration-300 ${
                  added
                    ? 'bg-green-500 text-white'
                    : 'bg-primary-800 hover:bg-primary-950 text-white'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Ditambahkan
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5" />
                    + Keranjang
                  </>
                )}
              </button>
              <a
                href={`https://wa.me/${product.whatsapp || product.phone_number}?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center px-3 py-2 bg-green-500 hover:bg-green-600 text-white transition"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
            </div>
        </div>
      </div>
    </div>
  );
}

'use client';
/**
 * app/umkm/[id]/page.tsx
 * Product Detail Page — shows full product info, reviews, and add-to-cart.
 */
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowLeft, Star, ShoppingBag, Phone, ShoppingCart, Check, Loader2, Store, MapPin, ChevronRight } from 'lucide-react';
import { useCart } from '@/components/marketplace/CartContext';
import { formatRupiah } from '@/lib/utils';
import { useParams } from 'next/navigation';
import { fetchJson } from '@/lib/api-client';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const { addItem } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function load() {
      const fallback = null;
      const [prod, productReviews] = await Promise.all([
        fetchJson(`/api/products/${productId}`, fallback),
        fetchJson(`/api/reviews?product_id=${productId}`, []),
      ]);
      if (prod) setProduct(prod);
      setReviews(productReviews);
      setLoading(false);
    }
    load();
  }, [productId]);

  function handleAddToCart() {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      image_url: product.image_url,
      seller_name: product.seller_name,
      category: product.category,
      phone_number: product.phone_number || '',
      stock: product.stock || 99,
      store_id: product.store_id || undefined,
      user_id: product.user_id || undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-5rem)] flex items-center justify-center bg-bg">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[calc(100dvh-5rem)] bg-bg pt-12 lg:pt-14 pb-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-700 mb-2">Produk Tidak Ditemukan</h1>
          <p className="text-sm text-gray-500 mb-6">Produk yang Anda cari mungkin telah dihapus atau tidak tersedia.</p>
          <Link href="/umkm" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950 transition-colors">
            Kembali ke Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const hasReviews = reviews.length > 0;
  const avgRating = hasReviews
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const waText = encodeURIComponent(`Halo ${product.seller_name}, saya tertarik dengan produk "${product.name}" di DesaMind. Apakah masih tersedia?`);
  const store = product.stores;
  const storeHref = product.store_id ? `/umkm/store/${product.store_id}` : null;

  return (
    <div className="min-h-[calc(100dvh-5rem)] bg-bg pt-10 lg:pt-12 pb-14 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back */}
        <Link href="/umkm" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-primary-700 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Image */}
          <div className="relative aspect-square bg-gray-100 overflow-hidden border border-gray-200">
            <Image src={product.image_url} alt={product.name} fill className="object-cover" />
            {product.featured && (
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-white" /> Unggulan
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="flex flex-col">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary-600 mb-2">{product.category}</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-primary-950 tracking-tight mb-3">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={`w-4 h-4 ${hasReviews && i <= Math.round(Number(avgRating)) ? 'text-accent-500 fill-accent-500' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {hasReviews ? `${avgRating} (${reviews.length} ulasan)` : 'Belum ada ulasan'}
              </span>
            </div>

            {/* Price */}
            <div className="text-3xl font-extrabold text-primary-900 mb-4">{formatRupiah(product.price)}</div>

            {/* Description */}
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Deskripsi</p>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description || 'Tidak ada deskripsi.'}</p>
            </div>

            {/* Seller info */}
            <div className="p-4 bg-gray-50 border border-gray-200 mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Penjual</p>
              <Link
                href={storeHref || '/umkm'}
                className="group flex items-center justify-between gap-3 hover:bg-white/70 transition-colors -m-2 p-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden border border-primary-100 shrink-0">
                    {store?.logo_url ? (
                      <Image src={store.logo_url} alt={store.name || product.seller_name} fill className="object-cover" unoptimized />
                    ) : (
                      <ShoppingBag className="w-5 h-5 text-primary-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 group-hover:text-primary-800 transition-colors">{store?.name || product.seller_name}</p>
                    <p className="text-xs text-gray-500">Seller terverifikasi</p>
                    {store?.address && (
                      <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {store.address}
                      </p>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-700 shrink-0" />
              </Link>
            </div>

            {/* Stock */}
            {product.stock !== undefined && (
              <p className="text-xs text-gray-500 mb-4">
                Stok: <span className="font-bold text-gray-700">{product.stock > 0 ? product.stock : 'Habis'}</span>
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-auto">
              <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                  added
                    ? 'bg-green-500 text-white'
                    : 'bg-primary-800 hover:bg-primary-950 text-white'
                }`}
              >
                {added ? (
                  <><Check className="w-4 h-4" /> Ditambahkan ke Keranjang</>
                ) : (
                  <><ShoppingCart className="w-4 h-4" /> Tambah ke Keranjang</>
                )}
              </button>
              <a
                href={`https://wa.me/${product.whatsapp || product.phone_number}?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-5 py-3.5 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold uppercase tracking-widest transition"
              >
                <Phone className="w-4 h-4" /> WA
              </a>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8 lg:mt-10">
          <h2 className="text-lg font-bold text-primary-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-accent-500" />
            Ulasan Pembeli ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <div className="bg-white border border-gray-200 p-8 text-center">
              <Star className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Belum ada ulasan untuk produk ini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review: any) => {
                const buyerName = review.orders?.buyer_name || 'Anonim';
                const initial = buyerName.charAt(0).toUpperCase();
                return (
                  <div key={review.id} className="bg-white border border-gray-200 p-5">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg shrink-0 border border-primary-200 shadow-sm">
                        {initial}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{buyerName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i <= review.rating ? 'text-accent-500 fill-accent-500' : 'text-gray-200'}`} />
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(review.created_at).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.comment && <p className="text-sm text-gray-700 leading-relaxed mb-3">{review.comment}</p>}
                    
                    {/** Foto Penyelesaian Pesanan **/}
                    {review.orders?.completion_photo_base64 && (
                      <div className="mt-3 relative w-24 h-24 border border-gray-200 rounded overflow-hidden">
                        <Image src={review.orders.completion_photo_base64} alt="Foto dari pembeli" fill className="object-cover hover:scale-105 transition-transform" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

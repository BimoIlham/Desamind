'use client';
/**
 * components/marketplace/CartDrawer.tsx
 * Slide-out cart drawer from the right.
 */
import { X, Minus, Plus, ShoppingCart, Trash2, CreditCard } from 'lucide-react';
import Image from 'next/image';
import { useEffect } from 'react';
import { useCart } from './CartContext';
import { formatRupiah } from '@/lib/utils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
  const { items, total, count, isValidating, removeItem, updateQty, validateCart, clear } = useCart();

  useEffect(() => {
    if (isOpen) validateCart();
  }, [isOpen, validateCart]);

  async function handleCheckout() {
    const validItems = await validateCart();
    if (validItems.length > 0) onCheckout();
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-primary-700" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary-900">
              Keranjang ({count})
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-sm font-semibold">Keranjang kosong</p>
              <p className="text-xs mt-1 text-gray-400">Temukan produk UMKM terbaik!</p>
            </div>
          ) : (
            <>
            {isValidating && (
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary-700 bg-primary-50 border border-primary-100 px-3 py-2">
                Memeriksa ketersediaan produk...
              </div>
            )}
            {items.map((item) => (
              <div key={item.product.id} className="flex gap-3 p-3 border border-gray-100 bg-white hover:border-primary-200 transition-colors">
                <div className="relative w-20 h-20 shrink-0 bg-gray-100 overflow-hidden">
                  <Image src={item.product.image_url || '/placeholder.jpg'} alt={item.product.name} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">{item.product.name}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{item.product.seller_name}</p>
                  <p className="text-sm font-bold text-primary-800 mt-1">{formatRupiah(item.product.price)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQty(item.product.id, item.quantity - 1)}
                      className="p-1 border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-semibold w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= Number(item.product.stock ?? 0)}
                      className="p-1 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="ml-auto p-1 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-5 space-y-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Total</span>
              <span className="text-xl font-bold text-primary-900">{formatRupiah(total)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={isValidating}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950 transition-colors disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              Checkout
            </button>
            <button
              onClick={clear}
              className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-red-600 transition-colors"
            >
              Kosongkan Keranjang
            </button>
          </div>
        )}
      </div>
    </>
  );
}

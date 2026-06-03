'use client';
/**
 * components/marketplace/FloatingCartButton.tsx
 * A floating "View Cart" button that appears on marketplace pages.
 */
import { ShoppingCart } from 'lucide-react';
import { useCart } from './CartContext';

interface FloatingCartButtonProps {
  onClick: () => void;
}

export default function FloatingCartButton({ onClick }: FloatingCartButtonProps) {
  const { count } = useCart();

  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-6 z-30 flex items-center gap-2 px-4 py-3 bg-primary-800 text-white shadow-lg hover:bg-primary-950 transition-all hover:scale-105 active:scale-95"
      aria-label="Open Cart"
    >
      <ShoppingCart className="w-5 h-5" />
      <span className="text-[10px] font-bold uppercase tracking-widest">Keranjang</span>
      <span className="ml-1 w-6 h-6 bg-white text-primary-900 rounded-full text-xs font-bold flex items-center justify-center">
        {count}
      </span>
    </button>
  );
}

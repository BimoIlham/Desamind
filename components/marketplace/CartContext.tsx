'use client';
/**
 * components/marketplace/CartContext.tsx
 * React Context/Provider for shopping cart state across the app.
 */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  type CartItem,
  type MarketplaceProduct,
  getCart,
  saveCart,
  addToCart as addToCartUtil,
  removeFromCart as removeFromCartUtil,
  updateCartQty as updateCartQtyUtil,
  clearCart as clearCartUtil,
  cartTotal,
} from '@/lib/marketplace';

interface CartContextType {
  items: CartItem[];
  total: number;
  count: number;
  isValidating: boolean;
  addItem: (product: MarketplaceProduct, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  validateCart: () => Promise<CartItem[]>;
  clear: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const validateCart = useCallback(async () => {
    const current = getCart();
    if (current.length === 0) {
      setItems([]);
      return [];
    }

    setIsValidating(true);
    try {
      const checked = await Promise.all(
        current.map(async (item) => {
          const response = await fetch(`/api/products/${item.product.id}`, { cache: 'no-store' });
          if (!response.ok) return null;

          const product = (await response.json()) as MarketplaceProduct;
          const stock = Number(product.stock ?? item.product.stock ?? 0);
          if (stock <= 0) return null;

          return {
            product: {
              ...item.product,
              ...product,
              stock,
            },
            quantity: Math.min(Math.max(1, item.quantity), stock),
          };
        })
      );

      const validItems = checked.filter(Boolean) as CartItem[];
      saveCart(validItems);
      setItems(validItems);
      return validItems;
    } catch {
      setItems(current);
      return current;
    } finally {
      setIsValidating(false);
    }
  }, []);

  useEffect(() => {
    setItems(getCart());
    validateCart();

    const handleFocus = () => validateCart();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [validateCart]);

  const addItem = useCallback((product: MarketplaceProduct, qty = 1) => {
    const updated = addToCartUtil(product, qty);
    setItems([...updated]);
  }, []);

  const removeItem = useCallback((productId: string) => {
    const updated = removeFromCartUtil(productId);
    setItems([...updated]);
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    const updated = updateCartQtyUtil(productId, qty);
    setItems([...updated]);
  }, []);

  const clear = useCallback(() => {
    clearCartUtil();
    setItems([]);
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        total: cartTotal(items),
        count: items.reduce((s, i) => s + i.quantity, 0),
        isValidating,
        addItem,
        removeItem,
        updateQty,
        validateCart,
        clear,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

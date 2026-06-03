/**
 * lib/marketplace.ts
 * Marketplace types, helpers, and cart utilities for UMKM feature.
 */

// ===== TYPES =====
export type Store = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  address?: string;
  logo_url?: string;
  status: 'pending' | 'active' | 'rejected';
  created_at: string;
};

export type MarketplaceProduct = {
  id: string;
  user_id?: string;
  store_id?: string;
  seller_name: string;
  name: string;
  description: string;
  price: number;
  phone_number: string;
  whatsapp?: string;
  image_url: string;
  category: string;
  stock: number;
  featured?: boolean;
  sales_count?: number;
  rating?: number;
  created_at?: string;
};

export type Order = {
  id: string;
  buyer_id: string;
  store_id?: string;
  total_amount: number;
  status: 'pending' | 'terbayar' | 'diproses' | 'dikirim' | 'selesai' | 'dibatalkan';
  awb_number?: string;
  payment_token?: string;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: MarketplaceProduct;
};

export type Review = {
  id: string;
  order_id: string;
  product_id: string;
  buyer_id: string;
  rating: number;
  comment?: string;
  created_at: string;
};

// ===== CART =====
export type CartItem = {
  product: MarketplaceProduct;
  quantity: number;
};

const CART_KEY = 'desamind_cart';

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addToCart(product: MarketplaceProduct, qty = 1): CartItem[] {
  const cart = getCart();
  const existing = cart.find((c) => c.product.id === product.id);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({ product, quantity: qty });
  }
  saveCart(cart);
  return cart;
}

export function removeFromCart(productId: string): CartItem[] {
  const cart = getCart().filter((c) => c.product.id !== productId);
  saveCart(cart);
  return cart;
}

export function updateCartQty(productId: string, qty: number): CartItem[] {
  const cart = getCart();
  const item = cart.find((c) => c.product.id === productId);
  if (item) {
    item.quantity = Math.max(1, qty);
  }
  saveCart(cart);
  return cart;
}

export function clearCart(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CART_KEY);
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

// ===== ORDER STATUS =====
export const ORDER_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Menunggu Bayar', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  terbayar: { label: 'Terbayar', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  diproses: { label: 'Diproses', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  dikirim: { label: 'Dikirim', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  selesai: { label: 'Selesai', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  dibatalkan: { label: 'Dibatalkan', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

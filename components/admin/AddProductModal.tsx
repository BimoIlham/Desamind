'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ImageUpload } from '@/components/ui/ImageUpload';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProduct: any) => void;
}

export default function AddProductModal({ isOpen, onClose, onSuccess }: AddProductModalProps) {
  const t = useTranslations('admin_umkm');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Makanan',
    phone_number: '',
    seller_name: '',
    image_url: '',
  });

  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseInt(formData.price),
          user_id: 'admin', // Placeholder or actual admin ID
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add product');
      }

      const newProduct = await res.json();
      onSuccess(newProduct);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-bold uppercase tracking-widest text-primary-900">{t('add_product')}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 border border-red-200 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Product Name *</label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 p-2 text-sm focus:outline-none focus:border-primary-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Keripik Pisang"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Category *</label>
            <select
              required
              className="w-full border border-gray-300 p-2 text-sm focus:outline-none focus:border-primary-500 bg-white"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Makanan">Makanan</option>
              <option value="Kerajinan">Kerajinan</option>
              <option value="Jasa">Jasa</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Price (Rp) *</label>
            <input
              type="number"
              required
              min="0"
              className="w-full border border-gray-300 p-2 text-sm focus:outline-none focus:border-primary-500"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="15000"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Seller Name *</label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 p-2 text-sm focus:outline-none focus:border-primary-500"
              value={formData.seller_name}
              onChange={(e) => setFormData({ ...formData, seller_name: e.target.value })}
              placeholder="Toko Jaya"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">WhatsApp Number *</label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 p-2 text-sm focus:outline-none focus:border-primary-500"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="6281234567890"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Description</label>
            <textarea
              className="w-full border border-gray-300 p-2 text-sm focus:outline-none focus:border-primary-500 h-24 resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the product..."
            />
          </div>

          {/* Image upload via Supabase Storage */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Foto Produk</label>
            <ImageUpload folder="products" value={formData.image_url} onChange={(url) => setFormData({ ...formData, image_url: url })} />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 border border-gray-300 text-gray-700 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

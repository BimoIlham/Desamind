'use client';

/**
 * components/ui/ImageUpload.tsx
 * Reusable image uploader backed by /api/upload (Supabase Storage).
 *
 * Usage:
 *   <ImageUpload value={form.image_url} folder="gallery"
 *     onChange={(url) => setForm({ ...form, image_url: url })} />
 *
 * - Click or drag to upload. Shows a preview with a remove button.
 * - No third-party service required (uses the project's Supabase Storage).
 */
import { useRef, useState } from 'react';
import Image from 'next/image';
import { UploadCloud, X, Loader2, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  className?: string;
  /** Called after a successful upload with the new URL (e.g. for AI auto-fill). */
  onUploaded?: (url: string) => void;
}

export function ImageUpload({
  value,
  onChange,
  folder = 'misc',
  label,
  className = '',
  onUploaded,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  async function uploadFile(file: File) {
    setError('');
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 5MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar.');
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('folder', folder);
      const res = await fetch('/api/upload', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Gagal mengunggah gambar.');
        return;
      }
      onChange(data.url);
      onUploaded?.(data.url);
    } catch {
      setError('Gagal mengunggah gambar. Periksa koneksi internet Anda.');
    } finally {
      setUploading(false);
    }
  }

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // reset so the same file can be selected again
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div className={className}>
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{label}</label>
      )}

      {value ? (
        <div className="flex items-center gap-4 p-3 border border-green-200 bg-green-50/50 rounded-lg">
          <div className="relative w-20 h-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-black/5">
            {/* next/image is configured for supabase + common hosts */}
            <Image src={value} alt="Preview" fill className="object-cover" sizes="80px" unoptimized />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-green-800 mb-1">Gambar terunggah</p>
            <p className="text-[11px] text-green-600 truncate">{value}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
            aria-label="Hapus gambar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            uploading
              ? 'border-primary-400 bg-primary-50/50'
              : dragOver
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50/50'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center text-primary-600 py-2">
              <Loader2 className="w-7 h-7 animate-spin mb-2" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary-800">Mengunggah...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-500 text-center">
              <div className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <UploadCloud className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-[13px] font-bold text-gray-700">Klik atau seret gambar ke sini</p>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mt-0.5">Maks 5MB (JPG/PNG/WEBP)</p>
            </div>
          )}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleSelect} />
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-[11px] text-red-600 mt-2 font-medium">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
    </div>
  );
}

export default ImageUpload;

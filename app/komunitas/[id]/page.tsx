'use client';

import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Calendar, User, Book } from 'lucide-react';
import { fetchJson } from '@/lib/api-client';

export default function KomunitasDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchJson(`/api/articles/${id}`, null).then((data) => {
      if (!mounted) return;
      setArticle(data);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-sm text-gray-500">Memuat artikel...</div>;
  if (!article) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/komunitas" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-900 mb-6 transition">
        <ChevronLeft className="w-4 h-4" /> Kembali ke Komunitas
      </Link>

      <div className="bg-white p-6 sm:p-10 border border-gray-200 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-950 mb-6 leading-snug">{article.title}</h1>
        
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-gray-400 mb-8 border-b border-gray-100 pb-6">
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(article.created_at).toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Warga Desa</span>
        </div>

        {article.image_url ? (
          <div className="relative w-full aspect-[16/9] mb-8 overflow-hidden bg-gray-100">
            <Image src={article.image_url} alt={article.title} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-full aspect-video bg-gray-100 flex items-center justify-center mb-8">
            <Book className="w-16 h-16 text-gray-300" />
          </div>
        )}

        <div className="prose prose-sm sm:prose-base max-w-none text-gray-600 leading-relaxed">
          <p>{article.excerpt}</p>
        </div>
      </div>
    </div>
  );
}

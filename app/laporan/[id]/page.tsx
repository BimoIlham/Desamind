'use client';
/**
 * app/laporan/[id]/page.tsx
 * Report detail with functional like, comment, and social share.
 */
import { useState, useEffect, use, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ChevronLeft, ThumbsUp, MessageCircle, MapPin, Clock, User,
  Share2, Loader2, Send, X, Copy, Check,
} from 'lucide-react';
import { DetailSkeleton } from '@/components/ui/Skeletons';
import { StatusBadge, CategoryBadge } from '@/components/ui/Badge';
import { AISolutionCard } from '@/components/ui/AISolutionCard';
import { ReportTimeline } from '@/components/ui/ReportTimeline';
import { formatRelativeTime } from '@/lib/utils';
import { fetchJson } from '@/lib/api-client';

type Comment = {
  id: string;
  report_id: string;
  user_id: string;
  author_name: string;
  content: string;
  created_at: string;
};

export default function LaporanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Like state
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);

  // Comment state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // Share state
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  // Load report
  useEffect(() => {
    async function load() {
      const data = await fetchJson(`/api/reports/${id}`, null);
      if (data) setReport(data);
      setLoading(false);
    }
    load();
  }, [id]);

  // Load likes
  useEffect(() => {
    let mounted = true;
    fetchJson(`/api/reports/${id}/likes`, { count: 0, liked: false }).then((data) => {
      if (!mounted) return;
      setLikeCount(data.count);
      setLiked(data.liked);
    });
    return () => { mounted = false; };
  }, [id]);

  // Load comments
  useEffect(() => {
    let mounted = true;
    fetchJson<Comment[]>(`/api/reports/${id}/comments`, []).then((data) => {
      if (mounted) setComments(data);
    });
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    let mounted = true;
    fetchJson<any[]>(`/api/reports/${id}/history`, []).then((data) => {
      if (mounted) setHistory(data);
    });
    return () => { mounted = false; };
  }, [id]);

  // Close share dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle like
  async function handleLike() {
    setLiking(true);
    try {
      const res = await fetch(`/api/reports/${id}/likes`, {
        method: liked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'anonymous' }),
      });
      const data = await res.json();
      setLiked(data.liked ?? !liked);
      setLikeCount(data.count ?? (liked ? likeCount - 1 : likeCount + 1));
    } catch {
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
    } finally {
      setLiking(false);
    }
  }

  // Post comment
  async function handlePostComment() {
    if (!commentText.trim()) return;
    setSendingComment(true);
    try {
      const payload = { user_id: 'me', author_name: 'Warga', content: commentText };
      const res = await fetch(`/api/reports/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return;
      const saved = await res.json();
      setComments((prev) => [...prev, saved]);
      setCommentText('');
    } finally {
      setSendingComment(false);
    }
  }

  // Share helpers
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = report?.title || 'Laporan DesaMind';
  const shareText = `${shareTitle} — Lihat laporan warga ini di DesaMind`;

  function copyLink() {
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      color: 'bg-green-500 hover:bg-green-600',
      href: `https://wa.me/?text=${encodeURIComponent(shareText + '\n' + pageUrl)}`,
    },
    {
      name: 'Facebook',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: 'bg-blue-600 hover:bg-blue-700',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
    },
    {
      name: 'Twitter / X',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      color: 'bg-black hover:bg-gray-800',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`,
    },
    {
      name: 'Telegram',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      ),
      color: 'bg-sky-500 hover:bg-sky-600',
      href: `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`,
    },
  ];

  if (loading) return <DetailSkeleton />;

  if (!report) return notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back */}
      <Link href="/laporan" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-900 mb-6 transition">
        <ChevronLeft className="w-4 h-4" /> Kembali ke Daftar Laporan
      </Link>

      {/* Header image */}
      {report.image_url ? (
        <div className="relative h-64 overflow-hidden mb-6 shadow-md">
          <Image src={report.image_url} alt={report.title} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-4 left-4 flex gap-2">
            <StatusBadge status={report.status} />
            <CategoryBadge category={report.category} />
          </div>
        </div>
      ) : (
        <div className="flex gap-2 mb-6">
          <StatusBadge status={report.status} />
          <CategoryBadge category={report.category} />
        </div>
      )}

      {/* Title & metadata */}
      <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-snug">{report.title}</h1>

      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-5">
        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{report.author_name || 'Warga Anonim'}</span>
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatRelativeTime(report.created_at)}</span>
        {report.lat != null && report.lng != null && (
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{Number(report.lat).toFixed(4)}, {Number(report.lng).toFixed(4)}</span>
        )}
      </div>

      {/* Description */}
      <div className="bg-white p-6 border border-gray-200 shadow-sm mb-5">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Deskripsi Masalah</h2>
        <p className="text-sm text-gray-600 leading-relaxed">{report.description}</p>
      </div>

      {/* AI Solution Card */}
      <div className="mb-5">
        <AISolutionCard
          reportTitle={report.title}
          reportDescription={report.description}
          category={report.category}
        />
      </div>

      {/* Report Timeline */}
      <div className="mb-5">
        <ReportTimeline history={history} currentStatus={report.status} />
      </div>

      {/* ========== ACTION BAR: Like, Comment Count, Share ========== */}
      <div className="flex items-center gap-3 mb-6">
        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex items-center gap-2 px-6 py-3 border text-[10px] font-bold uppercase tracking-widest transition-all duration-200 ${
            liked
              ? 'bg-primary-900 text-white border-primary-900 shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:border-primary-900 hover:text-primary-900'
          } ${liking ? 'opacity-60' : ''}`}
        >
          <ThumbsUp className={`w-4 h-4 transition-transform ${liked ? 'fill-white scale-110' : ''}`} />
          {likeCount} Dukung
        </button>

        {/* Comment Count */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <MessageCircle className="w-4 h-4" />
          {comments.length} Komentar
        </div>

        {/* Share Button */}
        <div className="ml-auto relative" ref={shareRef}>
          <button
            onClick={() => setShareOpen(!shareOpen)}
            className={`p-3 border transition-colors ${
              shareOpen ? 'bg-primary-900 text-white border-primary-900' : 'border-gray-200 hover:bg-gray-50 text-gray-500'
            }`}
          >
            {shareOpen ? <X className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* Share Dropdown */}
          {shareOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Bagikan Laporan</p>
              </div>

              <div className="p-3 space-y-2">
                {shareLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShareOpen(false)}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 text-white text-xs font-bold transition-colors ${link.color}`}
                  >
                    {link.icon}
                    {link.name}
                  </a>
                ))}
              </div>

              {/* Copy Link */}
              <div className="px-3 pb-3">
                <button
                  onClick={copyLink}
                  className="flex items-center gap-2 w-full px-3 py-2.5 border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Link Tersalin!' : 'Salin Link'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========== COMMENTS SECTION ========== */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Komentar Warga ({comments.length})</h3>
        </div>

        {comments.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Belum ada komentar. Jadilah yang pertama!</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {comments.map((c) => (
              <li key={c.id} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-primary-900 flex items-center justify-center text-white text-xs font-bold">
                    {(c.author_name || 'W').charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-sm text-gray-800">{c.author_name}</span>
                  <span className="text-xs text-gray-400">{formatRelativeTime(c.created_at)}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed pl-9">{c.content}</p>
              </li>
            ))}
          </ul>
        )}

        {/* Comment input */}
        <div className="px-6 py-5 bg-gray-50 border-t border-gray-100">
          <div className="flex gap-3">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !sendingComment && handlePostComment()}
              placeholder="Tulis komentar Anda..."
              className="flex-1 px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-primary-900 bg-white transition-colors"
            />
            <button
              onClick={handlePostComment}
              disabled={sendingComment || !commentText.trim()}
              className="px-6 py-3 bg-primary-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950 transition-colors flex shrink-0 items-center justify-center gap-2 border border-primary-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Kirim
            </button>
          </div>
        </div>
      </div>

      {/* Location */}
      {report.lat != null && report.lng != null && (
        <div className="bg-white p-6 border border-gray-200 shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-primary-900" /> Lokasi Laporan
          </h3>
          <p className="text-sm text-gray-500">Koordinat: {Number(report.lat).toFixed(5)}, {Number(report.lng).toFixed(5)}</p>
          <Link href="/peta" className="inline-block mt-2 text-sm text-primary-900 hover:underline font-medium">
            Lihat di Peta →
          </Link>
        </div>
      )}
    </div>
  );
}

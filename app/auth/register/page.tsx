'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Loader2, CheckCircle, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }
    setLoading(true);
    const result = await register(name, email, password);
    if (!result.ok) {
      setError(result.error ?? 'Gagal mendaftar.');
      setLoading(false);
      return;
    }
    if (result.pending) {
      // Account created but needs admin approval before login.
      setPending(true);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push('/'), 1200);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row-reverse bg-white">
      {/* ── Left Side (visually right): Brand Panel ── */}
      <div className="hidden md:flex flex-col justify-between w-1/2 bg-primary-950 p-12 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-32 -right-32 w-96 h-96 bg-primary-800 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-primary-700 rounded-full opacity-10 blur-3xl"></div>

        <div className="relative z-10 flex justify-end">
          <Link href="/">
            <Image src="/logo-putih.webp" alt="DesaMind" width={160} height={44} className="h-10 w-auto object-contain" />
          </Link>
        </div>

        <div className="relative z-10 mb-12 text-right flex flex-col items-end">
          <h1 className="text-4xl text-white font-semibold leading-tight mb-6">
            Mulai Perjalanan <br />
            <span className="text-primary-300">Desa Digital Anda</span> <br />
            Hari Ini.
          </h1>
          <p className="text-primary-200/80 text-sm max-w-sm leading-relaxed">
            Jadilah bagian dari revolusi pelayanan masyarakat yang serba cepat, transparan, dan mudah dijangkau dari mana pun.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-end gap-4 text-primary-400 text-xs font-medium tracking-widest uppercase">
          <span>Mode Simulasi</span>
          <div className="w-4 h-px bg-primary-800"></div>
          <span>© 2026 DesaMind</span>
        </div>
      </div>

      {/* ── Right Side (visually left): Form Panel ── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-24 py-12 bg-white relative">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="md:hidden flex flex-col mb-8 lg:mb-10">
          <Link href="/">
            <Image src="/logo.png" alt="DesaMind" width={140} height={40} className="h-9 w-auto object-contain mb-6" />
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Bergabung Bersama Kami</h2>
          <p className="text-sm text-gray-500 mt-1">Buat akun untuk melapor, belanja, dan memantau desa.</p>
        </div>

        <div className="w-full max-w-sm mx-auto">
          <div className="hidden md:block mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Daftar Akun Baru</h2>
            <p className="text-sm text-gray-500 tracking-wide">Lengkapi data di bawah untuk bergabung.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {success && (
              <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 text-sm font-medium rounded-xl border border-green-100 mb-4">
                <CheckCircle className="w-5 h-5 shrink-0" />
                Daftar berhasil! Mengalihkan...
              </div>
            )}
            {pending && (
              <div className="flex items-start gap-2 p-4 bg-amber-50 text-amber-700 text-sm font-medium rounded-xl border border-amber-200 mb-4">
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>Pendaftaran berhasil! Akun Anda menunggu persetujuan admin desa sebelum dapat masuk.</span>
              </div>
            )}
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 mb-4">{error}</div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Misal: Budi Santoso"
                required
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Alamat Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@desamind.id"
                required
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Buat Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password minimal 8 karakter"
                  required
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-gray-400 pr-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || success || !name || !email || !password}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-900 text-white rounded-xl text-sm font-semibold hover:bg-primary-950 disabled:opacity-70 transition-colors shadow-lg shadow-primary-900/20 border border-primary-900"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Selesaikan Pendaftaran'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500">
              Sudah punya akun?{' '}
              <Link href="/auth/login" className="font-semibold text-primary-700 hover:text-primary-900 transition-colors">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

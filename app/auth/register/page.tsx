'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Handshake,
  LockKeyhole,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';

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

  const passwordScore = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score += 40;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[0-9]/.test(password)) score += 20;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;
    return Math.min(score, 100);
  }, [password]);

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
      setPending(true);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/'), 1200);
  };

  return (
    <main className="min-h-screen bg-[#f5f7f2] text-gray-950">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex min-h-screen w-full items-center justify-center overflow-x-hidden px-4 py-8 sm:px-6 lg:px-12">
          <div className="min-w-0" style={{ width: 'min(calc(100vw - 2rem), 500px)' }}>
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link href="/">
                <Image src="/logo.png" alt="DesaMind" width={148} height={44} className="h-9 w-auto object-contain" />
              </Link>
              <span className="border border-primary-100 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-primary-800">
                Daftar
              </span>
            </div>

            <div className="mb-7">
              <div className="mb-4 inline-flex items-center gap-2 border border-primary-100 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-primary-700">
                <Handshake className="h-3.5 w-3.5" />
                Akun Warga
              </div>
              <h1 className="break-words text-3xl font-semibold leading-tight text-primary-950 sm:text-4xl">
                Buat akses baru untuk layanan desa yang lebih dekat.
              </h1>
              <p className="mt-3 break-words text-sm leading-6 text-gray-500 sm:hidden">
                Satu akun untuk layanan warga dan informasi desa.
              </p>
              <p className="mt-3 hidden break-words text-sm leading-6 text-gray-500 sm:block">
                Gunakan satu akun untuk laporan, UMKM, kegiatan warga, dan informasi desa.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full border border-gray-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:p-7">
              {(success || pending || error) && (
                <div
                  className={`mb-5 flex items-start gap-3 border px-4 py-3 text-sm font-medium ${
                    success
                      ? 'border-green-100 bg-green-50 text-green-700'
                      : pending
                        ? 'border-amber-100 bg-amber-50 text-amber-700'
                        : 'border-red-100 bg-red-50 text-red-700'
                  }`}
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {success && 'Daftar berhasil. Mengalihkan...'}
                    {pending && 'Pendaftaran berhasil. Akun menunggu persetujuan admin desa.'}
                    {error && error}
                  </span>
                </div>
              )}

              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Nama Lengkap
                  </span>
                  <span className="relative block">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Misal: Budi Santoso"
                      required
                      className="h-12 w-full border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-primary-500 focus:bg-white"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Alamat Email
                  </span>
                  <span className="relative block">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@desamind.id"
                      required
                      className="h-12 w-full border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-primary-500 focus:bg-white"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Password
                  </span>
                  <span className="relative block">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      required
                      className="h-12 w-full border border-gray-200 bg-gray-50 pl-10 pr-12 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-primary-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((current) => !current)}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-gray-400 transition-colors hover:bg-white hover:text-primary-700"
                      aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </label>

                <div className="space-y-2">
                  <div className="h-1.5 overflow-hidden bg-gray-100">
                    <div
                      className="h-full bg-primary-600 transition-all duration-300"
                      style={{ width: `${passwordScore}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-medium text-gray-500">
                    {passwordScore >= 80
                      ? 'Password terlihat kuat.'
                      : password.length
                        ? 'Tambahkan angka, huruf besar, atau simbol agar lebih kuat.'
                        : 'Minimal 8 karakter untuk membuat akun.'}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || success || !name || !email || !password}
                  className="flex h-12 w-full items-center justify-center gap-2 bg-primary-900 px-5 text-sm font-bold text-white transition-colors hover:bg-primary-950 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Selesaikan Pendaftaran'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </form>

            <p className="mt-7 text-center text-sm text-gray-500">
              Sudah punya akun?{' '}
              <Link href="/auth/login" className="font-bold text-primary-800 transition-colors hover:text-primary-950">
                Masuk di sini
              </Link>
            </p>
          </div>
        </section>

        <section className="relative hidden overflow-hidden bg-primary-950 lg:flex">
          <Image
            src="/gotong-royong-banner.jpg"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="55vw"
          />
          <div className="absolute inset-0 bg-primary-950/70" />
          <div className="absolute inset-0 bg-[linear-gradient(245deg,rgba(13,28,27,0.95)_0%,rgba(19,61,58,0.78)_50%,rgba(13,28,27,0.52)_100%)]" />

          <div className="relative z-10 flex min-h-screen w-full flex-col justify-between px-12 py-10 xl:px-16">
            <div className="flex justify-end">
              <Link href="/" className="inline-flex">
                <Image
                  src="/Logo-putih.webp"
                  alt="DesaMind"
                  width={168}
                  height={48}
                  className="h-10 w-auto object-contain"
                />
              </Link>
            </div>

            <div className="ml-auto max-w-xl pb-8 text-right">
              <div className="mb-6 inline-flex items-center gap-2 border border-white/15 bg-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-primary-100">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Kolaborasi Warga
              </div>
              <h2 className="text-4xl font-semibold leading-tight text-white xl:text-5xl">
                Mulai dari laporan kecil, tumbuh jadi gerakan desa yang nyata.
              </h2>
              <p className="ml-auto mt-5 max-w-lg text-sm leading-7 text-primary-100/85">
                Akun warga menyatukan partisipasi, informasi, dan layanan desa dalam tampilan yang mudah dipakai setiap hari.
              </p>

              <div className="mt-9 ml-auto grid max-w-lg grid-cols-3 border border-white/15 bg-white/[0.07]">
                {[
                  ['Lapor', 'Masalah desa'],
                  ['UMKM', 'Belanja lokal'],
                  ['Aksi', 'Gotong royong'],
                ].map(([value, label]) => (
                  <div key={label} className="border-r border-white/10 px-5 py-4 last:border-r-0">
                    <p className="text-lg font-semibold text-white">{value}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-primary-100/65">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-6 text-[10px] font-bold uppercase tracking-widest text-primary-100/60">
              <span>Mode Demo Lokal</span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5" />
                Semi-Statis
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const demoAccounts = [
  {
    role: 'Admin',
    email: 'admin@desamind.id',
    password: 'demo12345',
    helper: 'Dashboard desa',
  },
  {
    role: 'Warga',
    email: 'warga@desamind.id',
    password: 'demo12345',
    helper: 'Layanan warga',
  },
];

export default function LoginPage() {
  const t = useTranslations('auth');
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (!result.ok) {
      setError(result.error ?? t('error'));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push(result.user?.role === 'admin' ? '/admin' : '/'), 900);
  };

  function handleDemoAccount(account: (typeof demoAccounts)[number]) {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  }

  return (
    <main className="min-h-screen bg-[#f5f7f2] text-gray-950">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-primary-950 lg:flex">
          <Image
            src="/hero-banner.jpg"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="55vw"
          />
          <div className="absolute inset-0 bg-primary-950/76" />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(13,28,27,0.98)_0%,rgba(13,28,27,0.82)_48%,rgba(19,61,58,0.48)_100%)]" />

          <div className="relative z-10 flex min-h-screen w-full flex-col justify-between px-12 py-10 xl:px-16">
            <Link href="/" className="inline-flex w-fit">
              <Image
                src="/Logo-putih.webp"
                alt="DesaMind"
                width={168}
                height={48}
                className="h-10 w-auto object-contain"
              />
            </Link>

            <div className="max-w-xl pb-8">
              <div className="mb-6 inline-flex items-center gap-2 border border-white/15 bg-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-primary-100">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Mode Semi-Statis
              </div>

              <h1 className="text-4xl font-semibold leading-tight text-white xl:text-5xl">
                Masuk ke ruang kendali desa yang lebih tenang, cepat, dan terpadu.
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-7 text-primary-100/85">
                Pantau laporan, layanan warga, UMKM, transparansi, dan aktivitas desa dari satu pengalaman yang rapi.
              </p>

              <div className="mt-9 grid max-w-lg grid-cols-3 border border-white/15 bg-white/[0.07]">
                {[
                  ['24/7', 'Akses layanan'],
                  ['74', 'Halaman siap'],
                  ['API', 'Demo lokal'],
                ].map(([value, label]) => (
                  <div key={label} className="border-r border-white/10 px-5 py-4 last:border-r-0">
                    <p className="text-lg font-semibold text-white">{value}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-primary-100/65">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-6 text-[10px] font-bold uppercase tracking-widest text-primary-100/60">
              <span>DesaMind 2026</span>
              <span>Labuhan Maringgai</span>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen w-full items-center justify-center overflow-x-hidden px-4 py-8 sm:px-6 lg:px-12">
          <div className="min-w-0" style={{ width: 'min(calc(100vw - 2rem), 480px)' }}>
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link href="/">
                <Image src="/logo.png" alt="DesaMind" width={148} height={44} className="h-9 w-auto object-contain" />
              </Link>
              <span className="border border-primary-100 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-primary-800">
                Demo
              </span>
            </div>

            <div className="mb-7">
              <div className="mb-4 inline-flex items-center gap-2 border border-primary-100 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-primary-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Akses Akun
              </div>
              <h2 className="break-words text-3xl font-semibold leading-tight text-primary-950 sm:text-4xl">
                {t('login_acc_title')}
              </h2>
              <p className="mt-3 break-words text-sm leading-6 text-gray-500 sm:hidden">
                Pilih akun demo atau masuk dengan email Anda.
              </p>
              <p className="mt-3 hidden break-words text-sm leading-6 text-gray-500 sm:block">
                {t('login_acc_desc')} Pilih akun demo atau masuk dengan email Anda.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full border border-gray-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:p-7">
              {(success || error) && (
                <div
                  className={`mb-5 flex items-start gap-3 border px-4 py-3 text-sm font-medium ${
                    success
                      ? 'border-green-100 bg-green-50 text-green-700'
                      : 'border-red-100 bg-red-50 text-red-700'
                  }`}
                >
                  {success ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />}
                  <span>{success ? t('success') : error}</span>
                </div>
              )}

              <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => handleDemoAccount(account)}
                    className="group flex items-center gap-3 border border-gray-200 bg-gray-50 px-3 py-3 text-left transition-colors hover:border-primary-200 hover:bg-primary-50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-primary-100 bg-white text-primary-700">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-primary-950">{account.role}</span>
                      <span className="block truncate text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                        {account.helper}
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    {t('lbl_email')}
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
                    {t('lbl_pass')}
                  </span>
                  <span className="relative block">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
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

                <button
                  type="submit"
                  disabled={loading || success}
                  className="flex h-12 w-full items-center justify-center gap-2 bg-primary-900 px-5 text-sm font-bold text-white transition-colors hover:bg-primary-950 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('btn_login')}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </form>

            <p className="mt-7 text-center text-sm text-gray-500">
              {t('no_account')}{' '}
              <Link href="/auth/register" className="font-bold text-primary-800 transition-colors hover:text-primary-950">
                {t('register_here')}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

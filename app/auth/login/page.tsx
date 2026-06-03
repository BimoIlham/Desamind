'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Loader2, CheckCircle, ArrowRight } from 'lucide-react';

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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* ── Left Side: Brand Panel (Hidden on Mobile) ── */}
      <div className="hidden md:flex flex-col justify-between w-1/2 bg-primary-950 p-12 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary-800 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-20 -left-20 w-72 h-72 bg-primary-700 rounded-full opacity-10 blur-3xl"></div>

        <div className="relative z-10">
          <Link href="/">
            <Image src="/logo-putih.webp" alt="DesaMind" width={160} height={44} className="h-10 w-auto object-contain" />
          </Link>
        </div>

        <div className="relative z-10 mb-12">
          <h1 className="text-4xl text-white font-semibold leading-tight mb-6">
            {t('login_title_1')} <br />
            <span className="text-primary-300">{t('login_title_2')}</span> <br />
            {t('login_title_3')}
          </h1>
          <p className="text-primary-200/80 text-sm max-w-sm leading-relaxed">
            {t('login_desc')}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-primary-400 text-xs font-medium tracking-widest uppercase">
          <span>© 2026 DesaMind</span>
          <div className="w-4 h-px bg-primary-800"></div>
          <span>{t('login_mode')}</span>
        </div>
      </div>

      {/* ── Right Side: Form Panel ── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-24 py-12 bg-white relative">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="md:hidden flex flex-col mb-8 lg:mb-10">
          <Link href="/">
            <Image src="/logo.png" alt="DesaMind" width={140} height={40} className="h-9 w-auto object-contain mb-6" />
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">{t('welcome')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('welcome_desc')}</p>
        </div>

        <div className="w-full max-w-sm mx-auto">
          <div className="hidden md:block mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('login_acc_title')}</h2>
            <p className="text-sm text-gray-500 tracking-wide">{t('login_acc_desc')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {success && (
              <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 text-sm font-medium rounded-xl border border-green-100">
                <CheckCircle className="w-5 h-5 shrink-0" />
                {t('success')}
              </div>
            )}
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">{error}</div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{t('lbl_email')}</label>
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{t('lbl_pass')}</label>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-gray-400 pr-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-900 text-white rounded-xl text-sm font-semibold hover:bg-primary-950 disabled:opacity-70 transition-colors shadow-lg shadow-primary-900/20 border border-primary-900"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('btn_login')}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Info note */}
          <div className="mt-10 pt-8 border-t border-gray-100">
            <div className="flex items-start gap-3 p-4 bg-primary-50/60 border border-primary-100 rounded-xl">
              <CheckCircle className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-primary-800 leading-relaxed">
                Masuk dengan email dan password yang Anda buat saat mendaftar.
                Pendaftaran warga gratis dan akun langsung aktif.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500">
              {t('no_account')}{' '}
              <Link href="/auth/register" className="font-semibold text-primary-700 hover:text-primary-900 transition-colors">
                {t('register_here')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

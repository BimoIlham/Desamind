'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword.length < 8) {
      setError('Password baru minimal 8 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password baru belum sama.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || 'Gagal mengganti password.');
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password akun berhasil diperbarui.');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-bg pt-28 px-4 flex items-start justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-primary-700" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-bg pt-28 px-4">
        <section className="max-w-md mx-auto bg-white border border-gray-200 p-10 text-center shadow-sm">
          <Lock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h1 className="text-xl font-bold text-primary-950 mb-2">Login Diperlukan</h1>
          <p className="text-sm text-gray-500 mb-6">Silakan login untuk membuka pengaturan akun.</p>
          <Link href="/auth/login" className="inline-flex px-6 py-3 bg-primary-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950 transition-colors">
            Login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg pt-28 pb-16 px-4">
      <section className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary-700 mb-2">Pengaturan Akun</p>
          <h1 className="text-3xl font-semibold text-primary-950 border-l-4 border-primary-600 pl-4">Keamanan Akun</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="bg-white border border-gray-200 p-6 shadow-sm h-fit">
            <div className="w-12 h-12 rounded-full bg-primary-800 text-white flex items-center justify-center text-sm font-bold mb-4">
              {user.avatar}
            </div>
            <h2 className="font-bold text-gray-900">{user.name}</h2>
            <p className="text-xs text-gray-500 mt-1 break-all">{user.email}</p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-100 text-primary-800 text-[10px] font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              {user.role}
            </div>
          </aside>

          <form onSubmit={submitPassword} className="bg-white border border-gray-200 p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4 pb-5 border-b border-gray-100 mb-6">
              <div>
                <h2 className="font-bold text-gray-900">Ganti Password</h2>
                <p className="text-xs text-gray-500 mt-1">Gunakan password baru minimal 8 karakter.</p>
              </div>
              <KeyRound className="w-5 h-5 text-primary-700" />
            </div>

            <div className="space-y-5">
              {[
                { label: 'Password Lama', value: currentPassword, setValue: setCurrentPassword },
                { label: 'Password Baru', value: newPassword, setValue: setNewPassword },
                { label: 'Konfirmasi Password Baru', value: confirmPassword, setValue: setConfirmPassword },
              ].map((field) => (
                <label key={field.label} className="block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">{field.label}</span>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={field.value}
                    onChange={(e) => field.setValue(e.target.value)}
                    className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-primary-700 bg-white"
                    required
                  />
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowPasswords((value) => !value)}
              className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-primary-800 transition-colors"
            >
              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPasswords ? 'Sembunyikan password' : 'Tampilkan password'}
            </button>

            {error && <p className="mt-5 text-sm text-red-700 bg-red-50 border border-red-100 px-4 py-3">{error}</p>}
            {message && <p className="mt-5 text-sm text-green-700 bg-green-50 border border-green-100 px-4 py-3">{message}</p>}

            <div className="mt-7 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-950 disabled:opacity-60 transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Menyimpan...' : 'Simpan Password'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

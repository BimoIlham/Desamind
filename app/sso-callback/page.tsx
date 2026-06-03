'use client';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SSOCallback() {
  const router = useRouter();

  useEffect(() => {
    // This page is legacy from Clerk SSO, we just redirect home
    const t = setTimeout(() => {
      router.push('/');
    }, 1000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <div className="w-16 h-16 bg-white shadow-lg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
      </div>
      <p className="text-sm font-semibold text-gray-600">Menyelesaikan proses masuk...</p>
    </div>
  );
}

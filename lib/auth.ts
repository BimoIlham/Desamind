/**
 * lib/auth.ts
 * Client-side auth helpers that talk to the real /api/auth endpoints
 * (backed by Supabase Auth + httpOnly session cookies).
 *
 * No passwords or tokens are stored in the browser/localStorage — the
 * session lives in secure httpOnly cookies managed by the server.
 */

export type AppRole = 'warga' | 'admin';
export type AppStatus = 'active' | 'pending' | 'suspended';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  status: AppStatus;
  avatar: string;
  created_at: string;
};

// Backwards-compatible alias (old code referenced DemoUser).
export type DemoUser = AuthUser;

export type AuthResult = {
  ok: boolean;
  user?: AuthUser;
  error?: string;
  pending?: boolean;
};

/** Resolve the current logged-in user from the session cookie. */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch('/api/auth/me', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? 'Gagal masuk.' };
    return { ok: true, user: data.user };
  } catch {
    return { ok: false, error: 'Tidak dapat terhubung ke server.' };
  }
}

export async function register(name: string, email: string, password: string): Promise<AuthResult> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? 'Gagal mendaftar.' };
    return { ok: true, user: data.user, pending: Boolean(data.pending) };
  } catch {
    return { ok: false, error: 'Tidak dapat terhubung ke server.' };
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-change'));
  }
}

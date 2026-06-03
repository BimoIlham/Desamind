import { STATIC_USERS } from '@/lib/static-data';

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

export type DemoUser = AuthUser;

export type AuthResult = {
  ok: boolean;
  user?: AuthUser;
  error?: string;
  pending?: boolean;
};

const AUTH_KEY = 'desamind_static_user';

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'DU';
}

function storedUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) as AuthUser : null;
  } catch {
    return null;
  }
}

function saveUser(user: AuthUser | null) {
  if (typeof window === 'undefined') return;
  if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  else localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new Event('auth-change'));
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  return storedUser();
}

export async function login(email: string, password: string): Promise<AuthResult> {
  void password;
  const normalized = email.trim().toLowerCase();
  const user =
    STATIC_USERS.find((item) => item.email.toLowerCase() === normalized) ??
    (normalized.includes('admin') ? STATIC_USERS[0] : STATIC_USERS[1]);

  saveUser(user);
  return { ok: true, user };
}

export async function register(name: string, email: string, password: string): Promise<AuthResult> {
  void password;
  const user: AuthUser = {
    id: `static-user-${Date.now()}`,
    email: email.trim(),
    name: name.trim() || 'Warga Demo',
    role: 'warga',
    status: 'active',
    avatar: initials(name),
    created_at: new Date().toISOString(),
  };

  saveUser(user);
  return { ok: true, user, pending: false };
}

export async function logout(): Promise<void> {
  saveUser(null);
}

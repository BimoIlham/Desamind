'use client';
/**
 * hooks/useAuth.ts
 * React hook that tracks auth state from the server session (/api/auth/me).
 */
import { useState, useEffect, useCallback } from 'react';
import {
  fetchCurrentUser,
  login as authLogin,
  logout as authLogout,
  register as authRegister,
  type AuthUser,
  type AuthResult,
} from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const u = await fetchCurrentUser();
    setUser(u);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('auth-change', handler);
    return () => window.removeEventListener('auth-change', handler);
  }, [refresh]);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const result = await authLogin(email, password);
    if (result.ok && result.user) {
      setUser(result.user);
      window.dispatchEvent(new Event('auth-change'));
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<AuthResult> => {
      const result = await authRegister(name, email, password);
      // Only set the user when the account is active (not pending approval).
      if (result.ok && result.user && !result.pending) {
        // re-resolve from cookie to confirm session was set
        const u = await fetchCurrentUser();
        if (u) {
          setUser(u);
          window.dispatchEvent(new Event('auth-change'));
        }
      }
      return result;
    },
    []
  );

  return {
    user,
    loading,
    isSignedIn: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    register,
    refresh,
  };
}

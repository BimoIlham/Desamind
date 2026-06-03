import { isStaticApiUrl, resolveStaticApi } from '@/lib/static-api';

export async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    if (typeof window === 'undefined' && isStaticApiUrl(url)) {
      const result = await resolveStaticApi(url);
      return result.ok ? result.data as T : fallback;
    }

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export async function fetchJsonArray<T>(url: string): Promise<T[]> {
  return fetchJson<T[]>(url, []);
}

export async function sendJson<T>(
  url: string,
  init: RequestInit,
  fallback: T
): Promise<T> {
  try {
    if (typeof window === 'undefined' && isStaticApiUrl(url)) {
      const result = await resolveStaticApi(url, init);
      return result.ok ? result.data as T : fallback;
    }

    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

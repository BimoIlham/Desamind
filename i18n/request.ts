import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

const SUPPORTED = ['id', 'en'];

export default getRequestConfig(async () => {
  // Read locale from cookie, fallback to 'id'
  const cookieStore = await cookies();
  const requested = cookieStore.get('NEXT_LOCALE')?.value;
  const locale = requested && SUPPORTED.includes(requested) ? requested : 'id';

  // Load messages; fall back to Indonesian if the file can't be loaded.
  let messages: Record<string, unknown>;
  try {
    messages = (await import(`../locales/${locale}/common.json`)).default;
  } catch {
    messages = (await import(`../locales/id/common.json`)).default;
  }

  return { locale, messages };
});

import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;
  const locale = ['en', 'id'].includes(localeCookie || '') ? localeCookie : 'id';
  
  const messages = (await import(`../locales/${locale}/common.json`)).default;
  return { locale: locale as string, messages };
});

import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  const locale = 'id';
  const messages = (await import('../locales/id/common.json')).default;
  return { locale, messages };
});

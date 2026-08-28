import { isLocale, setLocale } from 'yapyak';

export default defineEventHandler(async (event) => {
  const { locale } = await readBody<{
    locale?: string;
  }>(event);

  if (typeof locale === 'string' && isLocale(locale)) {
    setLocale(locale);
  }

  return null;
});

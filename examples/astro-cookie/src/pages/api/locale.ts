import type { APIRoute } from 'astro';

import { isLocale, setLocale } from 'yapyak';

export const POST: APIRoute = async ({ redirect, request }) => {
  const formData = await request.formData();
  const locale = String(formData.get('locale'));
  if (isLocale(locale)) {
    setLocale(locale);
  }

  return redirect('/', 303);
};

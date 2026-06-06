import type { APIRoute } from 'astro';

import { isLocale, setLocale } from 'yapyak';

export const POST: APIRoute = async ({ redirect, request }) => {
  const formData = await request.formData();
  const value = String(formData.get('locale'));
  if (isLocale(value)) {
    setLocale(value);
  }

  return redirect('/', 303);
};

import type { APIRoute } from 'astro';

import { setLocale } from 'yapyak';

export const POST: APIRoute = async ({ redirect, request }) => {
  const data = await request.formData();
  const submitted = data.get('locale');
  if (typeof submitted === 'string') {
    setLocale(submitted);
  }
  return redirect(request.headers.get('referer') ?? '/', 303);
};

import type { APIRoute } from 'astro';

import { setLocale } from 'yapyak';

export const POST: APIRoute = async ({ redirect, request }) => {
  const formData = await request.formData();
  setLocale(String(formData.get('locale')));

  return redirect('/', 303);
};

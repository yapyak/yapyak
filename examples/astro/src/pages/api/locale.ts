import type { APIRoute } from 'astro';

import { setLocale } from 'yapyak';

export const POST: APIRoute = async ({ redirect, request }) => {
  const formData = await request.formData();
  const locale = formData.get('locale') as string | null;

  if (locale) {
    setLocale(locale);
  }

  return redirect('/', 303);
};

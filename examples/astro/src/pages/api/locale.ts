import type { APIRoute } from 'astro';

import { locales } from 'yapyak';

export const POST: APIRoute = async ({ redirect, request }) => {
  const data = await request.formData();
  const submitted = data.get('locale');
  const target =
    typeof submitted === 'string' && (locales as readonly string[]).includes(submitted)
      ? submitted
      : null;
  const referer = request.headers.get('referer') ?? '/';
  const headers = new Headers();
  if (target !== null) {
    headers.append(
      'Set-Cookie',
      `locale=${encodeURIComponent(target)}; Path=/; Max-Age=31536000; SameSite=Lax`,
    );
  }
  headers.set('Location', referer);
  return new Response(null, { headers, status: 303 });
};

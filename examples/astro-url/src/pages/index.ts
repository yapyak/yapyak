import type { APIRoute } from 'astro';

import { defaultLocale } from 'yapyak';

export const GET: APIRoute = ({ redirect }) => redirect(`/${defaultLocale}`);

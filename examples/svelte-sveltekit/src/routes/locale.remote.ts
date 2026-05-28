import { redirect } from '@sveltejs/kit';
import { setLocale } from 'yapyak';

import { form } from '$app/server';

export const switchLocale = form('unchecked', async (data) => {
  setLocale(String(data.locale));
  redirect(303, '/');
});

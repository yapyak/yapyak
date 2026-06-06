import { redirect } from '@sveltejs/kit';
import { isLocale, setLocale } from 'yapyak';

import { form } from '$app/server';

export const localeForm = form('unchecked', async (data) => {
  const value = String(data.locale);
  if (isLocale(value)) {
    setLocale(value);
  }
  redirect(303, '/');
});

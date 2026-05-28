import { error } from '@sveltejs/kit';
import { locales } from 'yapyak';

export const load = ({ params }) => {
  if (!locales.includes(params.locale)) {
    error(404, 'Unknown locale');
  }
};

import { error } from '@sveltejs/kit';
import { isLocale } from 'yapyak';

export const load = ({ params }) => {
  if (!isLocale(params.locale)) {
    error(404, 'Unknown locale');
  }
};

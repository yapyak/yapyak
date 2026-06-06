import { replace } from 'react-router';
import { defaultLocale } from 'yapyak';

export async function loader() {
  throw replace(`/${defaultLocale}`);
}

export default function Index() {
  return null;
}

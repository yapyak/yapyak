import { redirect } from 'react-router';
import { defaultLocale } from 'yapyak';

export async function loader() {
  throw redirect(`/${defaultLocale}`);
}

export default function Index() {
  return null;
}

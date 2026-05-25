import { $t } from 'yapyak';

export function bad(name: string): string {
  return $t(`Hi ${name}`);
}

import { $createT } from '@yapyak/core';

const $tSv = $createT({ locale: 'sv' });

export function greeting(): string {
  return $tSv('Hello');
}

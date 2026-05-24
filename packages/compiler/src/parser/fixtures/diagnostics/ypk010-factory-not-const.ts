import { $createT } from '@yapyak/core';

const $tSv = $createT({ locale: 'sv' });

export function bad(): string {
  return $tSv('Hello');
}

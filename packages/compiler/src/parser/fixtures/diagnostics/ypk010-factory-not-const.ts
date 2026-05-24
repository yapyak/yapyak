import { $createT } from '@yapyak/core';

let $tSv = $createT({ locale: 'sv' });

export function bad(): string {
  return $tSv('Hello');
}

import { $createT } from '@yapyak/core';

declare const currentLocale: string;

const $tDyn = $createT({ locale: currentLocale });

export function bad(): string {
  return $tDyn('Hello');
}

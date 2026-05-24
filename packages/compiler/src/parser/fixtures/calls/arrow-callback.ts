import { $t } from '@yapyak/core';

export function listItems(items: string[]): string[] {
  return items.map((item) => $t('Item: {item}', { item }));
}

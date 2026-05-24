import { $createT } from '@yapyak/core';

const $tCtx = $createT({ context: 'admin panel' });

export function saveLabel(): string {
  return $tCtx('Save');
}

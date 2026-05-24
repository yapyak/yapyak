import { $createT } from '@yapyak/core';

const $tSvAdmin = $createT({ context: 'admin', locale: 'sv' });

export function deleteLabel(): string {
  return $tSvAdmin('Delete');
}

export function deleteOverride(): string {
  return $tSvAdmin('Delete', { context: 'destructive' });
}

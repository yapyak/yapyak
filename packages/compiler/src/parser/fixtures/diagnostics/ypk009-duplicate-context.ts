import { $t } from '@yapyak/core';

export function submit(): string {
  return $t('Save', { context: 'submit button' });
}

export function persist(): string {
  return $t('Save', { context: 'persist file' });
}

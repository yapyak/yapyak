import type { TextDirection } from 'yapyak';

import { getTextDirection } from 'yapyak';

import { locale } from './locale.svelte';

/**
 * Reactive text direction store.
 *
 * @example
 * ```svelte
 * <script>
 *   import { t } from 'yapyak';
 *   import { textDirection } from '@yapyak/svelte';
 * </script>
 *
 * <p dir={textDirection.current}>{t('Hello')}</p>
 * ```
 */
export const textDirection: {
  readonly current: TextDirection;
} = {
  get current(): TextDirection {
    return getTextDirection(locale.current);
  },
};

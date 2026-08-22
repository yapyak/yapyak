import type { Ref } from 'vue';
import type { TextDirection } from 'yapyak';

import { toRef } from 'vue';
import { getTextDirection } from 'yapyak';

import { locale } from './locale';

/**
 * Reactive text direction ref.
 *
 * @example
 * ```vue
 * <script setup>
 *   import { t } from 'yapyak';
 *   import { textDirection } from '@yapyak/vue';
 * </script>
 *
 * <template>
 *   <p :dir="textDirection">{{ t('Hello') }}</p>
 * </template>
 * ```
 */
export const textDirection: Readonly<Ref<TextDirection>> = toRef(() =>
  getTextDirection(locale.value),
);

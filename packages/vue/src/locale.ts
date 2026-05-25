import type { Ref } from 'vue';

import { customRef } from 'vue';
import { getLocale, setLocale } from 'yapyak';
import { registerTracker, subscribeLocale } from 'yapyak/internal';

/**
 * Reactive locale ref.
 *
 * @remarks
 * Auto-unwraps in templates. Reads track reactivity; writes call {@link setLocale}.
 *
 * @example Read and write the locale in a template
 * ```vue
 * <script setup>
 * import { $t } from 'yapyak';
 * import { locale } from '@yapyak/vue';
 * </script>
 *
 * <template>
 *   <p>{{ $t('Hello') }}: {{ locale }}</p>
 *   <select v-model="locale">
 *     <option value="en">English</option>
 *     <option value="sv">Svenska</option>
 *   </select>
 * </template>
 * ```
 */
export const locale: Ref<string> = customRef<string>((track, trigger) => {
  if (typeof window !== 'undefined') {
    subscribeLocale(trigger);
    registerTracker(() => {
      void locale.value;
    });
  }
  return {
    get(): string {
      track();
      return getLocale();
    },
    set(value: string): void {
      setLocale(value);
    },
  };
});

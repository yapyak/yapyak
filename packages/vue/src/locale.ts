import type { Ref } from 'vue';
import type { Locale } from 'yapyak';

import { customRef } from 'vue';
import { getLocale, setLocale } from 'yapyak';
import { autoRegisterTracker, autoSubscribeLocale } from 'yapyak/internal';

/**
 * Reactive locale ref.
 *
 * @remarks
 * Auto-unwraps in templates. Reads track reactivity; writes call {@link setLocale}.
 *
 * @example Read and write the locale in a template
 * ```vue
 * <script setup>
 * import { t } from 'yapyak';
 * import { locale } from '@yapyak/vue';
 * </script>
 *
 * <template>
 *   <p>{{ t('Hello') }}: {{ locale }}</p>
 *   <select v-model="locale">
 *     <option value="en">English</option>
 *     <option value="sv">Svenska</option>
 *   </select>
 * </template>
 * ```
 */
export const locale: Ref<Locale> = customRef<Locale>((track, trigger) => {
  if (typeof window !== 'undefined') {
    autoSubscribeLocale(import.meta, trigger);
    autoRegisterTracker(import.meta, () => {
      void locale.value;
    });
  }
  return {
    get(): Locale {
      track();
      return getLocale();
    },
    set(value: Locale): void {
      setLocale(value);
    },
  };
});

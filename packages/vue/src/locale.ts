import type { Ref } from 'vue';
import type { Locale } from 'yapyak';

import { customRef } from 'vue';
import { getLocale, setLocale } from 'yapyak';
import { registerTracker, subscribeLocale } from 'yapyak/internal';

declare global {
  interface ImportMeta {
    hot?: {
      dispose(callback: () => void): void;
    };
  }
}

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
    const unsubscribe = subscribeLocale(trigger);
    const untrack = registerTracker(() => {
      void locale.value;
    });
    if (import.meta.hot) {
      import.meta.hot.dispose(() => {
        unsubscribe();
        untrack();
      });
    }
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

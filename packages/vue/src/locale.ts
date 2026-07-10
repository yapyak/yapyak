import type { Ref } from 'vue';
import type { Locale } from 'yapyak';

import { customRef } from 'vue';
import { getLocale, setLocale } from 'yapyak';
import { autoRegisterTracker, autoSubscribeLocale } from 'yapyak/internal';

let triggerLocaleChange: (() => void) | undefined;

/**
 * Reactive locale ref.
 *
 * @example
 * ```vue
 * <script setup>
 *   import { t } from 'yapyak';
 *   import { locale } from '@yapyak/vue';
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
  triggerLocaleChange = trigger;
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

let hasRegistered = false;

export function registerLocale(): void {
  if (hasRegistered || typeof window === 'undefined') {
    return;
  }
  hasRegistered = true;
  autoSubscribeLocale(import.meta, () => triggerLocaleChange?.());
  autoRegisterTracker(import.meta, () => {
    void locale.value;
  });
}

registerLocale();

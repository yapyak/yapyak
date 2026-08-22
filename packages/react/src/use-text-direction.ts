import type { TextDirection } from 'yapyak';

import { useSyncExternalStore } from 'react';
import { getLocale, getTextDirection } from 'yapyak';
import { subscribeLocale } from 'yapyak/internal';

/**
 * Subscribes the component to text direction changes.
 *
 * @example
 * ```tsx
 * import { useLocale, useTextDirection } from '@yapyak/react';
 *
 * function Root() {
 *   const [locale] = useLocale();
 *   const textDirection = useTextDirection();
 *   return (
 *     <html lang={locale} dir={textDirection}>
 *       <body />
 *     </html>
 *   );
 * }
 * ```
 */
export function useTextDirection(): TextDirection {
  return useSyncExternalStore(
    subscribeLocale,
    getTextDirectionSnapshot,
    getTextDirectionSnapshot,
  );
}

function getTextDirectionSnapshot(): TextDirection {
  return getTextDirection(getLocale());
}

/**
 * React adapter. Provides {@link LocaleProvider} and the {@link useLocale} hook.
 *
 * ## Installation
 *
 * ```bash
 * npm install @yapyak/react
 * # or
 * pnpm add @yapyak/react
 * ```
 *
 * ## Setup
 *
 * Wrap the React tree once at the root with {@link LocaleProvider}.
 *
 * ```tsx
 * import { LocaleProvider } from '@yapyak/react';
 *
 * export function App() {
 *   return (
 *     <LocaleProvider>
 *       <Routes />
 *     </LocaleProvider>
 *   );
 * }
 * ```
 *
 * @packageDocumentation
 */

export type { LocaleProviderProps } from './locale-provider';

export { LocaleProvider } from './locale-provider';
export { useLocale } from './use-locale';

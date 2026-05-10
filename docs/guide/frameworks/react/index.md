# React

```bash
npm install yapyak
```

`yapyak/react` exports the React-specific reactive binding. The actual translation function (`t`) comes from the framework-agnostic `yapyak` package.

## Imports

```tsx
import { t, getLocale, getLocales } from 'yapyak';
import { useLocale } from 'yapyak/react';
```

- `t` — the translation function (same import in every framework)
- `useLocale` — React hook for the reactive locale binding
- `getLocale` / `getLocales` — non-reactive readers, work anywhere (server too)

## `useLocale` hook

```tsx
import { useLocale } from 'yapyak/react';

function LocaleToggle() {
  const [locale, setLocale] = useLocale();
  return <button onClick={() => setLocale('es')}>{locale}</button>;
}
```

Returns a tuple: the current locale string and a setter. Internally subscribes via `useSyncExternalStore`, so it works correctly in concurrent React, in Strict Mode, and during SSR (no flicker, no double-render mismatch).

## Locale switcher

`getLocales()` returns every configured locale, so you don't hardcode the list:

```tsx
import { getLocales } from 'yapyak';
import { useLocale } from 'yapyak/react';

export function LocaleToggle() {
  const [locale, setLocale] = useLocale();
  const locales = getLocales();

  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value)}>
      {locales.map((locale) => (
        <option key={locale} value={locale}>
          {locale.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
```

Add a locale (`npx yapyak add fr`) → `getLocales()` returns it on the next render. Nothing else to update.

## Component example

```tsx
import { t } from 'yapyak';
import { useLocale } from 'yapyak/react';

export function CartSummary({ count }: { count: number }) {
  return (
    <div>
      <h2>{t('Your cart')}</h2>
      <p>
        {t('You have {count, plural, one {# item} other {# items}}', { count })}
      </p>
      <button>{t('Checkout')}</button>
    </div>
  );
}
```

`t()` calls anywhere in the JSX work. The plugin extracts them at build time and inlines locale variants per call site.

## SSR with TanStack Start

For server-rendered React via TanStack Start, wire the adapter once in your root route:

```tsx
// src/routes/__root.tsx
import { tanstackStart } from 'yapyak/adapters/tanstack-start';
import { getLocale } from 'yapyak';

tanstackStart();

export const Route = createRootRoute({
  component: () => (
    <html lang={getLocale()}>
      {/* ... */}
    </html>
  ),
});
```

That's the entirety of the SSR setup. Locale resolves per request from cookie + `Accept-Language` header. See [Adapters / TanStack Start](/guide/adapters/tanstack-start) for the deeper details.

## SPA without SSR

If you're not using SSR, drop the adapter. `useLocale` works the same — locale resolves from `defaultLocale` on first render, then from cookie or localStorage if `persistence` is configured in `vite.config.ts`.

```tsx
// vite.config.ts
yapyak({
  persistence: 'localStorage',   // SPA-friendly, GDPR-exempt
  translator: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
}),
```

## Common patterns

### Conditional rendering on locale

```tsx
const [locale] = useLocale();
return locale === 'ja' ? <JapaneseLayout /> : <DefaultLayout />;
```

### Reading locale outside a component

```tsx
import { getLocale } from 'yapyak';

function formatPrice(amount: number): string {
  return new Intl.NumberFormat(getLocale(), { style: 'currency', currency: 'USD' })
    .format(amount);
}
```

`getLocale()` is non-reactive — it reads the current value once. Use it in event handlers, utilities, server functions. For reactive reads inside components, use `useLocale`.

### Forced-locale rendering (emails, multi-locale digests)

```tsx
import { t } from 'yapyak';

function emailSubject(userLocale: string) {
  return t.in(userLocale)('Your invoice is ready');
}
```

`t.in(locale)` returns the translation in a specific locale, regardless of the active one. Useful for sending emails to a user whose preferred locale isn't the request locale.

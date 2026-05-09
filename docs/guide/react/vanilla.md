---
order: 11
---

# React (Vanilla)

Plain React + Vite. No SSR, no router, no fuss. This is the smallest possible yapyak setup — and it's the one you'll port from when you grow up.

## vite.config.ts

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';

export default defineConfig({
  plugins: [
    yapyak({
      defaultLocale: 'en',
      framework: 'react',
      locales: ['en', 'sv'],
      persistence: 'cookie',
    }),
    react(),
  ],
});
```

## main.tsx

```tsx
import { createRoot } from 'react-dom/client';
import { IntlProvider } from 'yapyak';
import { App } from './app';

createRoot(document.getElementById('root')!).render(
  <IntlProvider>
    <App />
  </IntlProvider>,
);
```

`IntlProvider` lives at the root, *outside* `App`. This matters: when the locale changes, `IntlProvider` re-renders and the entire `<App />` subtree remounts so every `t()` call evaluates fresh. Putting `IntlProvider` *inside* `App` is the most common mistake — translations stop updating, button text changes, everyone's confused. So: outside `App`. Always.

## app.tsx

```tsx
import { t, useLocale } from 'yapyak';

export function App() {
  const [locale, setLocale] = useLocale();
  return (
    <main>
      <h1>{t('Hello')}</h1>
      <p>{t('Welcome, {name}!', { name: 'Joakim' })}</p>
      <button onClick={() => setLocale(locale === 'en' ? 'sv' : 'en')}>
        {locale.toUpperCase()}
      </button>
    </main>
  );
}
```

That's the whole app. Save the file, write a new `t()` call, watch the AI translate it for you in two seconds.

## What you don't get with Vanilla

- **No SSR.** The first paint happens client-side. If a user visits your site with a Swedish cookie set, they'll see the English version for a frame before React picks up the cookie and re-renders.
- **No request-scoped headers.** `getLocale()` on the server (if you ever render server-side) will return the default locale; on the client it reads `document.cookie`.

If either of these matters to you, switch to **[TanStack Start](./tanstack)** — it's the same library, just with the SSR plumbing already wired.

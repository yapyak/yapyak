---
order: 3
---

# Installation

```bash
pnpm add yapyak
pnpm exec yapyak init
```

`yapyak init` scaffolds a `locales/` directory and adds the type-include line to your `tsconfig.json`. After that you never touch it again.

## Vite plugin

Add the plugin to your `vite.config.ts`:

```ts
import { defineConfig, loadEnv } from 'vite';
import { yapyak } from 'yapyak/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      yapyak({
        defaultLocale: 'en',
        locales: ['en', 'sv'],
        persistence: 'cookie',
        ai: {
          provider: 'anthropic',
          apiKey: env.ANTHROPIC_API_KEY,
          autoTranslate: true,
        },
      }),
    ],
  };
});
```

That's the whole config. `defaultLocale` and `locales` are the only required fields. The rest is opt-in.

## Persistence

Yapyak persists the user's locale somewhere. Three options:

```ts
persistence: 'cookie'         // works with SSR
persistence: 'localStorage'   // SPA-only, GDPR-friendly
persistence: null             // in-memory (default); refresh resets to default
```

**Cookie is the only choice that's SSR-safe.** Cookies are sent with every request, so the server can read them and ship HTML pre-rendered in the right language. If you have any kind of server rendering (TanStack Start, SvelteKit), use cookie.

**localStorage** is for pure SPAs that never render server-side, or for apps that want to avoid cookies for GDPR reasons (localStorage is exempt from cookie banners in most jurisdictions). The trade-off: the server can't read it, so the first paint always renders in the default locale and the client swaps in after hydration. Brief flash possible.

**`null`** (default) disables persistence — useful for ephemeral sessions or when you handle persistence in app code via `setLocale()`.

To customize the cookie name or localStorage key:

```ts
persistence: { type: 'cookie', name: 'app-locale' }
persistence: { type: 'localStorage', key: 'app-locale' }
```

## App setup

Wrap your app once with `IntlProvider`:

```tsx
// main.tsx
import { IntlProvider } from 'yapyak';
import { createRoot } from 'react-dom/client';
import { App } from './app';

createRoot(document.getElementById('root')!).render(
  <IntlProvider>
    <App />
  </IntlProvider>,
);
```

For Vue and Svelte, see the framework-specific notes — both use lighter setups (no Provider component needed).

## Use it

```tsx
import { t, useLocale } from 'yapyak';

export function App() {
  const [locale, setLocale] = useLocale();
  return (
    <main>
      <h1>{t('Hello')}</h1>
      <button onClick={() => setLocale('sv')}>SV</button>
    </main>
  );
}
```

Save the file. The plugin extracts `'Hello'`, asks the AI for a Swedish version, writes `locales/sv.json`, hot-reloads the page. Three seconds. 🐃

## Environment

If you're using the AI features, set your provider's API key in `.env`:

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-...
# or
OPENAI_API_KEY=sk-...
```

The key is read via Vite's `loadEnv()` (see the config above) — never hardcoded, never committed.

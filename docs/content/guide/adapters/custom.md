---
title: Custom
order: 7
---

If your Vite SSR setup isn't TanStack Start or SvelteKit, wrap each request with `withRequest()`.

```ts
import { withRequest } from 'yapyak/adapter';

async function handler(request: Request): Promise<Response> {
  return withRequest(request, () => renderApp(request));
}
```

`withRequest()` reads `accept-language` and `cookie` from the `Request`, resolves the locale, lazy-loads that locale's translations, and binds everything to an async-scoped context. `getLocale()`, `t()`, and any other yapyak call inside the callback see this request's locale.

## What `withRequest()` does

Three steps per request:

1. **Resolve locale** from cookie + `Accept-Language` header.
2. **Load locale data** via dynamic `import()` (cached across requests — the second request for the same locale is free).
3. **Run the callback** inside `AsyncLocalStorage.run()` so concurrent requests stay isolated.

```ts
withRequest<T>(request: Request, fn: () => T | Promise<T>): Promise<T>;
```

`withRequest()` is always async — it awaits the locale-data load before running the callback.

## Setting `<html lang>`

If your root component is a reactive framework binding (React/Vue/Svelte), read the locale there so it re-renders on change:

```tsx
import type { ReactElement } from 'react';
import { useLocale } from 'yapyak/react';

function Component(): ReactElement {
  const [locale] = useLocale();
  return <html lang={locale}>{/* ... */}</html>;
}
```

If `<html>` is static HTML (no framework binding), enable `syncHtmlLang` and yapyak will keep `document.documentElement.lang` synced with the current locale:

```ts
// vite.config.ts
yapyak({
  syncHtmlLang: true,
})
```

## Cookie persistence

For SSR locale switching to work, enable cookie persistence:

```ts
yapyak({
  persistence: 'cookie',
})
```

See [Locales / Persistence](/guide/locales#persistence).

---
title: SvelteKit
order: 3
---

Re-export the `handle` hook from `hooks.server.ts`.

```ts
// src/hooks.server.ts
export { handle } from 'yapyak/adapters/sveltekit';
```

```html
<!-- src/app.html -->
<html lang="%yapyak.lang%">
  <head>
    <!-- ... -->
  </head>
  <body>
    <!-- ... -->
  </body>
</html>
```

The hook binds each request's locale context and substitutes `%yapyak.lang%` with the resolved locale before HTML reaches the browser.

## Composing with existing handles

If you already export a `handle` from `hooks.server.ts` (auth, logging, etc.), compose with SvelteKit's `sequence`:

```ts
// src/hooks.server.ts
import { sequence } from '@sveltejs/kit/hooks';
import { handle as yapyakHandle } from 'yapyak/adapters/sveltekit';
import { handle as authHandle } from './auth';

export const handle = sequence(yapyakHandle, authHandle);
```

yapyak's handle should run first so the `%yapyak.lang%` substitution happens before other transforms touch the HTML chunk.

## Cookie persistence

For SSR locale switching to work, enable cookie persistence in the Vite plugin:

```ts
// vite.config.ts
yapyak({
  persistence: 'cookie',
})
```

The cookie is written client-side on `setLocale()` and read server-side by the handle on every request. See [Locales / Persistence](/guide/locales#persistence).

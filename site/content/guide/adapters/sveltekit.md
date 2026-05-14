---
title: SvelteKit
order: 3
---

Two pieces wire SvelteKit: the `sveltekit()` call that binds per-request headers, and the `handle` hook that injects the resolved locale into `<html lang>`.

```ts
// src/hooks.server.ts
import { sveltekit, handle } from 'yapyak/adapters/sveltekit';

sveltekit();
export { handle };
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

The `%yapyak.lang%` placeholder is replaced by SvelteKit's `transformPageChunk` with the resolved locale before HTML reaches the browser.

## Composing with existing handles

Most apps already export a `handle` from `hooks.server.ts` (auth, logging, etc.). Use SvelteKit's `sequence`:

```ts
// src/hooks.server.ts
import { sequence } from '@sveltejs/kit/hooks';
import { sveltekit, handle as yapyakHandle } from 'yapyak/adapters/sveltekit';
import { handle as authHandle } from './auth';

sveltekit();
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

The cookie is written client-side on `setLocale()` and read server-side by the adapter on every request. See [Locales / Persistence](/guide/locales#persistence).


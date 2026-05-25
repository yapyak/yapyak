---
title: SvelteKit
order: 5
---

Re-export the `handle` hook from `hooks.server.ts`.

```ts
// src/hooks.server.ts
export { handle } from '@yapyak/sveltekit';
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

## Set the page language on client-side switches

`%yapyak.lang%` is substituted **server-side** — the placeholder is gone by the time HTML reaches the browser. So calling `setLocale()` on the client without a full page reload won't update `<html lang>` on its own.

Enable `syncHtmlLang` to make yapyak update the attribute on every `setLocale()`:

```ts
// yapyak.config.ts
import type { YapyakConfig } from '@yapyak/vite/config';

export default {
  persistence: 'cookie',
  syncHtmlLang: true,
} satisfies YapyakConfig;
```

With this set, `document.documentElement.lang` follows the current locale on store init and on every `setLocale()`. SSR still uses the `%yapyak.lang%` substitution — no hydration mismatch.

If you only ever switch locale via full page navigations (e.g. `<a href="?lang=sv">` + reload), leave `syncHtmlLang` off — the substitution alone is enough.

## Composing with existing handles

If you already export a `handle` from `hooks.server.ts` (auth, logging, etc.), compose with SvelteKit's `sequence`:

```ts
// src/hooks.server.ts
import { sequence } from '@sveltejs/kit/hooks';
import { handle as yapyakHandle } from '@yapyak/sveltekit';
import { handle as authHandle } from './auth';

export const handle = sequence(yapyakHandle, authHandle);
```

yapyak's handle should run first so the `%yapyak.lang%` substitution happens before other transforms touch the HTML chunk.

## Cookie persistence

For SSR locale switching to work, enable cookie persistence:

```ts
// yapyak.config.ts
import type { YapyakConfig } from '@yapyak/vite/config';

export default {
  persistence: 'cookie',
} satisfies YapyakConfig;
```

The cookie is written client-side on `setLocale()` and read server-side by the handle on every request. See [Locales / Persistence](/guide/locales#persistence).

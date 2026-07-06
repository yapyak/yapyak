---
title: Fixed-locale builds
order: 4
---

A fixed-locale build ships a single language. It suits a static deploy that serves one language per build, one bundle per locale.

`fixedLocale` is an option on the Vite plugin, not a `yapyak.config.ts` field, because it shapes the bundle at compile time rather than configuring the project:

```ts [vite.config.ts]
import { yapyak } from '@yapyak/vite';

export default defineConfig({
  plugins: [
    yapyak({ fixedLocale: 'sv' })
  ]
});
```

The value must be one of your configured locales. yapyak throws at build time if it isn't.

For a CI matrix that builds one bundle per locale, drive it from an environment variable:

```ts [vite.config.ts]
yapyak({ fixedLocale: process.env.YAPYAK_LOCALE })
```

```bash
YAPYAK_LOCALE=sv pnpm build
```

## Build output

yapyak compiles every `t()` call to the fixed locale's value and tree-shakes the locale picker out of the bundle. A plain message becomes a string literal, a message with parameters becomes a template literal, and text inside markup collapses into it. See [Compile](/guide/getting-started/how-it-works#compile) for what each kind of message becomes.

The runtime never observes `fixedLocale`. It resolves the active locale at compile time, so there is nothing left to switch and no picker to ship.

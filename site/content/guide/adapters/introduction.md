---
title: Introduction
order: 1
---

An adapter wires yapyak to your SSR framework so each request renders in its own locale. Without one, server-rendered HTML always uses the default locale.

For TanStack Start and SvelteKit, a one-line call handles the wiring:

```ts
import { tanstackStart } from 'yapyak/adapters/tanstack-start';
tanstackStart();
```

For other frameworks, call `setRequestSource(request)` at the top of each request handler:

```ts
import { setRequestSource } from 'yapyak';

function handler(request: Request) {
  setRequestSource(request);
  return renderApp(request);
}
```

Pure SPAs (no SSR) don't need an adapter.

## Pages

- [TanStack Start](/guide/adapters/tanstack-start)
- [SvelteKit](/guide/adapters/sveltekit)
- [Custom](/guide/adapters/custom) — Next.js, Astro, Hono, Express, or any Node request handler

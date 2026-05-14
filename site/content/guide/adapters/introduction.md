---
title: Introduction
order: 1
---

An adapter wires yapyak to your SSR framework so each request renders in its own locale. Without one, server-rendered HTML always uses the default locale.

For TanStack Start, register the request middleware:

```ts
// src/start.ts
import { middleware } from 'yapyak/adapters/tanstack-start';

export default {
  requestMiddleware: [middleware],
};
```

For SvelteKit, re-export the handle hook:

```ts
// src/hooks.server.ts
export { handle } from 'yapyak/adapters/sveltekit';
```

For other frameworks, wrap each request manually with `withRequest()`:

```ts
import { withRequest } from 'yapyak/server';

function handler(request: Request) {
  return withRequest(request, () => renderApp(request));
}
```

Pure SPAs (no SSR) don't need an adapter.

## Pages

- [TanStack Start](/guide/adapters/tanstack-start)
- [SvelteKit](/guide/adapters/sveltekit)
- [Custom](/guide/adapters/custom)

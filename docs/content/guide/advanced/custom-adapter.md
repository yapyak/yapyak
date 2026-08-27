---
title: Custom adapter
order: 2
---

When the shipped adapters don't cover your Vite-based SSR framework, [`withResponse()`](/reference/yapyak/adapter/withResponse) is the escape hatch. It's a single function from `yapyak/adapter` that the shipped adapters wrap.

## The function

```ts
import { withResponse } from 'yapyak/adapter';

await withResponse(request, async () => {
  return await render(request);
});
```

Code inside the callback can read the request-bound locale.

`withResponse(request, callback, responseExtractor?)` does three things:

1. **Scopes the request.** Uses Node's `AsyncLocalStorage` to store the request, so [`getLocale()`](/guide/switching/switch) can read its persistence and `Accept-Language` header inside the callback.
2. **Runs the callback** inside that scope.
3. **Flushes pending headers.** Drains any response headers yapyak buffered onto the response. A `Set-Cookie` from a server-side `setLocale()` is the common case.

If your callback returns a `Response`, yapyak appends the buffered headers to it.

## Minimal adapter

The simplest framework-specific middleware wraps a request handler:

```ts
import { withResponse } from 'yapyak/adapter';

export const middleware = async (request: Request, next: () => Promise<Response>) => { return withResponse(request, () => next()); };
```

Plug it into whatever middleware interface your framework expects. Anything that reads `getLocale()` from inside `next()` sees the right value.

## When the response isn't the direct return

Some frameworks wrap the `Response` in another object. Use the third argument to point yapyak at where the response lives:

```ts
import { withResponse } from 'yapyak/adapter';

await withResponse(
  request,
  async () => {
    return await renderToFrameworkResult(request);
  },
  (result) => result.response
);
```

The third argument is a selector that tells yapyak where the `Response` lives on the framework's return value. Here, `renderToFrameworkResult` returns `{ meta, response }`, and yapyak flushes pending headers onto `result.response`.

The shipped TanStack Start adapter uses this pattern. The framework's middleware returns `{ response, ... }`, and yapyak's adapter extracts the `Response` to flush pending headers onto.

## Setting `<html lang>` and `<html dir>`

How you render `<html lang>` and `<html dir>` depends on your framework, but the source of truth is the same. Call [`getLocale()`](/guide/switching/switch) from inside the `withResponse` scope. Derive the direction with [`getTextDirection`](/reference/yapyak/getTextDirection), and pass both to your template, your component, your renderer. Whatever is producing the HTML.

For client-side switching from inside a React/Vue/Svelte runtime, enable [`syncHtmlAttributes: true`](/guide/getting-started/configuration#synchtmlattributes) in `yapyak.config.ts` so the attributes follow the locale without a navigation.

## Persistence considerations

On the server, `withResponse` reads your configured [persistence strategy](/guide/switching/persistence) off the request automatically ([cookie](/guide/switching/persistence#cookie) or [URL](/guide/switching/persistence#url)). If [`detectUserLocale`](/guide/getting-started/configuration#detectuserlocale) is enabled, it also reads `Accept-Language`.

For server-side persistence writes (a `setLocale()` call inside a request handler), yapyak buffers the headers until `withResponse` finishes, then flushes them onto the response. If your framework constructs its response object outside of `withResponse`, the buffered headers won't reach the user. Keep the response construction inside the scope.

## Shipped adapters

If you'd like to model your adapter on a known-good example, the shipped adapters are short:

- [React Router](https://github.com/yapyak/yapyak/blob/main/packages/react-router/src/middleware.ts). Wraps `withResponse(request, () => next())` in a React Router middleware function
- [SvelteKit](https://github.com/yapyak/yapyak/blob/main/packages/sveltekit/src/handle.ts). Wraps `withResponse(event.request, () => resolve(event, ...))` in a SvelteKit `Handle`
- [TanStack Start](https://github.com/yapyak/yapyak/blob/main/packages/tanstack-start/src/middleware.ts). Wraps `withResponse(request, () => next(), (result) => result.response)` in TanStack Start's middleware shape
- [Astro](https://github.com/yapyak/yapyak/blob/main/packages/astro/src/integration.ts). Registers `withResponse` as Astro middleware through the integration system
- [Nuxt](https://github.com/yapyak/yapyak/blob/main/packages/nuxt/src/runtime/nitro.ts). Wraps the Nitro handler in `withResponse` and flushes the buffered headers in a `beforeResponse` hook

Each one is a single function. Most of the file is JSDoc.

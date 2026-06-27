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

Anything inside the callback sees the request-bound locale.

`withResponse(request, callback, responseExtractor?)` does three things:

1. Puts the request into an `AsyncLocalStorage` scope so [`getLocale()`](/guide/switching/switch) resolves through the request's [persistence layer](/guide/switching/persistence), or through the `Accept-Language` header when [`detectUserLocale`](/guide/getting-started/configuration#detectuserlocale) is on.
2. Runs `callback()` inside that scope.
3. Drains any pending response headers buffered by yapyak (a `Set-Cookie` from a server-side `setLocale()` call, for example) onto the response.

The result of `callback()` is whatever you returned. If you returned a `Response`, yapyak appends the buffered headers to it before passing it back to you.

## Minimal wrapper

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

## Setting `<html lang>`

How you render `<html lang>` depends on your framework, but the source of truth is the same: call [`getLocale()`](/guide/switching/switch) from inside the `withResponse` scope. Pass it to your template, your component, your renderer. Whatever is producing the HTML.

For client-side switching from inside a React/Vue/Svelte runtime, enable [`syncHtmlLang: true`](/guide/getting-started/configuration#synchtmllang) in `yapyak.config.ts` so the attribute follows the locale without a navigation.

## Persistence considerations

Server-side persistence reads happen inside `withResponse`. Whatever [persistence strategy](/guide/switching/persistence) you've configured ([cookie](/guide/switching/persistence#cookie), [URL](/guide/switching/persistence#url)) is read off the request automatically. If [`detectUserLocale`](/guide/getting-started/configuration#detectuserlocale) is enabled, the `Accept-Language` header is consulted too.

Server-side persistence writes (a `setLocale()` call inside a request handler) are buffered until `withResponse` finishes, then flushed onto the response. If your framework constructs its response object outside of `withResponse`, the buffered headers won't reach the user. Keep the response construction inside the scope.

## The processor side

Every framework needs a [processor](/guide/getting-started/configuration#processors) registered in `yapyak.config.ts` so yapyak knows how to scan source files for `t()` calls. For TypeScript/JavaScript-only projects, the built-in parser handles `.ts`/`.tsx` and you don't need to register anything. For frameworks with their own file format, write a [custom processor](/guide/getting-started/configuration#custom-processors) with `createProcessor` from `yapyak/processor`.

## What the shipped adapters do

If you'd like to model your wrapper on a known-good example, the shipped adapters are short:

- [React Router](https://github.com/yapyak/yapyak/blob/main/packages/react-router/src/middleware.ts). Wraps `withResponse(request, () => next())` in a React Router middleware function
- [SvelteKit](https://github.com/yapyak/yapyak/blob/main/packages/sveltekit/src/handle.ts). Wraps `withResponse(event.request, () => resolve(event, ...))` in a SvelteKit `Handle`
- [TanStack Start](https://github.com/yapyak/yapyak/blob/main/packages/tanstack-start/src/middleware.ts). Wraps `withResponse(request, () => next(), (result) => result.response)` in TanStack Start's middleware shape
- [Astro](https://github.com/yapyak/yapyak/blob/main/packages/astro/src/integration.ts). Registers `withResponse` as Astro middleware through the integration system

Each one is a single function. Most of the file is JSDoc.

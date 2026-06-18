---
title: Overview
order: 1
---

On the server, the active locale isn't a long-lived store — it's per-request. Two requests can land on the same Node process at the same time, one in Swedish and one in English, and each one needs `getLocale()` to return the right value for that request without leaking into the other.

yapyak handles this with `withResponse()`, a wrapper that binds an incoming request to a context for the duration of its render. SSR adapters install this binding through the framework's normal middleware mechanism, so you don't have to think about it directly — they register one middleware, and everything inside (`t()`, `getLocale()`, `setLocale()`, `format.*`) sees the right locale. The rest of your code keeps using `t()` and `getLocale()` the same on the server as on the client.

## What the adapter does

Three things happen inside the adapter middleware on every request:

1. **The request is bound.** `withResponse(request, callback)` puts the request into an `AsyncLocalStorage` scope so anything called inside `callback` sees `getLocale()` resolve through the request's [persistence layer](/guide/locale/persistence), or — if [`detectAcceptLanguage`](/guide/getting-started/configuration#detectacceptlanguage) is on — through the `Accept-Language` header.
2. **Server-side `setLocale()` writes go through.** If something in the request handler calls `setLocale('sv')` — a form POST that updates the user's preference, an admin tool that previews in another language — yapyak buffers the persistence write (a `Set-Cookie` header, a URL redirect) and drains it onto the outgoing response.
3. **The page renders with the right locale.** Every `t()` call, every `format.*` call, every `useLocale()` hook reads the request-bound value.

Without the adapter, `getLocale()` on the server falls through to the module-scope default, which is the same value across every concurrent request. A `YAP0022` warning fires the first time this happens so you notice — usually it means an SSR endpoint isn't covered by the middleware yet.

## Picking your adapter

Pick the one that matches your framework:

| Framework | Adapter | What it registers |
|---|---|---|
| [Astro](/guide/adapters/astro) | `@yapyak/astro/integration` | Vite plugin + per-request middleware |
| [React Router](/guide/adapters/react-router) (v7 framework mode) | `@yapyak/react-router` | Root-route middleware |
| [SvelteKit](/guide/adapters/sveltekit) | `@yapyak/sveltekit` | `handle` hook with `app.html` placeholder substitution |
| [TanStack Start](/guide/adapters/tanstack-start) | `@yapyak/tanstack-start` | Request middleware |
| Anything else | [Custom](/guide/adapters/custom) | `withResponse()` directly |

For any Vite-based SSR framework that isn't on the list, [Custom](/guide/adapters/custom) covers how to wrap `withResponse()` into whatever middleware shape your framework expects.

## Setting `<html lang>`

A small but useful thing: SSR adapters set the `<html lang>` attribute to match the active locale on every page render, so screen readers and browsers see the right language hint immediately. The mechanism differs per framework — Astro reads it through `getLocale()` in your layout, SvelteKit substitutes a `%yapyak.lang%` placeholder, React Router and TanStack Start expose it via the framework's normal lang-attribute APIs. Each adapter page covers the specifics.

For client-side locale switches inside an island or a client component, set [`syncHtmlLang: true`](/guide/getting-started/configuration#synchtmllang) in `yapyak.config.ts` so the attribute follows the locale without a navigation.

## What about client-only apps?

If your app doesn't render on the server — a plain Vite + React SPA with no SSR — you don't need an adapter. The locale is a single client-side store, set through `useLocale()` (or the equivalent reactive value), persisted through cookies/local-storage/URL as configured. The whole SSR section is safe to skip.

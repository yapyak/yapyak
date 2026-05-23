---
title: Introduction
order: 1
---

An adapter wires yapyak to your SSR framework so each request renders in its own locale. Without one, server-rendered HTML always uses the default locale.

## What an adapter does

At request time, the adapter binds `Cookie` and `Accept-Language` to an async-scoped context. Inside that request — route loaders, server components, route handlers — `getLocale()` and `$t()` see the per-request locale.

## Pure SPAs don't need one

If you ship a fully client-rendered app with no SSR, the locale lives entirely in the browser.

## Pick your framework

yapyak ships adapters for the major SSR frameworks:

- [Astro](/guide/adapters/astro) — middleware re-export
- [React Router](/guide/adapters/react-router) — root-route middleware (v7 framework mode)
- [TanStack Start](/guide/adapters/tanstack-start) — request middleware
- [SvelteKit](/guide/adapters/sveltekit) — handle hook re-export

For anything else, the [custom adapter](/guide/adapters/custom) wraps each request with `withRequest()` — that's the entire surface area.

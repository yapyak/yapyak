# Frameworks

`t()` is the same import everywhere — React, Svelte, Vue, plain JavaScript. The plugin extracts and rewrites it the same way regardless of file type. The only thing that differs between frameworks is **how you bind the locale to component reactivity**.

## What's framework-specific

The reactive locale binding. Each framework has its own idiom for "subscribe to a value and re-render when it changes":

| Framework | Binding | Read | Write |
| --- | --- | --- | --- |
| React | `useLocale()` hook | `locale` (string) | `setLocale(next)` |
| Svelte | `locale` singleton | `locale.current` | `locale.current = next` |
| Vue | `locale` singleton | `locale.value` | `locale.value = next` (or `v-model="locale"`) |

Pick the idiom that matches your framework. The rest of yapyak — `t()`, `getLocale()`, `getLocales()`, the Vite plugin, the auto-translate loop, position-aware renames — works identically across all three.

## What's the same

- **`t()` from `yapyak`.** Same import. Same call site. Same compile-time rewrite. Templates and JSX both supported.
- **`getLocale()` / `setLocale()` / `getLocales()` from `yapyak`.** Plain functions, no framework dependency. Use anywhere.
- **`yapyak/vite` plugin.** Configured once in `vite.config.ts`. Works for any framework.
- **AI translation pipeline.** The same Translator runs regardless of framework.

## SSR is separate

Reactive locale binding is one thing. Per-request locale resolution on the server is another. SSR is wired through an **adapter**, not a framework integration.

- React + TanStack Start → [`yapyak/adapters/tanstack-start`](/guide/adapters/tanstack-start)
- Svelte + SvelteKit → [`yapyak/adapters/sveltekit`](/guide/adapters/sveltekit)
- Anything else (Astro, Hono, Express, Fastify) → [custom adapter](/guide/adapters/custom)

You don't need an adapter if your app is pure SPA (no SSR).

## Where to go

- [React](/guide/frameworks/react) — `useLocale` hook, locale switcher patterns, common gotchas
- [Svelte](/guide/frameworks/svelte) — `locale` singleton, `bind:value`, `$state` integration
- [Vue](/guide/frameworks/vue) — `locale` singleton, `v-model`, composition API

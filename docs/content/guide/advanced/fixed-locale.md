---
title: Fixed-locale builds
order: 4
---

A fixed-locale build ships a single language. It suits a static deploy that serves one language per build, one bundle per locale.

`fixedLocale` is a build option, not a `yapyak.config.ts` field, because it shapes the bundle at compile time rather than configuring the project:

{% switch group="framework" %}

{% when value="astro" %}
```ts [astro.config.ts]
import { yapyak } from '@yapyak/astro/integration';

export default defineConfig({
  integrations: [
    yapyak({ fixedLocale: 'sv' })
  ]
});
```
{% /when %}

{% else %}
```ts [vite.config.ts]
import { yapyak } from '@yapyak/vite';

export default defineConfig({
  plugins: [
    yapyak({ fixedLocale: 'sv' })
  ]
});
```
{% /else %}

{% /switch %}

The value must be one of your configured locales. yapyak throws at build time if it isn't.

For a CI matrix that builds one bundle per locale, drive it from an environment variable:

```ts
yapyak({ fixedLocale: process.env.YAPYAK_LOCALE })
```

```bash
YAPYAK_LOCALE=sv pnpm build
```

## Build output

yapyak compiles every `t()` call to the fixed-locale value. With `fixedLocale: 'sv'`:

{% switch group="framework" %}

{% when value="vue" %}
```vue
<button>{{ t('Save changes') }}</button>
```
{% /when %}

{% else %}
```tsx
<button>{t('Save changes')}</button>
```
{% /else %}

{% /switch %}

compiles to:

```html
<button>Spara ändringar</button>
```

See [Compile](/guide/getting-started/how-it-works#compile) for parameters, plurals, and rich text.

The runtime never observes `fixedLocale`. It resolves the active locale at compile time, so there is nothing left to switch and no picker to ship.

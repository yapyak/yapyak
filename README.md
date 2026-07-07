# yapyak

**i18n that keeps up.**

[![CI](https://github.com/yapyak/yapyak/actions/workflows/ci.yml/badge.svg)](https://github.com/yapyak/yapyak/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/yapyak?logo=npm&color=cb3837&label=npm)](https://www.npmjs.com/package/yapyak)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

yapyak is an i18n compiler with a small runtime, built for the way code gets written today: rapidly, often with help from a coding agent, and rarely pausing for a separate translation step.

It's a Vite plugin. Works with React, Vue, Svelte, and Astro. SSR is supported on Astro, React Router, SvelteKit, and TanStack Start.

The runtime has no dependencies, built on the platform's Intl API. About 6 KB gzipped for typical use, zero for fixed-locale builds.

Read more and documentation at [yapyak.dev](https://yapyak.dev).

## How it works

```tsx
import { t } from 'yapyak'

<button>{t('Save changes')}</button>
```

Save the file. yapyak finds the `t()` call, reads the surrounding code as context, and writes every locale entry. The English string is your key.

## The API

One function. The English string is always the key.

```ts
t('Save changes')
t('Hi {name}', { name })
t('You have {count, plural, one {# item} other {# items}}', { count })
t('Total {n, number, integer}', { n: 1234.5 })
t('Read our <link>privacy policy</link>.')

t.as('action', 'Open')       // same word, disambiguated by context
t.in('sv', 'Welcome back!')  // render in a specific locale
```

Placeholders, plurals, dates, numbers, and currency run on the platform's `Intl` API. Rich text binds `<tags>` to your own components.

## Install

```bash
npm install yapyak
```

Add the Vite plugin and you're done. See [yapyak.dev/guide/installation](https://yapyak.dev/guide/installation).

## Contributing

yapyak is early, and contributions are very welcome.

Bug reports, docs fixes, examples, adapter work, and feedback from real projects all help.

If you find yapyak useful, sharing it helps too. More real-world use brings better feedback and more edge cases.

---

MIT licensed · self-hosted · BYO LLM key

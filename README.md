# yapyak

**i18n that writes itself.**

For Vite apps moving at the speed of save.

```tsx
import { t } from 'yapyak'

<button>{t('Save changes')}</button>
```

Save the file. yapyak finds the `t()` call, reads the surrounding code as context, and writes every locale entry. The English string is your key.

**Documentation →** [yapyak.dev](https://yapyak.dev)

## Install

```bash
npm install yapyak
```

Then a Vite plugin and you're done. See [yapyak.dev/guide/installation](https://yapyak.dev/guide/installation).

React · Vue · Svelte. SSR adapters for Astro, React Router, SvelteKit, TanStack Start.

---

MIT licensed · self-hosted · BYO LLM key

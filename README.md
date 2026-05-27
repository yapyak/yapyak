# yapyak

**i18n that writes itself.**

[![npm](https://img.shields.io/npm/v/yapyak?logo=npm&color=cb3837&label=npm)](https://www.npmjs.com/package/yapyak)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)

[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=000)](#)
[![Vue](https://img.shields.io/badge/Vue-4FC08D?logo=vuedotjs&logoColor=fff)](#)
[![Svelte](https://img.shields.io/badge/Svelte-FF3E00?logo=svelte&logoColor=fff)](#)
[![Astro](https://img.shields.io/badge/Astro-FF5D01?logo=astro&logoColor=fff)](#)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?logo=svelte&logoColor=fff)](#)
[![TanStack Start](https://img.shields.io/badge/TanStack_Start-F05032?logo=tanstack&logoColor=fff)](#)
[![React Router](https://img.shields.io/badge/React_Router-CA4245?logo=reactrouter&logoColor=fff)](#)

[![Anthropic](https://img.shields.io/badge/Anthropic-191919?logo=anthropic&logoColor=fff)](#)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=fff)](#)
[![Gemini](https://img.shields.io/badge/Gemini-8E75B2?logo=googlegemini&logoColor=fff)](#)
[![Ollama](https://img.shields.io/badge/Ollama-000?logo=ollama&logoColor=fff)](#)

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

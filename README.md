# yapyak 🐃

> **Yap in English. Ship in everything.**
>
> i18n for AI-powered teams. Translations are side-effects.

**React · Svelte 5 · Vue 3** — with SSR adapters for **TanStack Start** and **SvelteKit**.

yapyak co-locates your translations with your code and lets AI maintain them.

You write `t('Save changes')` in your component. Save. The AI of your choice (Anthropic, OpenAI, or anything you wire up) regenerates every locale in your voice — with the surrounding code as context — and HMR pushes the new copy live before you switch tabs.

No enterprise portal, no per-seat pricing, no vendor in your billing path. Bring your own key, own the whole loop.

The default language lives only in your code. There's no `en.json`. Other locales are derived from your source like compiled output — regenerated on save, never authored. Translations are side-effects.

What Tailwind did to CSS class names, yapyak does to translation keys: kills the naming meeting. The string in your editor is the string in your app.

It's also the shape AI thrives in. Everything's in one file — the source string, the surrounding code, the component name. Claude reads `t('Save changes')` and sees the meaning right there. No round-trip to figure out what `auth.error.invalid_2` actually says. Every agent in your editor pulls in the same direction.

It's a Vite plugin. MIT, BYO key, no telemetry.

## Quick start

```bash
npm install yapyak
npx yapyak add sv
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';
import { anthropic } from 'yapyak/translators/anthropic';

export default defineConfig({
  plugins: [
    yapyak({
      persistence: 'cookie',
      translator: anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        voice: 'Casual, thoughtful, never corporate.',
      }),
    }),
  ],
});
```

```tsx
import { t } from 'yapyak';

export function SaveButton() {
  return <button>{t('Save changes')}</button>;
}
```

Save the file.

`locales/sv.json` appears automatically:

```json
{
  "src/components/save-button.tsx": {
    "Save changes": "Spara ändringar"
  }
}
```

Edit the string. Save again. Every locale updates instantly via HMR.

## Translate by saving

The Vite plugin watches every `t()` call. New strings get added to your locale files. Removed strings get pruned. Edited strings re-translate. All of it on save, in the background.

Each batch goes to your translator with the source string, the file path, the surrounding JSX or template element, your voice prompt, and your glossary. Default batch size is 10 — about 10× fewer API calls than naive one-string-at-a-time. A typical save round-trips in under a second.

```ts
yapyak({
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    voice: 'Personal blog voice. Casual, thoughtful, never corporate.',
    glossary: {
      'sign in': { sv: 'logga in', no: 'logg inn' },
      cart: { sv: 'varukorg', no: 'handlekurv' },
    },
  }),
}),
```

Each `t('...')` is rewritten at build time into a direct lookup with all locale variants inlined. Routes that don't reference a string don't ship its translations — Vite/Rollup tree-shake per chunk.

## Add a language anytime

Need French? Run one command.

```bash
$ npx yapyak add fr
  Translating via Anthropic  142 strings
  ✔ 142 translated · 14.3s
```

yapyak walks every `t()` call in your codebase, batches them to your translator, and writes `locales/fr.json` in one pass.

## Position-aware rename memory

The classic source-as-keys trap: change `t('Save')` to `t('Save changes')` and you've renamed the key. Naive implementations lose every existing translation. yapyak doesn't.

```diff
- t('Save')
+ t('Save changes')
```

```
[yapyak] ↻ "Save" → "Save changes" (rename detected)
[yapyak] sv: re-translating…
```

The plugin compares positions of every `t()` call between saves. If a string disappeared at line 23, column 12, and a new string appeared at the exact same position, that's a rename — not a delete-and-add. Locale files get the key swapped, existing translations stay as placeholders until the new English re-translates.

Position matching is exact. No similarity heuristics. No false positives.

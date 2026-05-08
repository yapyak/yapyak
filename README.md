# yapyak

> **Let your app yak in any language.**
>
> The next-generation i18n library for your Vite app. And yeah, AI is built in too.

So let's face it: every translation library so far has kind of sucked. The tooling around them has evolved a lot. The DX around them has evolved. And yet, somehow, the translation libraries themselves have been frozen in time — about as stiff and stuck as the printing industry. Important, sure. Better not to touch it, sure. It works, sure. But the *thing* is: today, it's completely unnecessarily clunky. The world has moved on. The only reason nothing's moved with it is that legacy libraries are stuck dragging backwards compatibility behind them like a tail.

yapyak doesn't have that problem. Not for the next few years, anyway. It's written from scratch with today's tooling in mind: Vite, AOT compilation, AI translation, file-scoped keys, AsyncLocalStorage SSR. No legacy. No baggage. No 2014.

The goal of yapyak is to eliminate all of that — and not feel enterprise-y while doing it. And ride the AI wave a little while we're at it.

### Vite-only, and proud of it

yapyak is Vite-only. On purpose. Vite is awesome, it's pretty much the standard now, and going framework-agnostic means meeting eight different bundlers' edge cases halfway and pleasing none of them. We'd rather be excellent in one place than mediocre everywhere. If you're on Webpack or Rollup-without-Vite — we're not your tool, and that's fine.

---

## Quick start

```bash
pnpm add yapyak
pnpm exec yapyak init
```

```ts
// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import { yapyak } from 'yapyak/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      yapyak({
        defaultLocale: 'en',
        locales: ['en', 'sv'],
        cookie: 'locale',
        ai: {
          provider: 'anthropic',
          apiKey: env.ANTHROPIC_API_KEY,
          autoTranslate: true,
        },
      }),
    ],
  };
});
```

```tsx
// app.tsx
import { IntlProvider, t } from 'yapyak';

export function App() {
  return (
    <IntlProvider>
      <h1>{t('Hello')}</h1>
    </IntlProvider>
  );
}
```

That's it. Save the file. The plugin extracts `'Hello'`, asks Claude for a Swedish version, writes `locales/sv.json`, hot-reloads the page. You're done in three seconds.

---

## Why yapyak

### No more naming things

Translation keys are a special kind of hell. `home.hero.cta.signup.button` — does it sign up or log in? Who knows. You named it, then someone changed the copy, and now the key lies. Or you skip naming and call it `key1`. Or you commit to a naming convention that nobody else on your team agrees with.

yapyak takes a different swing: **the translation is the key**. You write `t('Save changes')`. The string itself *is* the lookup. There's nothing to name, because the source language already names it. Think of what Tailwind did to CSS class names — same energy. Less friction.

If two files happen to use the same source text but want different translations? That's fine — translations are scoped per file. `t('Save')` in your settings page can be `'Spara'`, while `t('Save')` in your editor can be `'Spara ändringar'`. Same key, different files, no collisions, no bikeshedding.

### Hot-hot-reload with AI translation in the background

Most i18n libraries make you stop, run an `extract` script, open a JSON file, edit by hand or hand it off to a translator, wait, merge, refresh. yapyak does it inline:

1. You write `t('Some new string')`.
2. You save the file.
3. The plugin extracts the string, calls your configured AI, writes the translation.
4. HMR fires. Your UI updates with the new translation.

Total elapsed time: 1–3 seconds. No build step. No CLI loop. No waiting for a translator email.

### Typed to the bone

Locale codes are a discriminated union: `setLocale('haha')` is a TypeScript error. Translation params are inferred from the source string: `t('Hello {name}')` *requires* `{ name }`, `t('Hello')` *forbids* a second argument. Mess up your ICU plural? You'll know at compile time.

### Autocomplete that actually knows your strings

This is the part where i18n libraries usually shrug. Either your keys are abstract identifiers (autocomplete works, but you've already lost), or your keys are the strings themselves and autocomplete just gives up.

yapyak does both. The Vite plugin reads your locale files, generates a literal-typed union of every source string in your project, and rewires `t()` to autocomplete on it — while *still* letting you type a new string the second you need one. No registration step. No "add this to your messages.json first" dance.

```tsx
t('R')   // ↑ autocomplete suggests "Recent writings"
t('Save changes')   // ↑ autocomplete from history
t('A brand new string nobody has translated yet')   // ✅ also fine
```

The TypeScript trick is `T extends KnownSource | (string & {})` — known strings get autocomplete; new strings get accepted; nothing gets in your way. You also get autocomplete on `messages.sv['src/routes/home.tsx']['Recent writings']` if you really want to spelunk into the raw data. Refactoring is suddenly real: rename a string, find every site, fix typos with one click.

Most i18n libs treat types as a stretch goal. yapyak treats them as table stakes.

### Tiny footprint

The usual i18n library asks you to install a dozen sub-packages, scaffold a directory tree, configure a Babel plugin, and figure out where the messages live. yapyak is one package with a Vite plugin. Everything else — the runtime module, the per-locale chunks, the type declarations — is generated and cached invisibly inside `node_modules/.cache/`. Your repo gets `locales/sv.json`, and one ugly line in `tsconfig.json`:

```jsonc
{
  "include": ["src/**/*", "node_modules/.cache/yapyak/types.d.ts"]
  //                       ^ yes, this is the ugliest line in your config.
  //                         we hate it too. but TypeScript needs to find
  //                         the auto-generated types somewhere, and this
  //                         is the only place it doesn't pollute. promise:
  //                         this is the ugliest yapyak ever asks you to be.
}
```

That's it. `yapyak init` adds it for you. After that, you never touch it again.

### SSR-ready, no manual wiring

If you're on TanStack Start (and we'll add adapters for others), `<IntlProvider>` figures out the locale on the server by reading the request cookie via TanStack's request-scoped headers. The HTML ships pre-rendered in the right language. No flash, no `useEffect`-flicker, no `loader` boilerplate.

```tsx
// __root.tsx — this is the entirety of your SSR setup
<html lang={getLocale()}>
  <body>
    <IntlProvider>
      <Outlet />
    </IntlProvider>
  </body>
</html>
```

### AI without lock-in

Here's where the clever founder would start thinking about money. Wrap the AI calls. Vibe code a nice looking "yapyak Cloud" in front. Charge $9/month per dev. Skim a margin off every translation. You know the playbook.

We're not doing that. Not yet, anyway. Maybe never. Instead: bring your own AI. Whatever you want. Your Anthropic key, your OpenAI key, your self-hosted Llama, your fine-tuned DeepL endpoint, your wife who speaks Swedish. We don't care, we don't take a cut, we don't even know what model you're using — and frankly, we don't want to know.

The AI part is opt-in and pluggable:

```ts
ai: {
  provider: 'anthropic',                    // or 'openai', or your own function
  apiKey: env.ANTHROPIC_API_KEY,
  voice: 'Casual, witty, never corporate.',
  glossary: { 'Sign up': { sv: 'Skapa konto' } },
  autoTranslate: true,
}
```

Built-in providers cover Anthropic and OpenAI with type-safe model names (`claude-sonnet-4-6`, `gpt-5-mini`, etc.). Want to use Ollama, Mistral, your own fine-tuned model, or DeepL? Pass a function:

```ts
ai: {
  provider: async ({ source, targetLocale, voice, glossary }) => {
    return await myLLM.translate(source, targetLocale);
  }
}
```

Same API, different brain.

### Intelligent change tracking

`yapyak check` walks your code and your locale files, and tells you what's missing, what's stale, and what's broken JSON. Zero exit code if all green, non-zero otherwise. Drop it in CI and you're done.

```bash
$ pnpm exec yapyak check
✗ Missing translations (2):
  [sv] src/routes/home.tsx → "Welcome"
  [sv] src/routes/home.tsx → "Sign up to continue"

# CI fails, PR blocked
```

Run with `--write` to auto-fix everything (extract + translate via AI):

```bash
$ pnpm exec yapyak check --write
✔ Removed 1 stale string
✔ sv: 2 translated
```

### Built on AOT-compiled ICU

Translations get compiled to JavaScript functions ahead of time — no runtime parser, no MessageFormat library shipping in your bundle. Plurals, selects, named placeholders, exact match — all the standard stuff:

```tsx
t('You have {count, plural, one {# message} other {# messages}}', { count: 3 })
// "You have 3 messages"

t('{name, select, joakim {Hej} other {Hello}}, {greeting}', {
  name: 'joakim',
  greeting: 'world',
})
// "Hej, world"
```

Each locale becomes a chunk of compiled functions. Lazy-loaded. Cached. Fast.

---

## Comparison

|                                | yapyak | next-intl | react-intl | i18next |
|--------------------------------|--------|-----------|------------|---------|
| Source-string-as-key           | ✅      | ❌         | ❌          | ❌       |
| File-scoped translations       | ✅      | ❌         | ❌          | ❌       |
| AOT-compiled messages          | ✅      | ❌         | ❌          | ❌       |
| Type-safe params from source   | ✅      | partial   | ❌          | ❌       |
| Built-in AI translation        | ✅      | ❌         | ❌          | ❌       |
| Auto-translate on save (HMR)   | ✅      | ❌         | ❌          | ❌       |
| Zero-config SSR                | ✅      | ❌         | ❌          | ❌       |
| One package                    | ✅      | ✅         | ❌          | ❌       |

---

## API

### `yapyak()` plugin options

```ts
yapyak({
  defaultLocale: 'en',
  locales: ['en', 'sv', 'de'],
  localesDir: 'locales',           // where translations live
  cookie: 'locale',                // cookie name for locale persistence
  acceptLanguage: true,            // fall back to Accept-Language header
  ai: {
    provider: 'anthropic',         // | 'openai' | (input) => Promise<string>
    apiKey: env.ANTHROPIC_API_KEY,
    model: 'claude-sonnet-4-6',
    voice: 'Casual and direct.',
    glossary: { 'Save': { sv: 'Spara' } },
    autoTranslate: true,
  },
})
```

### Runtime API

```ts
import {
  t,                  // translate
  setLocale,          // change locale + persist cookie
  useLocale,          // [locale, setLocale] hook
  getLocale,          // current locale (server or client)
  IntlProvider,       // wraps your app
  messages,           // raw compiled messages, keyed by locale
} from 'yapyak';
```

### CLI

```bash
yapyak init                  # scaffold locales/ + tsconfig
yapyak extract               # sync JSON files with code
yapyak translate [--force]   # AI-fill missing translations
yapyak check [--write]       # validate (--write to auto-fix)
yapyak compile               # build static locale modules
```

---

## Status

Early. Working great in production for one personal site so far. Built for Vite + React + TanStack Start; adapters for SvelteKit, Remix, and Astro coming as people ask for them.

If you try it and something breaks, open an issue. If you try it and it's the best i18n DX you've used, tell someone.

---
title: FAQ
order: 4
---

Common questions about adopting yapyak.

## Does this work with many locales?

A chunk carries one variant of its own messages for each configured locale, not the whole application. For a route with thirty strings and twenty locales, that is six hundred entries: roughly the size of a small image, gzipped.

The cost scales with locale count, not with app size. Adding another route does not add weight to the route already on screen. For a handful to a few dozen locales, yapyak typically ships less per visited route than a lazy-loaded full-application catalog. Beyond that scale, around a hundred locales, an async per-locale catalog can outweigh the per-chunk inlining. yapyak does not aim to be best at hundred-locale interfaces.

Building the lazy-loading machinery that pays off at a hundred locales would tax every project with async catalogs, suspense boundaries, and locale-loading states. yapyak prefers not to make the 99% of applications pay complexity for the 1%.

The win at every scale yapyak targets is not bytes alone. It is the simpler runtime: no catalog request, no async boundary, no race condition on a fast switch.

## I'm already using i18next, FormatJS, or Lingui. How do I migrate?

There is no codemod today. A migration is a real rewrite: replace each `t('settings.profile.actions.save')` key with the literal at the call site, `t('Save changes')`, and let yapyak's compiler take over.

Existing translation values are not lost. Seed yapyak's `glossary` with preferred terms from the old catalog so the *translator* uses them on the first save. For a fresh project or a new feature branch, yapyak starts from zero.

## Does my source code get sent to OpenAI or Anthropic?

The *translator* sends the source string and the call-site context — component name, enclosing element, and a snippet of surrounding code — to whichever provider you configured. You bring the API key. yapyak does not relay through a hosted service.

How much context is sent is configurable. `context: 'none'` ships the source string only. `'minimal'` adds the component name and the enclosing element. `'rich'` includes the surrounding code snippet. Choose where on that axis the project sits based on what is acceptable to ship.

For environments where no provider call is acceptable, a custom *translator* replaces the provider entirely.

## Can I use my own model, an internal LLM, or no model at all?

Yes. `createTranslator()` from `@yapyak/translator` wraps any async function returning translated strings into a yapyak-compatible *translator*. A private model behind an internal endpoint, a queue that emails a human translator, a CLI prompt that asks for input — each is a function.

The built-in *translators* (`@yapyak/anthropic`, `@yapyak/openai`, `@yapyak/gemini`, `@yapyak/ollama`) are reference implementations on top of the same primitive.

Without any *translator*, locale entries stay as empty stubs in the repository. You fill them in, the coding agent fills them in, or a translator fills them in. The yapyak loop runs either way.

## What if the model hallucinates or drops a placeholder?

The *translator* prompt explicitly instructs the model: *"Preserve all {placeholder} tokens and ICU patterns exactly as written."* The constraint travels with every request. The compiler validates ICU syntax on every read, so structurally invalid output is rejected before reaching the application.

Semantic mistakes — a translation that is grammatically valid but wrong in tone or term — are why the loop ends in a Git diff. Locale files are reviewed in pull requests like any other code. `yapyak status` reports coverage; `yapyak check` exits non-zero when entries are missing, so review can be a merge requirement.

## How do I rename a message?

Change the source string at the same call site. yapyak detects the rename by position and migrates the existing translation. The old entry is removed on the next sync.

A write that would silently clear an in-use translation is refused at build, not after the loss. If the message moves to a different file, yapyak does not transplant the translation; the new file gets a fresh entry under the new file's context, which the *translator* re-translates on save.

## Source strings as keys — does that hold up at scale?

The concern is usually: what if "Save" appears in fifty components? Will they collapse into one translation?

No. Messages are scoped by file. Two identical source strings in different files are two distinct entries with separate translations. The component supplies the context that distinguishes them. The same word can be `Öppna` in a file browser (an action) and `Öppet` in a store hours badge (a state), because the files carry different surrounding code.

For terms that must stay consistent across the application — a product name, a key noun — the *translator*'s `glossary` enforces a fixed translation regardless of file. Local meaning and global consistency live in different places.

## Does yapyak work without Vite?

The save loop (extraction on change, HMR, locale file writing) runs in the Vite plugin today. No equivalent plugin exists for Webpack, Turbopack, esbuild, or Rspack.

The compiler is a separate package (`@yapyak/compiler`) and is not bound to Vite. A loader for another bundler is possible to build on top of it; it has not been built. Until then, yapyak is a Vite-first tool.

## How are plurals in languages with multiple plural rules handled?

yapyak uses ICU MessageFormat, which is built for the grammars real locales require. Whether a language has two plural forms (English) or six (Arabic, Welsh), each category expresses as a branch in the message:

```tsx
t('{count, plural, one {# książka} few {# książki} many {# książek} other {# książki}}', { count })
```

The compiler validates the syntax during the build. The runtime picks the right branch using CLDR's plural rules under the active locale. No special handling per language is needed.

## What about dates, numbers, and currencies?

ICU handles them directly inside the message:

```tsx
t('Total: {amount, number, ::currency/USD}', { amount: 19.99 })
t('Last seen {date, date, medium}', { date: new Date() })
```

The runtime uses `Intl.NumberFormat` and `Intl.DateTimeFormat` under the active locale, so `19.99` becomes `$19.99` in English, `19,99 $US` in French, and `19,99 $` in Swedish.

For formatting outside a `t()` call, the `format` namespace provides typed methods backed by the same `Intl` machinery:

```ts
import { format } from 'yapyak';

format.currency(19.99, 'USD');
format.date(new Date());
format.time(new Date());
format.number(1234567);
format.percent(0.42);
format.list(['Anna', 'Berit', 'Carl']);
format.relativeTime(-2, 'day');
```

Each method uses the active locale. `format.in('sv').currency(200, 'SEK')` scopes a single call to a fixed locale.

## Does this work with Server Components and RSC?

`t()` returns a string. Strings work in Server Components: the message is rendered server-side and included in the HTML response in the active locale. The SSR adapter resolves the locale on the request boundary and passes it to the renderer; the same compiled `_pick` calls run there as in a client component.

yapyak does not ship RSC-specific tooling. The compiled-into-chunks model fits Server Components by default because the locale variant is part of the chunk, not a separate catalog. Anything beyond that — RSC patterns that are still evolving in React — works to the extent any framework's i18n works there today.

## Does yapyak work in React Native?

Not today. The Vite plugin and the framework adapters target web applications, and there is no React Native runtime.

A React Native runtime is a deliberate next step, not a shipped feature.

## How does the *translator* handle many batch translations?

When you add a new locale or regenerate translations after a major source change, the *translator* receives every string that needs filling at once. yapyak batches these and runs the provider calls concurrently.

The defaults are twenty-five strings per call, five calls in flight. A backfill of a thousand strings runs as forty batches, eight rounds at five in parallel — a minute or two of provider time at typical model latencies.

```ts
anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  batchSize: 50,
  concurrency: 10,
})
```

Tune `batchSize` and `concurrency` against the provider's rate limits. Higher concurrency saturates faster; higher batch size reduces call count but grows each prompt.

For everyday save-loop work, batching is invisible: one string per save means one call. Batching matters when you regenerate or add a locale.

## Can I turn off save-time translation and run only the CLI?

Yes. Set `autoTranslateThreshold` to `0` in the config:

```ts
export default defineConfig({
  translator: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }),
  autoTranslateThreshold: 0,
});
```

The save loop now extracts new strings into locale files as empty stubs. Nothing is sent to the *translator* until you run `yapyak translate` explicitly.

The threshold also caps save-time translation when it is on. The default is twenty: a save that introduces twenty or fewer new strings translates them automatically; a save with more skips auto-translate and prints a reminder to run `yapyak translate`. The save loop stays fluid for everyday edits; large batches stay explicit.

## How do I translate `aria-label`, `title`, and other string-valued attributes?

`t()` returns a string. Any string-valued prop accepts it directly:

```tsx
<button aria-label={t('Close dialog')} title={t('Close')}>×</button>
<img alt={t('Profile photo')} src={src} />
<input placeholder={t('Search products')} />
```

No special API or wrapper is needed. Accessibility text, image alts, placeholder text, and any other attribute that takes a string works the same way component children do.

## How does yapyak compare to Crowdin, Phrase, or Lokalise?

These are not the same product. Hosted translation services optimize for translation teams: a dashboard where translators see strings in context, manage glossaries, review, and approve before strings ship. The application code points at a remote catalog.

yapyak optimizes for the development loop: translations appear in the running application during the same save that introduced the source string. Locale files live in the repository alongside the code. There is no dashboard, no separate billing relationship, no platform in the middle.

Pick a hosted service when a dedicated translation team owns the language and developers should not. Pick yapyak when translations belong with the code: visible in diffs, reviewable as pull requests, generated by the same model the team already uses for other code.

## How does yapyak work in a monorepo with multiple apps?

Each application has its own `yapyak.config.ts` and its own `locales/` directory. The Vite plugin runs in each application's dev server independently. Source strings extracted from one app's components do not leak into another's locale files.

For terms that must stay consistent across applications — a product name, a shared button label — define a shared glossary module and import it into each app's config. The same applies to voice rules.

For shared component libraries with their own `t()` calls, each library compiles its own translations as part of its build. An application importing the library uses the library's compiled output; it does not re-extract the library's strings.

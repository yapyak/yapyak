## Docs (guide site)

Rules for writing the user-facing guide at `docs/content/guide/*.md`. JSDoc/TSDoc rules live in [jsdoc.md](jsdoc.md); README rules live in [package-json.md](package-json.md).

### Voice

The guide is technical documentation, not a pitch. Every sentence must answer one of:

1. What does the API do?
2. How does it behave?
3. What problem does it solve?
4. What's the tradeoff?

If a sentence doesn't answer one of those, cut it. Don't try to repair it.

Start each page with what the thing is, followed by a code example. Show what the developer writes, what yapyak produces or compiles, and what problem it solves. Explain only what is needed.

Reference: Stripe API docs and the Postgres manual. Not startup landing pages.

### What to cut

Specific patterns that signal AI-generated marketing prose. Cut on sight:

- **Rule-of-three negation.** "Not X, not Y, not Z." Even when a positive frame is available.
- **Personification.** "The compiler knows / decides / handles." Tools don't know. State the mechanism.
- **"Lives in" / "sits at".** "The full type lives in X." Just say where it is.
- **Em-dash example lists.** "Locales — English, Swedish, French — all do X." Cut the list or use a real list.
- **Hedge words.** `just`, `simply`, `actually`, `really`, `basically`, `essentially`.
- **Restate after code.** "As you can see above..." Code speaks. Don't translate it back to prose.
- **Closers.** "The principle:" / "What this gives you is..." / "In other words..."
- **Openers.** "This page covers..." / "Let's explore..." / "In this section we'll..."
- **Reassurance.** "Don't worry, X is easy." "There's no need to..."
- **Comparisons as framing.** "Unlike X, yapyak..." Compare on demand, never as a section opener.
- **Marketing adjectives.** `powerful`, `seamless`, `intuitive`, `magic`, `effortless`, `just works`, `out of the box`.
- **Autocomplete reassurance.** "Your editor will autocomplete every option." TS users know.
- **"See also"-style trailing sections.** No `## See also`, no `## Where to go next`, no `## Further reading`.

### Before / after

The same idea, AI prose vs target voice:

> AI prose: yapyak's powerful save loop seamlessly translates your messages, ensuring you never have to worry about a missing translation again. The compiler knows what changed, what's new, and what needs to be retranslated — all without you lifting a finger.

> Target: On save, yapyak extracts new messages and writes them to your locale files. Without a translator, the value is an empty string.

Same information, no personification, no marketing, no reassurance.

### Vocabulary

These terms are locked. Don't substitute:

| Use | Not |
|---|---|
| source string | source text, source message |
| active locale | current locale, selected locale |
| compile time | build time |
| model | AI, LLM, AI model |
| empty stub | missing entry, blank value, placeholder |
| locale file | locale JSON, translations file |
| save loop | yapyak-specific, keep as-is |
| translator | the configured provider integration. Not a synonym for "model" |

`per-request` is hyphenated as an adjective ("a per-request locale"), unhyphenated as an adverb ("scoped per request").

### Headings

Short, factual nouns. Examples: `Messages`, `Context`, `ICU`, `Rich text`, `Bundles`, `Files`, `SSR`, `Save loop`, `Refactors`.

Not `How yapyak handles X`, `Working with Y`, `Getting started with Z`, `Best practices for W`.

One thesis per section. If a section has two, split it.

### Code blocks

- Filename labels go in the bracket fence: ` ```ts [vite.config.ts]`. Never use `// filename` comments inside the block.
- Single-property objects collapse to one line: `glossary: { cart: { sv: 'kundvagn' } }`. Multi-property objects spread one property per line.
- Sort object properties alphabetically. Exception: config files (`yapyak.config.ts`, `vite.config.ts`) keep author-intended order.
- ICU strings inside `t()` literals are not object literals — never edit or sort the content of `{count, plural, ...}`.
- JSX attribute expressions `attr={expr}` are not object literals — leave them as-is.
- Locale-file JSON is always path-nested: `{ "path/to/file.tsx": { "key": "value" } }`. Never flatten the path away.
- Prefer `ts` for API demonstrations. Use the framework-specific language (`tsx`, `vue`, `svelte`, `astro`) only when the example is a component.

### Framework switching

Examples that show framework-specific code (component shapes, not the API itself) use the Markdoc switch:

```
{% switch group="framework" %}
{% when value="react" %}
{% /when %}
{% when value="vue" %}
{% /when %}
{% when value="svelte" %}
{% /when %}
{% when value="astro" %}
{% /when %}
{% /switch %}
```

API-only examples that demonstrate `t()` or `format.*` stay as plain `ts` — no switch needed. Adding a switch where the code is identical across frameworks is boilerplate that bloats the page.

### Package-manager switching

CLI invocations switch on `group="pkg"` with `value="pnpm"|"npm"|"bun"`.

### Don't document `Intl`

`format.*` is a thin wrapper over `Intl`. The guide explains what yapyak adds — type safety, locale resolution, graceful fallback. For option enums (`currencyDisplay`, `numberingSystem`, `style`, `type`, etc.) link to MDN. Never enumerate `Intl` values inline.

For a related pattern: if the only thing a section says is "here are the values this option accepts", that section is `Intl` documentation. Cut it.

### Inline option enums

Avoid inline-comment enumerations like:

```ts
persistence: 'none',   // 'none' | 'cookie' | 'url' | 'local-storage'
```

For yapyak's own surface, use a table with `Field`, `Default`, `Description`. For `Intl` options, link to MDN. The inline-comment-as-documentation pattern collapses signal and is hard to scan.

### When refining text

Rebuild freely. Cut every repetition. Cut every preaching sentence. If a paragraph survives the 4-question test only after heavy patching, replace it; don't repair it.

Two specific failure modes to watch for:

- **Repeated information across sections.** If "every field is optional" appears in the intro and again in the quick reference, one of them is dead weight.
- **Missing concrete location.** If the page describes a file (`yapyak.config.ts`, `locales/en.json`), state where it lives — at the project root, in `localesDir`, etc.

### Public surface only

Only document symbols exported from the public package entry (e.g. `yapyak`, `@yapyak/react`, `@yapyak/vite`). Symbols exported from `/internal` subpaths are implementation detail for the compiler's emitted code — never reach for them in the guide. If a feature seems documentable but only exists via an internal export, that's a sign it isn't a feature yet.

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

### Locale codes in `{% output %}` examples

Use the short form (`en`, `sv`, `fr`, `de`, `ja`, `ar`, …), not the regional form (`en-US`, `sv-SE`). Locale variance in formatting examples doesn't depend on region — the short code is the right level of detail and keeps the docs consistent. The regional form is appropriate only when the example specifically demonstrates a regional difference (e.g. `en-US` vs `en-GB` date formats), which is rare.

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
- Locale-file JSON is always path-nested AND fully expanded — the inner `{ "key": "value" }` object always sits on its own lines, never on the same line as the path key:

  ```json
  {
    "src/components/empty-cart.tsx": {
      "Your cart is empty": "Din kundvagn är tom"
    }
  }
  ```

  Never collapse to `{ "src/...": { "Key": "Value" } }`. Never flatten the path away. The single-property-collapse rule does NOT apply to locale files — every translation key gets its own line under its source-path key.
- Prefer `ts` for API demonstrations. Use the framework-specific language (`tsx`, `vue`, `svelte`, `astro`) only when the example is a component.
- **Blank line between every top-level statement.** `const options = ...;` followed by `t('Choose one of {options}.', { options });` always has a blank line between them. Same for parallel declarations (`const claude = ...;` / `const gpt = ...;`). Same for repeated demo calls (`t('Save'); t('Save');`). The only exemption is consecutive `import`/`export` lines, which follow standard JS convention and stack without blanks.

### Comments inside code blocks

Code blocks contain code, not prose. The default is no comments. The narrow exceptions:

- **Type-check pass/fail markers.** `// ✓` and `// ✗` next to lines that demonstrate type-system behavior.
- **Diagnostic-utfall.** `// error: missing 'name'`, `// no other context for 'Open' anywhere`, `// narrowed to Currency`. What the compiler or editor *says* about the line, not what the author thinks about it.
- **Genuine code comments** that would appear in real production code (rare in docs examples).

Everything else moves out. Specifically:

- **Editorial labels** like `// English source: just one and other` or `// Swedish keeps the order` — these are prose. They live as a one-line lead-in before the code block, or as a sentence in the surrounding paragraph.
- **Filename markers** like `// sv.json — link wraps a different word` — use the bracket-fence label: ` ```json [locales/sv.json] `. The annotation moves to the lead-in sentence.
- **Compile-output annotations** like `// becomes: 'Spara ändringar'` or `// catalog entry: _date(...)` — split into a second code block with `compiles to:` (or similar) prose between, or describe the result in a sentence after the input block.
- **Variant labels** like `// Groq`, `// or with options:` — split into separate code blocks with a lead-in for each.
- **Result outputs** like `// 'apple, pear, and orange'` or `// ['zh-Hant-TW', 'zh-Hant', 'zh']` — use `{% output %}`.
- **Placeholder ellipses** like `// ...your root layout here...` — usually means the example is incomplete; either show real code or refactor the example so the omitted parts aren't relevant.

The principle: a comment in a code block must describe behavior of the code itself (what the type checker or runtime would say). If the comment is describing *the example* or *the docs reader's situation*, it's prose and belongs outside.

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

### `{% diagnostics %}` for type-check examples

When showing the type-checker's pass/fail behavior on multiple lines, use the `{% diagnostics %}` Markdoc tag instead of plain code blocks with `// ok` / `// error: ...` comments. The tag's renderer extracts the trailing comment from each line and renders a status indicator (✓/✗) plus the diagnostic message as proper UI chrome — the code stays clean, the diagnostic is visually scannable.

Syntax inside the tag:

```
{% diagnostics %}
t('Hi {name}', { name: 'Ada' });             // ok
t('Hi {name}', {});                          // error: missing 'name'
t('Hi {name}', { user: 'Ada' });             // error: 'user' is not assignable
t(`Hi ${name}`);                             // no
t('Hi {name}', { name });                    // yes
{% /diagnostics %}
```

Accepted annotations after the `//`:

- `ok` or `yes` → renders as ✓ (no message)
- `no` or `error` → renders as ✗ (no message)
- `ok: <message>` or `ok <message>` → ✓ with message
- `error: <message>` or `error <message>` → ✗ with message
- Any other free text → ✗ with the text as the message

Use plain code blocks (no `{% diagnostics %}`) when there's no pass/fail story — just demonstrating an API call. Use `{% diagnostics %}` only when the *contrast* between ok and error lines is the point.

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

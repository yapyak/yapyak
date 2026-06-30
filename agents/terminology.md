## Terminology

Locked vocabulary for the yapyak guide. Same concept, same word, every page. Add new terms here when introducing them. Never coin synonyms at write-time. Voice rules live in [[docs]].

### Source code and messages

| Concept | The word | Banned alternatives |
|---|---|---|
| The translation function | `t()` | the translate function, the t helper |
| The text passed to `t(...)` | `source string` (`the source` OK as shorthand after first use on the page) | source text, source message, source-language message, the English source, key, source key, "English" when language-agnostic |
| A `t()` invocation in code | `t() call` (or `the call` as shorthand) | callsite, invocation, call location, invocation site, t() spot |
| Position metadata (file/line/component) of a `t()` call | `call site` (two words, noun); `call-site` (hyphenated, adjectival) | callsite, the call's location |
| Code/structural context sent with a translation request | `call-site context` | surrounding context, code context, context payload, request context, translation hint |
| The TypeScript/JavaScript/component file containing `t()` calls | `source file` | the file (when ambiguous), your code file |
| Hand-editing locale files | `hand-edit` (verb, hyphenated) | manually edit, edit manually |

### Locales

| Concept | The word | Banned alternatives |
|---|---|---|
| The user's authoring language | `source language` in prose; `` `defaultLocale` `` for the API | default locale (lowercase prose), source locale, base locale, fallback locale |
| The currently-selected locale | `active locale` | current locale, selected locale, the locale (when ambiguous) |
| A locale yapyak is translating *into* | `target locale` (translation context) | destination locale, output locale |
| A locale that isn't the source | `non-default locale` (config/CLI-gating context) | non-source locale, target language |
| Per-call locale override | `forced locale` (via `t.in()`) | locked locale, scoped locale, fixed locale |
| The BCP 47 identifier | `BCP 47 tag` (first use); `locale code` or `locale tag` after | locale name, language code |
| Per-request qualifier | `per-request` (adjective: "a per-request locale"); `per request` (adverb: "scoped per request") | — |

### Translations

| Concept | The word | Banned alternatives |
|---|---|---|
| The JSON files under `locales/` | `locale file` (plural `locale files`) | locale JSON, translation files, i18n JSON, language files, translation JSON |
| An empty placeholder entry in a locale file | `empty stub` (`stub` OK as shorthand) | empty entry, missing entry, blank value, missing translation (only OK in CLI-gating context), placeholder, placeholder entry, untranslated stub |
| Auto-fill of empty stubs | `auto-translate` (verb); `auto-translation` (noun) | automatic translation, auto translation |
| The dev-time edit→save→translate cycle | `save loop` (or `the loop` as shorthand) | dev loop, translation loop, translation path, dev-time translation path |
| What the Vite plugin produces | `inlined object` / `inlined variants` | compiled translations, baked translations, baked-in translations |
| Prior translations passed to the AI as style reference | `translation examples` | translation memory, TM, style hints, references |
| Dev-time qualifier | `dev-time` (hyphenated, both noun and adjective) | at dev time, development-time, development time, dev mode |
| Compile-time qualifier | `compile-time` (hyphenated) | at compile-time, build-time (unless about the Vite build specifically) |

### Translators and providers

| Concept | The word | Banned alternatives |
|---|---|---|
| The AI doing translation | `model` | AI, LLM, AI model, AI service |
| The yapyak-provided translator implementations | `shipped translator` | built-in translator, yapyak-shipped translator, bundled translator |
| The vendor company / underlying API (Anthropic, OpenAI…) | `provider` (or `vendor` in error contexts only) | mixing `provider` with `translator` when meaning the binding |
| The configured translator implementations | `translator` (singular) / `translators` (plural) | provider, AI provider, model provider, AI service, bindings |
| Anthropic/OpenAI/Gemini/Ollama factory functions | `factory` (`the four factories`) | constructor, builder |
| User-built translator via `createTranslator` | `custom translator` | your translator (only as in-page shorthand) |

### Framework integration

| Concept | The word | Banned alternatives |
|---|---|---|
| React/Vue/Svelte/Astro adapter package | `adapter` (`framework adapter` acceptable on first mention) | wrapper, framework binding, binding, framework integration, plugin (the Vite *plugin* is the plugin) |
| The SSR adapter package per framework | `SSR adapter` (or `adapter` when context is clear) | middleware adapter, request handler |

### Compiler and runtime

| Concept | The word | Banned alternatives |
|---|---|---|
| yapyak's JS that ships to the browser | `the runtime` (or `yapyak's runtime` on first mention in a section); `i18n runtime` to highlight the bundled-JS aspect | the library, the engine |
| The TS→TS extraction/rewriting pipeline | `the compiler` | the transpiler, the parser (parser = sub-component) |
| The Vite plugin | `the yapyak plugin` (first use); `the plugin` after | yapyak Vite plugin (verbose) |
| The orphan cache file | `the orphan cache` (or `the cache` in nearby prose); `` `.yapyak/orphans.json` `` for the path | translation memory cache, the orphan file, translation cache, undo cache, graveyard, backup |

### Configuration

| Concept | The word | Banned alternatives |
|---|---|---|
| The yapyak.config.ts file | `` `yapyak.config.ts` `` (code-fenced); `the config` in prose | the configuration file, the config file |

### Diagnostics

| Concept | The word | Banned alternatives |
|---|---|---|
| A YAP-prefixed compile-time emission | `diagnostic` (umbrella); severity: `error` or `warning` | YAP error, YAP message, lint |
| Code identifier of a diagnostic | `` `YAPnnnn` `` (inline) | YAP code, diagnostic code, error code |

### Editor and CI

| Concept | The word | Banned alternatives |
|---|---|---|
| User's editor/IDE | `editor` (or `your editor`) | IDE |
| Continuous integration context | `CI` (uppercase, no expansion) | continuous integration, CI/CD, build pipeline (unless specifically about the pipeline) |

### Extending the table

When introducing a new domain term in any guide page:

1. Add it to the table above first.
2. Use the canonical form consistently across every page.
3. If two writers reach for two words for the same thing, this table picks the winner — extend the table, never coin a synonym in prose.
4. If a word you want already names another concept in any table, qualify the new term (`target locale` vs `target framework`); a bare ambiguous word is forbidden.

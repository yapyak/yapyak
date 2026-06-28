## Terminology

Locked vocabulary for the yapyak guide. Same concept, same word, every page. Add new terms here when introducing them. Never coin synonyms at write-time. Voice rules live in [[docs]].

### Source code and messages

| Concept | The word | Banned alternatives |
|---|---|---|
| The text passed to `t(...)` | `source string` (`the source` OK as shorthand after first use on the page) | `source message`, `source-language message`, `the English source` |
| A `t()` invocation in code | `t() call` (or `the call` as shorthand) | `callsite`, `invocation` |
| Position metadata (file/line/component) of a `t()` call | `call site` (two words, noun); `call-site` (hyphenated, adjectival) | `callsite`, `the call's location` |
| Code/structural context sent with a translation request | `call-site context` | `surrounding context`, `code context` |
| The TypeScript/JavaScript/component file containing `t()` calls | `source file` | `the file` (when ambiguous), `your code file` |
| Hand-editing locale files | `hand-edit` (verb, hyphenated) | `manually edit`, `edit manually` |

### Locales

| Concept | The word | Banned alternatives |
|---|---|---|
| The user's authoring language | `source language` in prose; `` `defaultLocale` `` for the API | `default locale` (lowercase prose), `source locale`, `base locale` |
| The currently-selected locale | `active locale` | `current locale`, `the locale` (when ambiguous) |
| A locale yapyak is translating *into* | `target locale` | `destination locale`, `output locale` |
| A locale that isn't the source | `non-default locale` | `non-source locale`, `target language` |
| The BCP 47 identifier | `BCP 47 tag` (first use); `locale code` or `locale tag` after | `locale name`, `language code` |

### Translations

| Concept | The word | Banned alternatives |
|---|---|---|
| An empty placeholder entry in a locale file | `empty stub` (`stub` OK as shorthand) | `empty entry`, `missing translation` (only OK in CLI-gating context), `placeholder entry`, `untranslated stub` |
| Auto-fill of empty stubs | `auto-translate` (verb); `auto-translation` (noun) | `automatic translation`, `auto translation` |
| The dev-time edit→save→translate cycle | `save loop` (or `the loop` as shorthand) | `dev loop`, `translation loop`, `translation path`, `dev-time translation path` |
| Dev-time qualifier | `dev-time` (hyphenated, both noun and adjective) | `at dev time`, `development-time`, `development time`, `dev mode` |
| Compile-time qualifier | `compile-time` (hyphenated) | `at compile-time`, `build-time` (unless about Vite build specifically) |

### Translators and providers

| Concept | The word | Banned alternatives |
|---|---|---|
| The yapyak-provided translator implementations | `shipped translator` | `built-in translator`, `yapyak-shipped translator`, `bundled translator` |
| The vendor company / underlying API (Anthropic, OpenAI…) | `provider` (or `vendor` in error contexts only) | mixing `provider` with `translator` when meaning the binding |
| Anthropic/OpenAI/Gemini/Ollama factory functions | `factory` (`the four factories`) | `constructor`, `builder` |
| Translator binding (plural) | `translators` (not `bindings`) | `translator binding`, `provider binding` |
| User-built translator via `createTranslator` | `custom translator` | `your translator` (only as in-page shorthand) |

### Framework integration

| Concept | The word | Banned alternatives |
|---|---|---|
| React/Vue/Svelte/Astro adapter package | `framework binding` (or `binding` as shorthand) | `framework adapter`, `framework integration` |
| The SSR adapter package per framework | `SSR adapter` (or `adapter` when context is clear) | `middleware adapter`, `request handler` |

### Compiler and runtime

| Concept | The word | Banned alternatives |
|---|---|---|
| yapyak's JS that ships to the browser | `the runtime` (or `yapyak's runtime` on first mention in a section); `i18n runtime` to highlight the bundled-JS aspect | `the library`, `the engine` |
| The TS→TS extraction/rewriting pipeline | `the compiler` | `the transpiler`, `the parser` (parser = sub-component) |
| The Vite plugin | `the yapyak plugin` (first use); `the plugin` after | `yapyak Vite plugin` (verbose) |
| The orphan cache file | `the orphan cache` (or `the cache` in nearby prose); `` `.yapyak/orphans.json` `` for the path | `translation memory cache`, `the orphan file` |

### Configuration

| Concept | The word | Banned alternatives |
|---|---|---|
| The yapyak.config.ts file | `` `yapyak.config.ts` `` (code-fenced); `the config` in prose | `the configuration file`, `the config file` |

### Diagnostics

| Concept | The word | Banned alternatives |
|---|---|---|
| A YAP-prefixed compile-time emission | `diagnostic` (umbrella); severity: `error` or `warning` | `YAP error`, `YAP message`, `lint` |
| Code identifier of a diagnostic | `` `YAPnnnn` `` (inline) | `YAP code`, `diagnostic code`, `error code` |

### Editor and CI

| Concept | The word | Banned alternatives |
|---|---|---|
| User's editor/IDE | `editor` (or `your editor`) | `IDE` |
| Continuous integration context | `CI` (uppercase, no expansion) | `continuous integration`, `CI/CD`, `build pipeline` (unless specifically about the pipeline) |

### Extending the table

When introducing a new domain term in any guide page:

1. Add it to the table above first.
2. Use the canonical form consistently across every page.
3. If two writers reach for two words for the same thing, this table picks the winner — extend the table, don't coin a synonym in prose.

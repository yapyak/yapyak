---
title: Diagnostics
order: 8
---

yapyak emits diagnostics with the prefix `YAP` followed by a four-digit identifier. **Errors** block the build. **Warnings** surface in the log but do not block. A handful of compile-time diagnostics are also surfaced as **TypeScript errors** at the call site — they appear under a red squiggle in the IDE before you save. Codes flagged with *“Also a TS error”* below behave that way.

Every diagnostic resolves to a docs URL of the form `https://yapyak.dev/d/yap0001`, which is appended to every emission. Click the link in your terminal or copy it into the browser to land on the entry for that code.

## How to read this page

Each entry below answers three questions in this order:

- **What happened** — the observable condition yapyak detected.
- **Why it matters** — the consequence if you leave it as-is.
- **Fix** — the concrete change. An example follows when the shape of the fix is not obvious from the description.

The sections group codes by subsystem. Numeric identifiers are sequential and reflect allocation order, so a section can hold non-contiguous numbers.

## Parser — compile-time

These fire when the yapyak compiler walks your code and finds a `t()` or `t.as()` call that cannot be extracted safely.

### YAP0001 — PARSER_NO_SOURCE

**Severity:** error.

**What happened.** `t()` or `t.as()` was called without a source string.

**Why it matters.** The source string *is* the extraction key. Without it, yapyak has nothing to add to the catalog and the call cannot be rewritten.

**Fix.** Pass the English source as the first argument (or as the second argument for `t.as()`).

```ts
t();                          // ✗ YAP0001
t.as('button');               // ✗ YAP0001 — context but no source

t('Save changes');            // ✓
t.as('button', 'Save');       // ✓
```

### YAP0002 — PARSER_TEMPLATE_LITERAL

**Severity:** error.

**What happened.** The source argument is a template literal with `${...}` interpolation.

**Why it matters.** The interpolated value changes at runtime, so the extracted key would change with it. Catalogs cannot be indexed by a moving target.

**Fix.** Replace the interpolation with an ICU placeholder and pass the value through `params`.

```ts
t(`Hi ${name}`);              // ✗ YAP0002
t('Hi {name}', { name });     // ✓
```

A template literal *without* interpolation (`` t(`Hello`) ``) is allowed — it has the same compile-time value as a plain string literal.

### YAP0003 — PARSER_EMPTY_SOURCE

**Severity:** error.

**What happened.** `t()` was called with an empty string.

**Why it matters.** An empty key cannot be looked up. It also gets in the way of TypeScript inference downstream.

**Fix.** Pass a non-empty English source.

> *Also a TS error.* The call `t('')` fails type-checking inline with `Invalid source: must not be an empty string`.

### YAP0004 — PARSER_MISSING_PARAM

**Severity:** error.

**What happened.** A placeholder in the source string has no matching key in the params object.

**Why it matters.** The placeholder will render as undefined at runtime, producing a malformed message.

**Fix.** Add the missing key. If you didn’t pass a params object at all, add one with the key.

```ts
t('Hi {name}', { count: 1 }); // ✗ YAP0004 — missing `name`
t('Hi {name}');               // ✗ YAP0004 — params object missing

t('Hi {name}', { name });     // ✓
```

### YAP0005 — PARSER_EXTRA_PARAM

**Severity:** warning.

**What happened.** The params object has a key that does not appear in the source string.

**Why it matters.** Dead keys hide stale or mistyped references. They often mean you renamed a placeholder in the source but forgot to update the params.

**Fix.** Remove the unused key, or add a matching `{key}` placeholder to the source.

```ts
t('Hi {name}', { name, age });  // ⚠ YAP0005 — `age` unused
t('Hi {name}, age {age}', { name, age });  // ✓
```

### YAP0006 — PARSER_DYNAMIC_PARAMS

**Severity:** warning.

**What happened.** Params were passed as a variable or with spread instead of as an inline object literal.

**Why it matters.** yapyak cannot statically verify which keys you’re passing, so it cannot check placeholder/param parity for that call. You lose the safety net of YAP0004 and YAP0005.

**Fix.** Pass the object inline at the call site. Build the values dynamically *into* the literal if you need to.

```ts
const p = { name: 'Alex' };
t('Hi {name}', p);                  // ⚠ YAP0006 — dynamic
t('Hi {name}', { ...defaults });    // ⚠ YAP0006 — spread

t('Hi {name}', { name: p.name });   // ✓
t('Hi {name}', { name: 'Alex' });   // ✓
```

## Placeholders — compile-time

These fire on the structure of ICU placeholders inside the source string, or on parity between source and translation.

### YAP0007 — PLACEHOLDER_MALFORMED

**Severity:** error.

**What happened.** A placeholder is syntactically malformed — typically a mismatched `{` / `}`, an unsupported quote inside, or a truncated format specifier.

**Why it matters.** Malformed ICU cannot be parsed, so the call cannot be rewritten at all.

**Fix.** Check that every `{` has a matching `}`. Check format-specifier syntax against the [ICU guide](./icu). Common slips: unbalanced braces inside `select`, `=N` written as `= N`, missing comma after the placeholder name.

### YAP0008 — PLACEHOLDER_MISSING_OTHER

**Severity:** error.

**What happened.** A `plural`, `selectordinal`, or `select` placeholder is missing the required `other` branch.

**Why it matters.** ICU requires `other` as the fallback when no other branch matches. Without it, the renderer has nothing to fall back to for unhandled values or locales with extra plural categories.

**Fix.** Add an `other {<text>}` branch as one of the alternatives.

```ts
t('{n, plural, one {# item}}', { n });                            // ✗ YAP0008
t('{n, plural, one {# item} other {# items}}', { n });            // ✓
```

> *Also a TS error.* A missing `other` branch fails type-checking inline with `Plural "{n}" is missing the required 'other' branch`.

### YAP0009 — PLACEHOLDER_UNSUPPORTED

**Severity:** error.

**What happened.** A placeholder uses an ICU feature yapyak does not support. The unsupported feature is named in the message.

**Why it matters.** yapyak supports a curated subset of ICU. The rest either has poor cross-locale support or would prevent compile-time inference of param types.

**Fix.** See [ICU § Limits](./icu#limits) for the full list of unsupported features and their idiomatic workarounds. Common substitutions: format the number outside the call with `format.number(...)`, or replace `selectordinal` exact-matches with a plain `select`.

> *Also a TS error.* Unknown ICU format keywords (e.g. `{x, plurral, ...}`) are caught inline with `Unknown ICU format "plurral" — expected one of: plural, selectordinal, select, number, date, time`. Other YAP0009 variants are caught only at build time.

### YAP0010 — PLACEHOLDER_KIND_MISMATCH

**Severity:** error.

**What happened.** A placeholder has a different kind in the translation than in the source — for example the source uses `{n, plural, ...}` but the translation has a plain `{n}`.

**Why it matters.** ICU placeholders aren’t just substitutions; their kind drives runtime behaviour (pluralization, number formatting). Mixing kinds across locales silently produces incorrect output.

**Fix.** Match the source’s placeholder kind in the translation.

```jsonc
// source: "{n, plural, one {# item} other {# items}}"
{ "sv": "{n} objekt" }                                                  // ✗ YAP0010
{ "sv": "{n, plural, one {# objekt} other {# objekt}}" }                // ✓
```

### YAP0011 — PLACEHOLDER_MISSING_IN_TARGET

**Severity:** error.

**What happened.** A placeholder appears in the source but is missing from the translation.

**Why it matters.** The dynamic value will never reach the rendered string for that locale.

**Fix.** Add the placeholder to the translation. If you intentionally don’t want the value in this locale, restructure the source — translations cannot subtract data.

### YAP0012 — PLACEHOLDER_MISSING_IN_SOURCE

**Severity:** error.

**What happened.** A placeholder appears in the translation but does not exist in the source.

**Why it matters.** No value is passed for it, so it renders as undefined.

**Fix.** Remove the extra placeholder from the translation, or add it to the source and pass a value at the call site.

### YAP0038 — PLACEHOLDER_BRANCH_MISSING_IN_TARGET

**Severity:** error.

**What happened.** A `select` placeholder branch in the source is missing from the translation.

**Why it matters.** `select` branches are domain-meaningful (e.g. `{theme, select, dark {…} light {…} other {…}}` — `dark` and `light` are values your code passes in). Unlike `plural` categories, they aren’t locale-rule-driven. A translation that drops one will render the fallback `other` branch when that value is passed, hiding the intended copy.

**Fix.** Include every source `select` branch in the translation. If a locale genuinely wants the same text for two branches, repeat the text:

```jsonc
// source: "{theme, select, dark {Dark mode} light {Light mode} other {System}}"
{ "sv": "{theme, select, dark {Mörkt läge} light {Ljust läge} other {System}}" }
```

`plural` and `selectordinal` branches are NOT subject to this check — locales legitimately have different plural categories (Polish needs `one`, `few`, `many`, `other`; Arabic adds `zero` and `two`). Those are governed by [YAP0008](#yap0008-—-placeholder_missing_other) which only enforces the `other` fallback.

## Catalog — locale files

These fire when yapyak reads your locale files and finds a structural problem.

### YAP0013 — CATALOG_INVALID_SHAPE

**Severity:** error.

**What happened.** A locale-file entry is not in the expected shape.

**Why it matters.** Locale files are typed: under each path key, the value must be an object mapping source strings to translations (or to context-keyed objects). Anything else cannot be loaded.

**Fix.** The diagnostic message names the offending location. Make sure each path key maps to an object, each source maps to either a string or a context-keyed object, and every leaf is a string.

```jsonc
{
  "src/Button.tsx": {
    "Save": "Spara",                  // ✓ simple
    "Open": {                         // ✓ context-keyed
      "button": "Öppna",
      "badge":  "Öppen"
    }
  }
}
```

### YAP0014 — CATALOG_UNSAFE_PATH

**Severity:** error.

**What happened.** A path key in the locale file is unsafe — typically because it is absolute, uses backslashes, or contains a `..` segment.

**Why it matters.** Path keys are interpreted relative to the project root. Anything that escapes the root could cause writes outside the project, or could collide on case-insensitive file systems.

**Fix.** Use relative POSIX-style paths with no `..` segments. Convert `src\\Foo.tsx` to `src/Foo.tsx`; rewrite `../shared/Bar.tsx` so the key sits under the project root.

### YAP0015 — CATALOG_NOT_NFC

**Severity:** error.

**What happened.** A translation string is not in Unicode NFC normalization form.

**Why it matters.** Different normalization forms compare unequal as JavaScript strings even though they look identical. Mixing forms breaks dedup, cache lookups, and round-tripping.

**Fix.** Normalize the string to NFC before committing. Most editors do this automatically; if not, run `"...".normalize('NFC')` once and replace the value.

### YAP0016 — CATALOG_INVALID_JSON

**Severity:** error.

**What happened.** A locale file is not valid JSON. The parser’s error message is included.

**Why it matters.** The file cannot be loaded at all, so every translation in that locale falls back to the source.

**Fix.** Open the file, follow the parser’s line/column hint, and fix the JSON. Common slips: trailing commas, unescaped quotes inside string values, single quotes instead of double quotes.

## Context — `t.as()`

These fire on the disambiguating context argument of `t.as()`.

### YAP0017 — CONTEXT_NOT_LITERAL

**Severity:** error.

**What happened.** The `context` argument to `t.as()` is not a static string literal.

**Why it matters.** Context is part of the extraction key. A dynamic value would produce a different key on every render and defeat disambiguation entirely.

**Fix.** Pass a literal string.

```ts
t.as(prefix, 'Open');         // ✗ YAP0017
t.as('button', 'Open');       // ✓
```

### YAP0018 — CONTEXT_MIXED_USAGE

**Severity:** error.

**What happened.** The same source string is used with both `t()` and `t.as()` in the same file.

**Why it matters.** The bare `t()` call has no context, while the `t.as()` call does. They extract to different entries but render in the same UI surface — translators have no way to know they’re distinct.

**Fix.** Pick one form for every occurrence of that source in the file. Either annotate the bare call with `t.as(...)`, or drop `t.as()` from the others if no disambiguation is needed.

```ts
t('Open');                    // ✗ YAP0018
t.as('button', 'Open');       //   together with `t('Open')` above

t.as('badge', 'Open');        // ✓ all uses carry a context
t.as('button', 'Open');       // ✓
```

### YAP0019 — CONTEXT_UNUSED

**Severity:** warning.

**What happened.** A `t.as()` call exists but no other occurrence of that source in the file needs disambiguation.

**Why it matters.** Without a sibling occurrence, the context has nothing to disambiguate from. It just bloats the catalog with an unused key.

**Fix.** Drop the `t.as(...)` and call `t()` instead. Keep `t.as()` only when you genuinely have two or more sites that mean different things.

```ts
t.as('button', 'Save');       // ⚠ YAP0019 — no other "Save" in this file
t('Save');                    // ✓
```

### YAP0020 — CONTEXT_DYNAMIC_CALL

**Severity:** error.

**What happened.** A modifier (`t.as` or `t.in`) was captured in a variable, returned, or passed as an argument instead of being used inline.

**Why it matters.** Modifiers carry compile-time information about the call shape. The compiler can rewrite inline chains but cannot follow a captured chain across a runtime boundary.

**Fix.** Use modifiers inline at the call site. Either call them directly, or chain them inline.

```ts
const sv = t.in('sv');                 // ✗ YAP0020 — chain captured
sv.as('button', 'Save');

t.in('sv', 'Save');                    // ✓ inline call
t.in('sv').as('button', 'Save');       // ✓ inline chain
```

## Runtime — initialization and SSR

These fire at runtime when the library finds itself in a state the host setup should have prevented.

### YAP0021 — RUNTIME_NOT_INITIALIZED

**Severity:** error (thrown).

**What happened.** A yapyak runtime call ran without the build-tool plugin having rewritten it.

**Why it matters.** yapyak’s runtime is not a fallback translator. Every `t()` call must be rewritten at build time. If the plugin is missing or misconfigured, calls reach a stub that throws.

**Fix.** Install and register the matching build-tool plugin for your bundler (`@yapyak/vite`, `@yapyak/astro`, `@yapyak/sveltekit`, …) and rebuild. If the error appears only in tests, register the plugin in the test setup as well.

### YAP0022 — RUNTIME_SSR_LEAK_RISK

**Severity:** warning.

**What happened.** `getLocale()` ran on the server and fell back to the shared module-global locale because no per-request locale was bound.

**Why it matters.** Module-global state is shared across concurrent requests on the same Node.js process. One request’s `setLocale` can leak into another request’s render.

**Fix.** Register the host-integration middleware for your framework (`@yapyak/sveltekit`, `@yapyak/astro`, `@yapyak/tanstack-start`, …). The middleware binds the locale per request through `AsyncLocalStorage`, so `getLocale()` is request-scoped instead of process-scoped.

## Persistence

These fire from the persistence layer that backs `setLocale` and `getLocale`.

### YAP0023 — PERSISTENCE_COOKIE_WRITER_MISSING

**Severity:** warning.

**What happened.** `setLocale()` was called server-side with persistence `cookie`, but no response writer was bound for the current request.

**Why it matters.** The locale was updated in memory but the cookie was not written, so the next request will not remember the choice.

**Fix.** Install the matching adapter middleware (`@yapyak/astro`, `@yapyak/sveltekit`, `@yapyak/tanstack-start`, …). It binds a writer onto the request scope so cookie writes land on the outgoing response.

### YAP0024 — PERSISTENCE_LOCAL_STORAGE_SSR_SKIPPED

**Severity:** warning.

**What happened.** `setLocale()` ran on the server with persistence `local-storage`.

**Why it matters.** `localStorage` is browser-only. The in-memory locale changes, but nothing is persisted, so the client will re-hydrate to whichever locale it had before.

**Fix.** Use persistence `cookie` for SSR-compatible locale switching, or move the `setLocale()` call to a client-only path (an event handler, a `useEffect`, …).

### YAP0025 — PERSISTENCE_LOCAL_STORAGE_WRITE_FAILED

**Severity:** warning.

**What happened.** `setLocale()` attempted to write to `localStorage` and the call threw.

**Why it matters.** The in-memory locale was updated but will not survive a reload. Common causes: quota exceeded, Safari private mode, storage disabled, or a stricter privacy extension.

**Fix.** Catch this as a soft failure. If reliable persistence is required, switch to persistence `cookie`, which has none of these constraints.

### YAP0026 — PERSISTENCE_URL_SKIPPED

**Severity:** warning.

**What happened.** `setLocale()` was called with persistence `url`.

**Why it matters.** With URL persistence, the URL is the source of truth. Calling `setLocale()` directly cannot rewrite history without going through the router, so the call is ignored.

**Fix.** Drive locale switches through router navigation — push or replace a URL that includes the new locale segment. The persistence layer reads it back on the next render.

## Locale state

These fire from the `setLocale` / `getLocale` runtime when an operation cannot be carried out as requested.

### YAP0027 — LOCALE_LISTENER_THREW

**Severity:** warning.

**What happened.** A subscriber registered with `subscribeLocale` threw an exception during notification.

**Why it matters.** yapyak swallows the exception so the remaining subscribers still run, but the failing subscriber’s side effect did not happen.

**Fix.** Inspect the subscriber referenced in the log. Wrap fragile work in a try/catch inside the subscriber, or fix the underlying cause.

### YAP0028 — LOCALE_SET_IGNORED

**Severity:** warning.

**What happened.** `setLocale("X")` was called with a value that is not in the configured locales list.

**Why it matters.** Switching to an unsupported locale would crash translations. The call is ignored and the current locale stays.

**Fix.** Verify the value against the `locales` config. If the locale is genuinely supported, add it to the config (and ship a locale file for it).

### YAP0029 — LOCALE_SET_SSR_LEAK_RISK

**Severity:** warning.

**What happened.** `setLocale()` ran on the server with persistence `none`.

**Why it matters.** Without persistence, the only thing `setLocale` can do server-side is mutate the shared module-global locale — which leaks across concurrent requests.

**Fix.** Configure `cookie` or `url` persistence so per-request scopes carry the locale, or drive locale switches through router navigation only.

### YAP0030 — LOCALE_FORCED_INVALID

**Severity:** warning.

**What happened.** A locale was forced (via `t.in('xx', ...)` or `format.in('xx').number(...)`) with a value that is not a valid BCP 47 language tag.

**Why it matters.** The host `Intl` would reject the tag at runtime. yapyak falls back to the default locale so the call still produces output.

**Fix.** Use a valid BCP 47 tag. Examples: `sv`, `sv-FI`, `en-GB`. Avoid underscores, double-check casing on the region subtag (`SE`, not `se`).

## Catalog — runtime read

These fire when the runtime tries to read a locale or orphan-cache file.

### YAP0031 — CATALOG_LOCALE_FILE_CORRUPT

**Severity:** warning.

**What happened.** A locale file failed to read or parse at runtime.

**Why it matters.** All translations for that locale fall back to the source string.

**Fix.** The diagnostic includes the underlying cause. Common causes: invalid JSON (run the file through a formatter), file permissions, file deleted between build and load.

### YAP0032 — CATALOG_ORPHAN_CACHE_CORRUPT

**Severity:** warning.

**What happened.** The orphan cache file failed to read or parse.

**Why it matters.** Orphaned translations (translations whose source no longer exists in the code) won’t be preserved across this run. They might be re-extracted as new entries the next time you rename something back.

**Fix.** Delete the orphan cache file and let yapyak rebuild it on the next compile. If the corruption keeps recurring, it usually indicates a crash during a previous write — check disk space and process kill signals.

## Translator — runtime

These fire from `createTranslator()` when the user-supplied translate function returns something unexpected.

### YAP0033 — TRANSLATE_CHUNK_FAILED

**Severity:** warning.

**What happened.** A single batch chunk failed during a translate run. yapyak kept the other chunks and returned partial results.

**Why it matters.** The items in the failed chunk have no translations. They render as the source string until the next translate run picks them up.

**Fix.** Inspect the underlying error in the diagnostic’s `cause` field. Common causes: rate limit hit, network error, malformed response from the upstream model. Retry with backoff via `onChunkError`, or shrink `batchSize` to reduce the blast radius.

### YAP0034 — TRANSLATE_ENTRY_SHAPE_INVALID

**Severity:** warning.

**What happened.** A translator result entry was the wrong shape — typically an array, a string, or `null` instead of an object keyed by target locales.

**Why it matters.** yapyak dropped the entry and left its translations empty. The source still extracts; only its translations are lost for this run.

**Fix.** Make the upstream translator return one object per source, keyed by the requested target locales:

```ts
{
  "sv": "Spara",
  "fi": "Tallenna"
}
```

If you’re calling an LLM, tighten the system prompt or wrap the response in a schema-validated parser before returning it.

## Formatting — runtime

These fire from `format.number()` and `format.dateTime()` when the host `Intl` rejects an option value.

### YAP0035 — FORMAT_UNSUPPORTED_CURRENCY

**Severity:** warning.

**What happened.** `format.number({ style: 'currency', currency })` was called with a currency code that the host `Intl.NumberFormat` does not accept.

**Why it matters.** Without a fallback the call would throw `RangeError` and break rendering. yapyak instead renders the value as `<value> <code>` so the page keeps painting.

**Fix.** Use a valid ISO 4217 code (`EUR`, `SEK`, `USD`, …). If the value is dynamic, validate it before passing it through. yapyak deduplicates the warning per locale-and-code pair so the log stays usable.

### YAP0036 — FORMAT_UNSUPPORTED_UNIT

**Severity:** warning.

**What happened.** `format.number({ style: 'unit', unit })` was called with a unit the host `Intl.NumberFormat` does not accept.

**Why it matters.** Without a fallback the call would throw `RangeError`. yapyak instead renders the value as `<value> <unit>` so the page keeps painting.

**Fix.** Use a unit from `Intl.supportedValuesOf('unit')`, e.g. `kilometer`, `gigabyte`, `hour`. If the value is dynamic, validate it before passing it through. Deduplicated per locale-and-unit pair.

### YAP0037 — FORMAT_UNSUPPORTED_TIME_ZONE

**Severity:** warning.

**What happened.** `format.dateTime({ timeZone })` was called with a time zone the host `Intl.DateTimeFormat` does not accept.

**Why it matters.** Without a fallback the call would throw `RangeError`. yapyak instead formats the date in the system time zone so the page keeps painting.

**Fix.** Use a valid IANA tz database name (`Europe/Stockholm`, `UTC`, `America/New_York`, …). If the value is dynamic, validate it against `Intl.supportedValuesOf('timeZone')` before passing it through. Deduplicated per locale-and-zone pair.

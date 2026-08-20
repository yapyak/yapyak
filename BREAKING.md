# Breaking changes

Every breaking change before 1.0, newest first, with migration steps. yapyak is
pre-1.0: every release is `0.0.x`, and any of them may contain breaking changes.

From 1.0 breaking changes follow semantic versioning — they ship only in major
releases — and a dedicated changelog takes over. This file is then frozen.

An entry lands in the same change that introduces the break, under the version
that ships it. Releases are patch-only, so that version is the next patch;
confirm the heading against the Version Packages PR before releasing.

## 0.0.10

### `syncHtmlLang` renamed to `syncHtmlAttributes`, and it now also sets `dir`

The option kept `<html lang>` synced but left `<html dir>` alone, so
right-to-left locales rendered in the wrong direction unless the app set the
attribute itself. Enabled, it now sets both: `lang` to the active locale and
`dir` to the locale's text direction. The direction is also exported as
`getTextDirection` for server-side rendering, and the SvelteKit handle
replaces a `%yapyak.dir%` placeholder next to `%yapyak.lang%`.

**Before**

```ts
export default defineConfig({
  syncHtmlLang: true
});
```

**After**

```ts
export default defineConfig({
  syncHtmlAttributes: true
});
```

The default is unchanged: `false`. If the app manages `<html dir>` itself,
remove that handling or leave the option off.

### `preserveTranslationsOnRename` renamed to `preserveTranslationsOnSourceEdit`

The option governs one case only: a source string edited in place, where the
existing translation either follows the new string or the string is treated as
new. File moves and deleted-then-restored strings are covered by the orphan
cache regardless of the option, and "rename" read as a file rename — the one
case the option never touched.

**Before**

```ts
export default defineConfig({
  preserveTranslationsOnRename: true
});
```

**After**

```ts
export default defineConfig({
  preserveTranslationsOnSourceEdit: true
});
```

The default is unchanged: `true` without a translator, `false` with one.
Setting `preserveTranslationsOnRename` is a type error now; rename the key.

### `examples` moved from `defineConfig` to the translator

Everything that shapes what a translator receives — `context`, `voice`,
`glossary` — is a translator option. `examples` sat in `defineConfig`, and the
config layer reached into `translator.context` to pick its default. It is now
an option on the shipped translators and on `createTranslator`.

**Before**

```ts
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';

export default defineConfig({
  examples: 5,
  translator: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
});
```

**After**

```ts
import { defineConfig } from 'yapyak/config';
import { anthropic } from '@yapyak/anthropic';

export default defineConfig({
  translator: anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    examples: 5
  })
});
```

The default is unchanged: `5`, or `0` when the translator's `context` is
`'none'`. If you never set `examples`, nothing changes. Setting `examples` in
`defineConfig` is a type error now; move the value into the translator's
options.

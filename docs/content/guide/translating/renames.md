---
title: Renames
order: 9
---

Source code changes over time. yapyak follows the translations across rather than orphaning them.

## What yapyak tracks

Every translation has a position record:

- The source file path
- The source string itself
- The line and column of the `t()` call
- The disambiguation context, if any (`t.as('action', 'Open')`)

On save, the compiler builds a fresh set of records from the current code and compares them against your locale files and the cache in `.yapyak/`.

Three cases come up.

### Same source, new path

```
src/components/cart-button.tsx  becomes  src/components/checkout/cart-button.tsx
```

The string `'Add to cart'` still exists, in the same form, but in a different file. Locale files are keyed by source-file path, so a naive read would treat this as a removal plus an addition. The compiler matches the relocated string against the cache and rewrites the locale entry under the new path. The translation moves with it.

### Same path, edited source string

```diff
-t('Save')
+t('Save changes')
```

The translation for `'Save'` (`'Spara'` in Swedish) may or may not still be right for `'Save changes'` (`'Spara ändringar'`). Behavior is controlled by `preserveTranslationsOnRename`:

- `true`: keep the existing translation. Small edits like adding a word are unlikely to break it.
- `false`: treat the edit as a new string. The translation is regenerated (with a translator) or marked empty (without one).

The default flips based on whether a translator is configured:

- **Without a translator:** `true`. Manual translations aren't lost on small edits.
- **With a translator:** `false`. The translator refreshes anything that changed.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  preserveTranslationsOnRename: true
});
```

### Same source, deleted then re-added

A component gets deleted, and a few commits later the same markup comes back. The cache in `.yapyak/` keeps every translation yapyak has ever seen. When the source reappears, the cache restores its translation under the new path.

This works regardless of whether the path is the same. Copy the markup into a different file, give it a new name, and the translations follow.

## What yapyak doesn't do

A few cases yapyak deliberately doesn't handle:

- **Fuzzy matching across edits.** If you change `'Save'` to `'Saving...'`, that's a different string. yapyak doesn't guess that they mean the same thing.
- **Cross-project matching.** Each yapyak project tracks its own cache. Copying a component from project A to project B brings the source but not the translations.

## Restoring a lost translation

If the cache lost a translation you wanted (`.yapyak/` was deleted, the project was cloned fresh, the cache was corrupted), the source of truth is still your committed locale files. Pull the older version from git, paste the entry into your current `locales/<locale>.json`, save the file. yapyak picks up the new value through HMR.

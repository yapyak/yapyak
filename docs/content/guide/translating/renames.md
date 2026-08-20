---
title: Renames
order: 9
---

yapyak finds translations when you rename or move files, so they don't get lost.

## What yapyak tracks

For every `t()` call, yapyak saves its `line` and `column` in the source file. It also keeps an orphan cache (`.yapyak/orphans.json`), a history of every translation it has seen. On save, yapyak matches the current code against your locale files and the cache to follow renames.

### Same source, new path

```terminal
<d>src/components/cart-button.tsx</d>  becomes  <d>src/components/checkout/cart-button.tsx</d>
```

The string `'Add to cart'` still exists, in the same form, but in a different file. Locale files are keyed by source-file path, so a naive read would treat this as a removal plus an addition. The orphan cache restores the translation under the new path on the next save.

### Same path, edited source string

```diff
-t('Save')
+t('Save changes')
```

The translation for `'Save'` (`'Spara'` in Swedish) may or may not still be right for `'Save changes'` (`'Spara ändringar'`). Behavior is controlled by `preserveTranslationsOnSourceEdit`:

- `true`: keep the existing translation. Small edits like adding a word are unlikely to break it.
- `false`: treat the edit as a new string. The translation is regenerated (with a translator) or marked empty (without one).

The default flips based on whether a translator is configured:

- **Without a translator:** `true`. Manual translations aren't lost on small edits.
- **With a translator:** `false`. The translator refreshes anything that changed.

```ts [yapyak.config.ts]
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  preserveTranslationsOnSourceEdit: true
});
```

### Same source, deleted then re-added

A component gets deleted, and a few commits later the same markup comes back. The cache in `.yapyak/` keeps every translation yapyak has ever seen. When the source reappears, the cache restores its translation under the new path.

This works regardless of whether the path is the same. Copy the markup into a different file, give it a new name, and the translations follow.

## Restoring a lost translation

If the cache lost a translation you wanted (`.yapyak/` was deleted, the project was cloned fresh, the cache was corrupted), the source of truth is still your committed locale files. Pull the older version from git, paste the entry into your current `locales/<locale>.json`, save the file. yapyak picks up the new value through HMR.

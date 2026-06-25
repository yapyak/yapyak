---
title: Renames
order: 1
---

Source code moves around. A component file gets renamed; a string gets edited; the same markup gets copied to a new file. In every case, the translations attached to those strings still exist. Yapyak's job is to follow them across the change rather than orphan them.

## What yapyak tracks

Every translation has a position record:

- The source file path
- The source string itself
- The line and column where the `t()` call lives
- The disambiguation context, if any (`t.as('action', 'Open')`)

When you save, the compiler builds a fresh set of these records from the current code and compares them against what's in your locale files (and the cache in `.yapyak/`).

Three cases come up:

### Same source, new path

```
src/components/cart-button.tsx  becomes  src/components/checkout/cart-button.tsx
```

The string `'Add to cart'` still exists, in the same form, but it's in a different file. yapyak's locale files key entries by source-file path, so a naive read would treat this as a removal plus an addition. Instead, the compiler matches the relocated string against the cache and rewrites the locale-file entry under the new path. Your translation moves with it.

### Same path, edited source string

```ts
- t('Save')
+ t('Save changes')
```

This is the trickier case. The translation for `'Save'` (`'Spara'` in Swedish) may or may not still be right for `'Save changes'` (`'Spara ändringar'`). yapyak's behavior here is controlled by [`preserveTranslationsOnRename`](/guide/getting-started/configuration#preservetranslationsonrename):

- `true`: keep the existing translation. Useful for small edits where "save" becoming "save changes" is unlikely to break anything.
- `false`: treat it as a new string. The translation is regenerated (if you have a translator) or marked empty (if you don't).

The default flips based on whether you have a translator configured: `true` without one (so manual translations aren't lost on small edits), `false` with one (so the translator can refresh anything that changed).

### Same source, deleted then re-added

A component gets deleted, and a few commits later the same markup comes back. yapyak's cache in `.yapyak/` keeps a copy of every translation it's ever seen. When the source reappears, the cache restores its translation under the new path.

This works regardless of whether the path is the same. Copy the JSX into a different file, give it a new name, and the translations follow.

## What yapyak doesn't do

A few cases yapyak deliberately doesn't try to handle:

- **Fuzzy matching across edits.** If you change `'Save'` to `'Saving…'`, that's a different string. yapyak doesn't guess that they mean the same thing.
- **Semantic matching across locales.** If a translation is great but the source word was tweaked, the translation isn't propagated to a refreshed locale entry. It either stays (with `preserveTranslationsOnRename: true`) or it's regenerated (`false`).
- **Cross-project matching.** Each yapyak project tracks its own cache; copying a component from project A to project B brings the source but not the translations.

## Restoring a translation manually

If yapyak's cache lost a translation you wanted (`.yapyak/` was deleted, the project was cloned fresh, the cache was corrupted), the source of truth is still your committed locale files. Pull the older version from git, paste the relevant entry into your current `locales/<locale>.json`, save the file. yapyak picks up the new value through [HMR](/guide/advanced/hmr).

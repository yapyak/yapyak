---
title: clean
order: 6
---

```
yapyak clean [--write]
```

Finds translations whose source string no longer exists in your code. Orphans that linger in locale files after the component or string they belonged to was removed. By default it lists them; `--write` applies the deletion.

```bash
$ pnpm yapyak clean

  Locale cleanup

  ✗ 4 orphan source(s)

    sv. Src/components/old-button.tsx. Save changes
    de. Src/components/old-button.tsx. Save changes
    sv. Src/components/cart.tsx. Empty cart
    sv. Src/components/cart.tsx. Add to wishlist

  Run yapyak clean --write to remove these entries.
```

Dry-run by default. Read the output, sanity-check what's about to disappear, then run again with `--write`:

{% switch group="packageManager" %}
{% when value="pnpm" %}
```bash
pnpm yapyak clean --write
```
{% /when %}
{% when value="npm" %}
```bash
npx yapyak clean --write
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak clean --write
```
{% /when %}
{% /switch %}

## What counts as an orphan

A translation is an orphan when no `t()` call in your code points to it anymore. Three ways this happens:

1. **The source file was deleted.** The whole file's entry in the locale file has no corresponding code.
2. **The source string was removed.** A `t('Add to wishlist')` call was deleted from a file that still exists; the translation lingers.
3. **The source string changed.** A `t('Save')` call became `t('Save changes')`; if [`preserveTranslationsOnRename`](/guide/getting-started/configuration#preservetranslationsonrename) is `false`, the old "Save" translation is orphaned.

In every case, `clean` notices because it walks the codebase, builds the set of every live `t()` source, and compares it against what's in your locale files.

## Why it's dry-run by default

Deletions are irreversible (until you reach for git). yapyak surfaces orphans clearly so you can decide, rather than trimming files in the background. The dev-time save loop also leaves orphans alone for the same reason.

Removed translations stay recoverable from the cache in `.yapyak/` even after `clean --write`. If the source string reappears later, [renames behavior](/guide/translating/renames) restores it automatically.

## What `clean` doesn't do

- **It doesn't touch `.yapyak/`.** The translation memory cache stays intact, so removed translations remain recoverable.
- **It doesn't remove whole locale files.** A locale you no longer ship stays in `localesDir` until you delete its `<locale>.json` by hand.
- **It doesn't touch source files.** Only locale files are modified, only with `--write`.

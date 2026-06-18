---
title: clean
order: 5
---

```
yapyak clean [--write]
```

Finds translations whose source string no longer exists in your code — orphans that linger in locale files after the component or string they belonged to was removed. By default it lists them; `--write` applies the deletion.

```bash
$ pnpm yapyak clean

  Orphan translations

  sv/src/components/old-button.tsx
    "Save changes"      (file removed)
  de/src/components/old-button.tsx
    "Save changes"      (file removed)
  sv/src/components/cart.tsx
    "Empty cart"        (source string changed)
  sv/src/components/cart.tsx
    "Add to wishlist"   (source string removed)

  Run with --write to delete.
```

Dry-run by default. Read the output, sanity-check what's about to disappear, then run again with `--write`:

{% switch group="pkg" %}
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

## Why it's not on by default

Deletions are irreversible (until you reach for git). yapyak prefers to surface them clearly and let you decide, rather than quietly trimming files in the background. The dev-time save loop also leaves orphans alone for the same reason — if you remove a string, the translation stays around until you `clean` it.

This is especially relevant when:

- You're refactoring a component and might add the same string back in a moment
- A translation took a model a long time to get right, and you'd rather keep it for paste-back than re-generate it
- You're auditing a codebase and want to see what's stale before committing to remove it

For the in-between case (removed but recoverable), yapyak keeps a copy of every translation it's ever seen in `.yapyak/`. Even after `clean --write`, the translation is recoverable from the cache if the source string reappears later — [renames behavior](/guide/advanced/renames) restores it automatically.

## A typical use

Most projects run `clean` periodically — as part of a refactor branch, before a major release, or as a quarterly hygiene pass. It's not a compile-time thing; it's a deliberate trim.

{% switch group="pkg" %}
{% when value="pnpm" %}
```bash
git checkout -b clean-locales
pnpm yapyak clean --write
git diff locales/
git commit -am "trim orphan translations"
```
{% /when %}
{% when value="npm" %}
```bash
git checkout -b clean-locales
npx yapyak clean --write
git diff locales/
git commit -am "trim orphan translations"
```
{% /when %}
{% when value="bun" %}
```bash
git checkout -b clean-locales
bunx yapyak clean --write
git diff locales/
git commit -am "trim orphan translations"
```
{% /when %}
{% /switch %}

The diff is your safety net. Anything that shouldn't have gone, you can pick out before committing.

## In CI

`clean` is read-only without `--write`, so it's safe to run in CI as an informational step:

```yaml
- run: pnpm yapyak clean
```

This logs orphans without removing them — a heads-up that locale files have drifted from the code. For a strict policy that fails CI when orphans exist, parse the output yourself; `clean` doesn't gate on orphan count by default (since "we know but we'll clean later" is a common stance).

## What `clean` doesn't do

- **It doesn't touch `.yapyak/`.** The translation memory cache stays intact, so removed translations remain recoverable.
- **It doesn't remove whole locale files.** A locale you no longer ship stays in `localesDir` until you delete its `<locale>.json` by hand.
- **It doesn't touch source files.** Only locale file files are modified, only with `--write`.

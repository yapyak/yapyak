---
title: export
order: 6
---

```
yapyak export [--out <path>] [--split]
```

Writes a snapshot of your translations to a file (or a folder) that's easy to hand off to an external translator, a language consultant, or anyone else who needs to review or edit translations outside your repo.

{% switch group="pkg" %}
{% when value="pnpm" %}
```bash
pnpm yapyak export
```
{% /when %}
{% when value="npm" %}
```bash
npx yapyak export
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak export
```
{% /when %}
{% /switch %}

By default, writes a single JSON file at `yapyak-export.json` in your project root. The file contains every source string and its translations in every locale, in a flat structure that's friendly to read and to round-trip back in.

## Choosing where it goes

{% switch group="pkg" %}
{% when value="pnpm" %}
```bash
pnpm yapyak export --out translations.json
pnpm yapyak export --out ./hand-off/
```
{% /when %}
{% when value="npm" %}
```bash
npx yapyak export --out translations.json
npx yapyak export --out ./hand-off/
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak export --out translations.json
bunx yapyak export --out ./hand-off/
```
{% /when %}
{% /switch %}

If `--out` ends in a `/` or points at an existing directory, yapyak writes one file inside; otherwise, it treats it as the file path itself. Useful when you have a release process that expects a specific filename.

## Splitting by locale

For workflows where each language goes to a different translator or different reviewer, `--split` writes one file per locale instead of one combined file:

{% switch group="pkg" %}
{% when value="pnpm" %}
```bash
pnpm yapyak export --out ./hand-off/ --split
```
{% /when %}
{% when value="npm" %}
```bash
npx yapyak export --out ./hand-off/ --split
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak export --out ./hand-off/ --split
```
{% /when %}
{% /switch %}

Produces:

```
hand-off/
├── en.json
├── sv.json
├── de.json
└── ja.json
```

Each file contains only that locale's translations. The reviewer for `sv.json` doesn't see other languages, and you can hand the file to a translator without showing them your whole language map.

## What's in the file

The exported format is the same shape as your `locales/<locale>.json` files — keyed by source file path, then by source string:

```json
{
  "src/components/cart.tsx": {
    "Your cart is empty": "Din kundvagn är tom",
    "Browse products": "Bläddra bland produkter"
  },
  "src/components/checkout.tsx": {
    "Save changes": "Spara ändringar",
    "Cancel": "Avbryt"
  }
}
```

For [homonyms](/guide/writing/homonyms), the context appears nested under the source:

```json
{
  "src/components/dialog.tsx": {
    "Open": {
      "action": "Öppna",
      "status": "Öppen"
    }
  }
}
```

The combined export (without `--split`) matches the shape yapyak reads from your `locales/` directory, so a hand-off-then-import roundtrip is straightforward: paste the edited file back into `locales/<locale>.json` and you're done.

With `--split`, each per-locale file is wrapped with its locale key — `sv.json` contains `{ "sv": { "src/components/...": {...} } }`. Unwrap the locale key before pasting back into `locales/<locale>.json`.

## When you use `export`

Three common moments:

- **Sending translations to a professional service.** Some services (or freelancers) prefer a single file with structured context. Export it, send it, paste the result back.
- **Auditing.** Reading a flat dump is sometimes easier than navigating `locales/` in the IDE — especially for non-developer reviewers.
- **Backing up.** A pre-release snapshot you can roll back to if a `--force` translate goes wrong.

For most day-to-day work, `export` doesn't come up — translations live in your repo and travel with normal git commits. It's there for the workflows that step outside that path.

## What `export` doesn't do

- **It's not a build artifact.** The file `export` produces isn't what ships to your users — that goes through the [compiler](/guide/getting-started/how-it-works#what-gets-compiled). Don't try to use it as a runtime resource.
- **It doesn't re-export `.yapyak/` cache.** Only the current state of `locales/<locale>.json` is exported. Orphaned translations in `.yapyak/` are deliberately excluded.
- **It doesn't notify anyone.** It writes a file. Hooking it up to a notification or CI artifact is up to you.

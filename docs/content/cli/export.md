---
title: export
order: 7
---

```bash
yapyak export [<locale...>] [--out <path>] [--split]
```

Writes a snapshot of your translations as JSON. By default the snapshot goes to stdout, ready to pipe or redirect. Use `--out` to write a file, or `--out <dir> --split` to write one file per locale into a directory.

{% switch group="packageManager" %}
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

Without `--out`, the snapshot streams to stdout. Pipe it to another tool, or redirect to a file:

```bash
pnpm yapyak export > translations.json
pnpm yapyak export | jq '.sv'
```

## Filtering by locale

Pass one or more locale tags as positional arguments to limit the snapshot:

{% switch group="packageManager" %}
{% when value="pnpm" %}
```bash
pnpm yapyak export sv
pnpm yapyak export sv fr de
```
{% /when %}
{% when value="npm" %}
```bash
npx yapyak export sv
npx yapyak export sv fr de
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak export sv fr de
```
{% /when %}
{% /switch %}

Unknown locale tags fail with a non-zero exit code so a typo doesn't silently produce an empty snapshot.

## Writing to a file

```bash
pnpm yapyak export --out translations.json
```

`--out` is always treated as a file path. The directory is created if needed. Useful when a release process expects a specific filename.

## Splitting by locale

For workflows where each language goes to a different translator or reviewer, `--split` writes one file per locale into a directory. `--out` is required with `--split` and is treated as a directory:

```bash
pnpm yapyak export --out ./hand-off/ --split
```

Produces:

```terminal
<b>hand-off/</b>
├── en.json
├── sv.json
├── de.json
└── ja.json
```

Each file contains only that locale's translations. The reviewer for `sv.json` doesn't see other languages, and you can hand the file to a translator without showing them your whole language map.

## What's in the file

The combined export is keyed by **locale first**, then by source file path, then by source string:

```json
{
  "sv": {
    "src/components/cart.tsx": {
      "Your cart is empty": "Din kundvagn är tom",
      "Browse products": "Bläddra bland produkter"
    }
  },
  "de": {
    "src/components/cart.tsx": {
      "Your cart is empty": "Dein Warenkorb ist leer",
      "Browse products": "Produkte durchsuchen"
    }
  }
}
```

For [homonyms](/guide/writing/homonyms), the context appears nested under the source:

```json
{
  "sv": {
    "src/components/dialog.tsx": {
      "Open": {
        "action": "Öppna",
        "status": "Öppen"
      }
    }
  }
}
```

With `--split`, each file is wrapped with its locale key. `sv.json` contains `{ "sv": { "src/components/...": {...} } }`. To round-trip back into your repo, take the inner object (the value under the locale key) and paste it into `locales/<locale>.json`.

## What `export` doesn't do

- **It's not a build artifact.** The file `export` produces isn't what ships to your users. That goes through the [compiler](/guide/getting-started/how-it-works#what-gets-compiled).
- **It doesn't re-export `.yapyak/` cache.** Only the current state of `locales/<locale>.json` is exported. Orphaned translations in `.yapyak/` are deliberately excluded.

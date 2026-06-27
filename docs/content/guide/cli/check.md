---
title: check
order: 5
---

```
yapyak check
```

A CI-friendly verification step. Walks every source file, extracts every `t()` call, and confirms that:

- Every source string has a corresponding entry in every locale file
- Every entry is non-empty (no untranslated stubs)
- Every translation has the same ICU placeholders and structure as its source

Exits with code `0` if everything looks complete and consistent; exits non-zero otherwise. Suitable for gating a build pipeline.

{% switch group="packageManager" %}
{% when value="pnpm" %}
```bash
pnpm yapyak check
```
{% /when %}
{% when value="npm" %}
```bash
npx yapyak check
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak check
```
{% /when %}
{% /switch %}

## What it catches

The three failure modes:

### Missing translations

```
✗ Missing translations:
    sv/src/components/cart.tsx
      "Your cart is empty"
    de/src/components/cart.tsx
      "Your cart is empty"
      "Browse products"
```

A source string with no entry, or an empty stub, in one of your locales. The most common failure in projects that hand-write translations.

### Compile-time diagnostics

Any [`YAP-`](/reference/diagnostics) diagnostic that fires during parsing or extraction. These are the same ones you see in your editor during development. Malformed ICU, dynamic source strings, missing `other` plural branches, captured chains. `check` re-runs them in CI in case anything slipped through.

### ICU mismatches

A translation that has different placeholders or plural categories than its source. For example, if the source is:

```ts
t('You have {count, plural, one {# message} other {# messages}}', { count })
```

…and the Swedish translation drops the `{count}` placeholder:

```json
{ "Du har meddelanden" }
```

`check` flags it because the structure no longer matches. Usually a hand-edit slip; sometimes a translator mistake. Either way, it's caught before the build ships.

## In CI

The minimal CI step:

```yaml
- run: pnpm yapyak check
```

If you also auto-translate in CI, run `translate` first to fill in any empty stubs, then `check` to gate on completeness:

```yaml
- run: pnpm yapyak translate
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
- run: pnpm yapyak check
- run: pnpm build
```

## What `check` doesn't do

A few things `check` deliberately doesn't catch:

- **Translation quality.** A correct-but-bad translation passes.
- **Pluralization correctness in target locales.** If your Swedish translation declares only `one` and `other`, that passes. yapyak trusts the translator's judgment about which plural categories the language uses.
- **Stale translations.** If your source string changed and the translation is now outdated, `check` doesn't notice unless the structure (placeholders, tags) changed too. Use [renames behavior](/guide/translating/renames) to control this.

## Exit codes

- `0`: everything checks out.
- `1`: one or more issues found. The output lists them grouped by category.

The non-zero exit is what makes `check` useful in CI; the human-readable output is what makes the failures easy to fix.

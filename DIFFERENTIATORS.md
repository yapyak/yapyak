# Differentiators

Living doc of features yapyak ships that no other i18n library — in any framework — supports today. Use as source material for landing-page copy, READMEs, release notes, and reviewer talking points.

---

## Vue: ICU plurals and selects work directly in `{{ }}` mustaches

### The problem

Vue's template parser tokenizes `{{ ... }}` by scanning for the first `}}` it sees. It is not JS-aware. Any string literal containing `}}` inside a mustache breaks the parser.

ICU MessageFormat — the industry-standard plural and select syntax — terminates every nested branch with `}`. A plural call ends with `}}` (closing the last branch, then closing the placeholder). The conflict is structural, not edge-case:

```vue
<p>{{ $t('You have {count, plural, one {# msg} other {# msgs}}', { count }) }}</p>
```

Vue's parser sees the `}}` after `messages` as the end of the mustache. It truncates the expression to `$t('You have {count, plural, one {# msg} other {# msgs`, fails to parse the unterminated string, and emits:

```
Error parsing JavaScript expression: Unterminated string constant
```

This is a long-standing, well-known limitation in `@vue/compiler-sfc`.

### What every other library does about it

| Library | Workaround |
|---|---|
| **vue-i18n** | Lift expression to `<script setup>`, use `<i18n-t>` component, or use `v-text` attribute |
| **FormatJS** (Vue integration) | Same lift / wrap-in-component dance |
| **Lingui** | No Vue support |
| **react-intl-style libs ported to Vue** | Same workarounds |

Every library documents the workaround. Stack Overflow answers point at it. Users learn to lift.

### What yapyak does

yapyak's Vue processor ships its own JS-aware mustache scanner that replaces Vue's tokenizer for `{{ }}` extraction. It tracks:

- Single- and double-quoted string literals (with backslash escapes)
- Template literals with nested `${...}` (recursively)
- Block and line comments
- Brace depth for objects and call arguments

The first `}}` outside any of those contexts is the real end of the mustache.

The user writes the obvious code. It works:

```vue
<template>
  <p>{{ $t('You have {count, plural, one {# msg} other {# msgs}}', { count }) }}</p>
  <p>{{ $t('{theme, select, dark {Dark mode} other {Light mode}}', { theme }) }}</p>
  <p>{{ $t('You have {count, plural, one {# by {author}} other {# by {author}}}', { count, author }) }}</p>
</template>
```

No lifting. No `<i18n-t>` component. No `v-text` attribute. No documentation footnote.

For transformed output, catalog string literals encode `{` and `}` as the Unicode escapes `\u007b` and `\u007d` so Vue's downstream compiler — which has the same parser limitation — never sees raw braces inside strings. JS evaluates the escapes back to `{` and `}` at runtime, so values are byte-identical to the unescaped form.

### Why nobody else has copied this

It requires four moving parts:

1. A JS-aware mustache scanner (~80 LOC handling strings, template literals, comments, brace depth)
2. A two-stage fix: extraction (so the compiler sees the call) AND transformation (so the output is Vue-parseable)
3. Source-map-preserving offsets through both stages
4. Unicode-escape encoding for emitted catalog string literals

Any library that wants to add Vue ICU support without forcing users to lift has to solve all four. yapyak does today.

### Reviewer talking points

- "Vue's mustache parser is JS-naive. Every other i18n library makes users work around it. yapyak fixes it."
- "yapyak is the only i18n library where ICU plurals and selects work directly in Vue templates without lifting expressions or wrapping in components."
- "Same `$t` API everywhere — Vue, Svelte, React, Astro. No framework-specific component or directive required, in any framework."

### Tests that lock this in

`packages/compiler/src/parser/processor/vue.test.ts`:
- `extracts ICU plural in {{ }} without truncating on inner }}`
- `extracts ICU select in {{ }} without truncating on inner }}`
- `extracts nested ICU (plural with embedded placeholder)`
- `handles double-quoted string with }} inside`
- `handles template literal with ${} interpolation inside expression`
- `handles escaped quotes inside strings`
- `handles nested object literal in 2nd arg`
- `handles block comment containing }} inside expression`
- `handles multiple interpolations on the same line`
- `skips empty {{ }} and {{   }} interpolations`
- `handles object literal as standalone expression`

`packages/compiler/src/parser/transform.test.ts`:
- `escapes { and } in catalog strings so Vue/JSX parsers never see literal braces`
- `escapes { and } in elided single-locale literal (no placeholders)`

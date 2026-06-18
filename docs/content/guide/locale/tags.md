---
title: Tags
order: 4
---

A locale in yapyak is a BCP 47 language tag — the same standard `Intl` uses for its formatters. Tags are short, structured, and case-insensitive in canonical form. Anywhere you write a locale (the argument to [`yapyak add`](/guide/cli/add), the second to `setLocale()`, the first to `t.in()`), you write a BCP 47 tag.

{% switch group="pkg" %}
{% when value="pnpm" %}
```bash
pnpm yapyak add pt-BR zh-Hant-TW
```
{% /when %}
{% when value="npm" %}
```bash
npx yapyak add pt-BR zh-Hant-TW
```
{% /when %}
{% when value="bun" %}
```bash
bunx yapyak add pt-BR zh-Hant-TW
```
{% /when %}
{% /switch %}

## Shape

A BCP 47 tag has up to four parts, all separated by `-`:

```
<language>[-<script>][-<region>][-<variant>]
```

The language subtag is always present; the rest are optional and almost never all three. Examples from common apps:

| Tag | Meaning |
|---|---|
| `en` | English (no region) |
| `en-US` | American English |
| `en-GB` | British English |
| `sv` | Swedish |
| `pt` | Portuguese (no region) |
| `pt-BR` | Brazilian Portuguese |
| `pt-PT` | European Portuguese |
| `zh` | Chinese (no script or region) |
| `zh-Hant` | Traditional-script Chinese |
| `zh-Hant-TW` | Traditional Chinese, Taiwan region |
| `zh-Hans-CN` | Simplified Chinese, mainland China |

{% callout variant="info" %}
The canonical casing is `lowercase-Titlecase-UPPERCASE` (language lowercase, script title-case, region upper-case). yapyak normalizes input through `Intl.Locale` before matching, so `'EN-US'`, `'en-us'`, and `'en-US'` all match the same added locale — but write the canonical form on disk and in code.
{% /callout %}

## Fallbacks

When a translation isn't available for a more-specific tag but is available for a less-specific one, yapyak walks the chain from specific to general. `getLocaleFallbackChain()` exposes the order:

```ts
import { getLocaleFallbackChain } from 'yapyak';

getLocaleFallbackChain('zh-Hant-TW');
```

{% output %}
['zh-Hant-TW', 'zh-Hant', 'zh']
{% /output %}

```ts
getLocaleFallbackChain('pt-BR');
```

{% output %}
['pt-BR', 'pt']
{% /output %}

```ts
getLocaleFallbackChain('sv');
```

{% output %}
['sv']
{% /output %}

Each step drops one subtag from the right. The chain doesn't include your `defaultLocale` at the end; append it yourself when you need a full ordering.

In practice, you rarely need to call this directly — yapyak's runtime uses it internally during translation lookup. Reach for it when you're implementing custom locale negotiation, for example in a server middleware that compares an `Accept-Language` header against your shipped locales.

## Narrowing untrusted strings

Locales arriving from outside your code — URL parameters, form fields, request headers — are typed as `string` until you narrow them. yapyak exports two helpers:

### `isLocale`

Type guard for strings that are already canonical:

```ts
import { isLocale } from 'yapyak';

const input = readFromCookie();    // string
if (isLocale(input)) { setLocale(input);                // input narrowed to Locale }
```

### `parseLocale`

Normalizes BCP 47 casing through `Intl.Locale` before matching, so `'EN-us'` parses the same as `'en-US'`. Use this for inputs you can't fully trust to be canonical:

```ts
import { parseLocale } from 'yapyak';

const fromUrl = new URL(request.url).searchParams.get('lang') ?? '';

const locale = parseLocale(fromUrl) ?? defaultLocale;
```

Returns the matched `Locale` or `undefined` if no shipped locale matches even after normalization.

## Accept-Language and content negotiation

When the client sends an `Accept-Language` header (`sv,en;q=0.8,en-US;q=0.6`), yapyak parses it into an ordered list — most preferred first. If [`detectAcceptLanguage`](/guide/getting-started/configuration#detectacceptlanguage) is enabled in your config, the locale resolver walks that list and picks the first entry that matches a shipped locale (using the fallback chain above).

This is how a fresh visit gets a sensible default — the user's browser preferences take effect even before they've made an explicit choice or had their cookie set.

## Picking your locales

A few rules of thumb when deciding which locales to add:

- **Start coarse.** `'en'` and `'sv'` are usually enough — add the region (`'en-GB'`, `'en-AU'`) only if your translations genuinely differ.
- **Region matters for Portuguese, Spanish, Chinese.** `'pt-BR'` and `'pt-PT'` are different enough that you'll want both if you ship to both markets. Same for `'es-ES'` vs `'es-MX'`, `'zh-Hant'` vs `'zh-Hans'`.
- **The script subtag is a single decision per language.** If you ship Chinese, you decide whether it's `zh-Hans` or `zh-Hant` (or both); you don't ship plain `zh` and let it be ambiguous.
- **A user's browser language is hint, not law.** Always provide a way to override the detected locale — a switcher, a profile setting, a URL parameter.

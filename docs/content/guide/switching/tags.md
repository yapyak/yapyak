---
title: Tags
order: 4
---

A locale in yapyak is a BCP 47 language tag — the IETF standard `Intl` also uses (examples: `en`, `en-US`, `zh-Hant-TW`). Tags are short, structured, and case-insensitive in canonical form.

{% switch group="packageManager" %}
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
The canonical casing is `lowercase-Titlecase-UPPERCASE` (language lowercase, script title-case, region upper-case). yapyak normalizes input through `Intl.Locale` before matching, so `'EN-US'`, `'en-us'`, and `'en-US'` all match the same added locale. But write the canonical form on disk and in code.
{% /callout %}

## Fallbacks

When a more-specific tag has no translation but a less-specific one does, yapyak walks the chain from specific to general. [`getLocaleFallbackChain()`](/reference/yapyak/getLocaleFallbackChain) exposes the order:

```ts
import { getLocaleFallbackChain } from 'yapyak';

getLocaleFallbackChain('zh-Hant-TW');
// output: ['zh-Hant-TW', 'zh-Hant', 'zh']
```

```ts
getLocaleFallbackChain('pt-BR');
// output: ['pt-BR', 'pt']
```

```ts
getLocaleFallbackChain('sv');
// output: ['sv']
```

Each step drops one subtag from the right. The chain doesn't include your `defaultLocale` at the end; append it yourself when you need a full ordering.

In practice, you rarely need to call this directly. yapyak's runtime uses it internally during translation lookup. Reach for it when you're implementing custom locale negotiation, for example in a server middleware that compares an `Accept-Language` header against your shipped locales.

## Narrowing untrusted strings

Locales arriving from outside your code — URL parameters, form fields, request headers — are typed as `string` until you narrow them. yapyak exports two helpers:

### [`isLocale`](/reference/yapyak/isLocale)

Type guard for strings that are already canonical:

```ts
import { isLocale } from 'yapyak';

const input = readFromCookie();

if (isLocale(input)) {
  setLocale(input);
}
```

### [`parseLocale`](/reference/yapyak/parseLocale)

Normalizes BCP 47 casing through `Intl.Locale` before matching, so `'EN-us'` parses the same as `'en-US'`. Use this for inputs you can't fully trust to be canonical:

```ts
import { parseLocale } from 'yapyak';

const fromUrl = new URL(request.url).searchParams.get('lang') ?? '';

const locale = parseLocale(fromUrl) ?? defaultLocale;
```

Returns the matched `Locale` or `undefined` if no shipped locale matches even after normalization.

## Accept-Language and content negotiation

When the client sends an `Accept-Language` header (`sv,en;q=0.8,en-US;q=0.6`), yapyak parses it into an ordered list with the most preferred entry first.

If [`detectUserLocale`](/guide/getting-started/configuration#detectuserlocale) is enabled, the resolver walks that list and picks the first entry matching a shipped locale, using the fallback chain above.

This is how a fresh visit gets a sensible default. The user's browser preferences take effect even before they've made an explicit choice or had their cookie set.

## Picking your locales

A few rules of thumb when deciding which locales to add:

- **Start coarse.** `'en'` and `'sv'` are usually enough. Add the region (`'en-GB'`, `'en-AU'`) only if your translations differ.
- **Region matters for Portuguese, Spanish, Chinese.** `'pt-BR'` and `'pt-PT'` are different enough that you'll want both if you ship to both markets. Same for `'es-ES'` vs `'es-MX'`, `'zh-Hant'` vs `'zh-Hans'`.
- **The script subtag is a single decision per language.** If you ship Chinese, you decide whether it's `zh-Hans` or `zh-Hant` (or both); you don't ship plain `zh` and let it be ambiguous.
- **A user's browser language is hint, not law.** Always provide a way to override the detected locale. A switcher, a profile setting, a URL parameter.

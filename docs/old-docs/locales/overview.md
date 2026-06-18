---
title: Overview
order: 1
---

A locale tag tells yapyak which language, region, and variant to render. Every tag follows [BCP 47](https://www.rfc-editor.org/rfc/rfc5646.html), the same format the browser's `Intl` API expects.

```ts
import { t } from 'yapyak';

t.in('sv', 'Save changes');
t.in('pt-BR', 'Save changes');
t.in('zh-Hans-CN', 'Save changes');
```

## What yapyak accepts

The full BCP 47 grammar, including extlangs, multiple variants, extensions, and the 26 grandfathered tags. Yes, `i-klingon` parses.

| Tag | Means |
|---|---|
| `'en'` | English (generic) |
| `'sv'` | Swedish |
| `'pt-BR'` | Portuguese, Brazil |
| `'zh-Hans'` | Chinese, Simplified script |
| `'zh-Hans-CN'` | Chinese, Simplified, in China |
| `'de-CH-1996'` | German, Switzerland, post-1996 orthography |
| `'i-klingon'` | Klingon (a grandfathered tag) |

## Where validation runs

| Surface | Phase | If invalid |
|---|---|---|
| `yapyak add <code>` | CLI | Rejected with a suggestion |
| `defaultLocale` in `yapyak.config.ts` | Build start | Throws with a structured message |
| `t.in('xx', ...)` source argument | Build | [YPK101](../translations/diagnostics#ypk101) at the call site |
| `pick({ locale: 'xx' })` runtime option | Runtime | Warns, then falls back to `defaultLocale` |
| Locale files named `xx.json` | Build | Skipped, logged |

## Common mistakes

Lowercase region:

```diff
- t.in('en-us', 'Save changes')
+ t.in('en-US', 'Save changes')
```

Underscore separator:

```diff
- t.in('zh_CN', 'Save changes')
+ t.in('zh-CN', 'Save changes')
```

Language name instead of code:

```diff
- t.in('swedish', 'Save changes')
+ t.in('sv', 'Save changes')
```

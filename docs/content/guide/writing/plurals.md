---
title: Plurals
order: 3
---

ICU's `plural` format handles count-driven word changes inside a single message string. Six plural categories cover every language ICU supports.

```ts
t('You have {count, plural, one {# message} other {# messages}}', { count: 5 });
// output:
// en-US: 'You have 5 messages'
// sv-SE: 'Du har 5 meddelanden'
// ar-SA: 'تتوفّر لديك ٥ رسائل'
```

The model (or your translator) writes whichever branches that language needs. English only uses `one` and `other`; Arabic uses six. yapyak's runtime picks the right one based on the count and the locale's plural rules.

## The categories

ICU defines six plural categories:

| Category | Used by |
|---|---|
| `zero` | Latvian, Welsh, Arabic (cardinal: 0) |
| `one` | English, Swedish, Russian (cardinal: 1) |
| `two` | Welsh, Arabic, Hebrew (cardinal: 2) |
| `few` | Polish, Russian (cardinal: 2–4 in most Slavic languages) |
| `many` | Polish, Russian, Czech (cardinal: 0, 5+ for many Slavic languages) |
| `other` | Everywhere. The required fallback |

You only write the categories the source language uses. The model fills in the rest per locale when it translates.

English uses `one` and `other`:

```ts
t('{count, plural, one {# item} other {# items}}', { count: 1 });
```

Polish needs four branches:

```json [locales/pl.json]
{
  "{count, plural, one {# item} other {# items}}": "{count, plural, one {# rzecz} few {# rzeczy} many {# rzeczy} other {# rzeczy}}"
}
```

The `other` branch is required by ICU and by yapyak's compiler. Omitting it raises [`YAP0008`](/reference/diagnostics/YAP0008).

## The `#` substitution

Inside any plural branch, `#` renders the count itself, formatted using the locale's number rules. You almost always want it instead of repeating the parameter:

```ts
t('{count, plural, one {# message} other {# messages}}', { count: 1000 });
// output:
// en-US: '1,000 messages'
// sv-SE: '1 000 meddelanden'
```

It's the same as writing `{count, number}` in the same position, but shorter and idiomatic for plurals.

## Exact matches

When you want a different branch for an exact value. Say, "no messages" for zero. Use `=N`:

```ts
t('{count, plural, =0 {No messages yet} one {1 new message} other {# new messages}}', { count: 0 });
// output: 'No messages yet'
```

Exact matches are tried before category matches. They only match non-negative integers; for negative values or fractions, fall through to the categories.

## Nesting placeholders

A plural branch is a full message in its own right. You can nest more placeholders inside it:

```ts
t('{count, plural, one {# message from {sender}} other {# messages from {sender}}}', {
  count: 3,
  sender: 'Ada'
});
```

TypeScript still validates that every placeholder you reference is in the params object. `sender` would be required here.

## Ordinals (`selectordinal`)

For ordinal numbers ("1st", "2nd", "3rd"), use `selectordinal` instead of `plural`. The categories are the same, but the rules differ. English uses `one` for "1st", `two` for "2nd", `few` for "3rd", and `other` for everything else:

```ts
t('{place, selectordinal, one {#st} two {#nd} few {#rd} other {#th}} place', { place: 3 });
// output: en-US: '3rd place'
```

In a language without ordinal suffixes (Swedish, French), only `other` is used. The translator (or the model) collapses the branches naturally.

## Number and date sub-formats

Plurals are one ICU sub-format. Three others appear inside the message string:

### Numbers

```ts
t('Your balance is {amount, number, currency USD}', { amount: 99.95 });

t('You scored {pct, number, percent}', { pct: 0.42 });

t('Total {n, number, integer}', { n: 1234.5 });
```

Styles: `decimal`, `integer`, `percent`, `currency <ISO 4217>`. yapyak's compiler validates the style at compile time.

### Dates and times

```ts
t('Updated {when, date, long}', { when: new Date() });

t('Doors open at {when, time, short}', { when: meeting });
```

Styles: `short`, `medium`, `long`, `full`. The placeholder accepts `Date` or a millisecond timestamp.

For values that don't belong inside a message, see the [`format` namespace](/guide/formatting/numbers) instead. For branching on a string value rather than a number, see [Selects](/guide/writing/selects).

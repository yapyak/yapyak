---
title: Params
order: 2
---

When a message contains values that change at runtime, you write them as named placeholders in the source string and pass them in as a second argument.

```ts
t('Hi {name}', { name: 'Ada' });
// output:
// sv-SE: 'Hej Ada'
// fr-FR: 'Bonjour Ada'
```

The placeholder syntax is curly braces around the parameter name. The locale file keeps the same placeholders, so translators (human or model) know exactly where the value lands inside each language's sentence.

```json [locales/sv.json]
{
  "src/components/greeting.tsx": {
    "Hi {name}": "Hej {name}"
  }
}
```

## What TypeScript knows

The parameter object's shape is inferred from the source string. Add a placeholder and TypeScript expects you to pass it in. Pass the wrong name and you get an error before the build runs:

{% diagnostics %}
t('Hi {name}', { name: 'Ada' });             // ok
t('Hi {name}', {});                          // error: missing 'name'
t('Hi {name}', { user: 'Ada' });             // error: 'user' is not assignable
t('Hi {name}, {greeting}', { name: 'Ada' }); // error: missing 'greeting'
{% /diagnostics %}

Simple placeholders accept `string | number`. They're rendered as their string form. For richer formatting, use [number](/guide/writing/plurals#numbers), [date](/guide/writing/plurals#dates-and-times), or [list](/guide/formatting/lists) sub-formats inside the placeholder.

## Multiple placeholders

Order doesn't matter. The parameter object is keyed by name, not position. A translation can reorder placeholders freely to fit each language's grammar:

```ts
t('You have {count} messages from {sender}', {
  count: 3,
  sender: 'Alex'
});
```

Swedish keeps the order:

```json [locales/sv.json]
{
  "You have {count} messages from {sender}": "Du har {count} meddelanden från {sender}"
}
```

Japanese reorders naturally:

```json [locales/ja.json]
{
  "You have {count} messages from {sender}": "{sender}から{count}件のメッセージがあります"
}
```

This is one of the quietly important things about a placeholder-based system: the translator (or the model) is free to reshape the sentence as long as every placeholder name shows up.

## Inline literals only

The second argument has to be an inline object literal. yapyak's compiler reads it directly to check that every placeholder is satisfied; if it's a variable, the check can't happen:

{% diagnostics %}
t('Hi {name}', { name: 'Ada' });             // ok
t('Hi {name}', { name });                    // ok: shorthand still parses
{% /diagnostics %}

```ts
const params = { name: 'Ada' };
```

{% diagnostics %}
t('Hi {name}', params);                      // error: dynamic params
{% /diagnostics %}

This catches the most common mistake people make when they're used to other i18n libraries. Passing a pre-built object full of optional fields. The compiler requires every translation site to be statically inspectable.

{% callout variant="info" %}
The same constraint applies to the source string itself. `t(someVariable)` and `` t(`Hi ${name}`) `` both raise a diagnostic at compile time. yapyak can only extract what it can see in the source code; anything dynamic should be a placeholder, not a string concatenation.
{% /callout %}

## When values need formatting

The placeholder `{count}` renders as the value's string form. `3`, `Ada`, whatever you pass. When you want locale-aware formatting inside the message, ICU sub-formats take care of it:

```ts
t('Your balance is {amount, number, currency USD}', { amount: 99.95 });
// output:
// en-US: 'Your balance is $99.95'
// sv-SE: 'Ditt saldo är 99,95 US$'
```

```ts
t('Updated {when, date, long}', { when: new Date() });
// output:
// en-US: 'Updated June 17, 2026'
// sv-SE: 'Uppdaterad 17 juni 2026'
```

These follow the [ICU MessageFormat](https://unicode-org.github.io/icu/userguide/format_parse/messages/) spec and travel with every translation. See [Plurals](/guide/writing/plurals) for the full list of supported sub-formats.

## What runs at compile time vs runtime

Compile time:
- Every placeholder in the source has a matching key in the params object
- Every key in the params object is used by some placeholder in the source
- Both the source and the parameters are static literals

Runtime:
- The placeholder values are rendered into the active locale's translation
- A missing value falls back to an empty string, with a warning in dev
- A value of the wrong type (`'three'` for a number sub-format, for example) is coerced when possible, warned about when not

In practice, you only see compile-time errors when you're writing. The runtime fallbacks exist as safety nets, not as a substitute for static checking.

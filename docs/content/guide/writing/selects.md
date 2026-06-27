---
title: Selects
order: 4
---

`select` picks between branches based on a string value. It's the counterpart to [`plural`](/guide/writing/plurals), which switches on a number. Use `select` whenever the choice is categorical and the translation needs to read differently for each.

```ts
t('{role, select, admin {Admin panel} editor {Editor view} other {Reader view}}', { role: 'admin' });
// output: 'Admin panel'
```

The keys are arbitrary strings you choose. Unlike `plural`, where the categories come from ICU's locale rules, `select` lets you define whatever set fits your data.

## The `other` fallback

Every `select` needs an `other` branch as the fallback. If the runtime value doesn't match any of the named branches, `other` is used:

```ts
t('{status, select, draft {Draft} published {Published} other {Unknown}}', { status: 'archived' });
// output: 'Unknown'
```

`'archived'` doesn't match any named branch, so `other` is used.

Omitting `other` is a compile-time error ([`YAP0008`](/reference/diagnostics/YAP0008)).

## Why each language can choose differently

Like with plurals, the translator (human or model) is free to add, remove, or merge branches per locale. Some languages need gendered verb forms; others don't.

In the English source the verb doesn't change:

```ts
t('{gender, select, female {She is online} male {He is online} other {They are online}}', { gender });
```

Spanish adds a gendered adjective:

```json [locales/es.json]
{
  "{gender, select, female {She is online} male {He is online} other {They are online}}": "{gender, select, female {Está conectada} male {Está conectado} other {Está conectado}}"
}
```

Finnish drops the distinction; one branch covers all:

```json [locales/fi.json]
{
  "{gender, select, female {She is online} male {He is online} other {They are online}}": "{gender, select, other {Hän on paikalla}}"
}
```

## Nesting placeholders

A `select` branch is a full message. You can put placeholders, plurals, or even other selects inside:

```ts
t('{role, select, admin {Admin {name} has {count, plural, one {# alert} other {# alerts}}} other {{name} has {count, plural, one {# alert} other {# alerts}}}}', {
  count: 3,
  name: 'Ada',
  role: 'admin'
});
```

That message reads as a wall of braces, which is fair. Long ICU expressions get ugly fast. yapyak doesn't enforce a maximum, but if it stops being readable, extract logic into two separate `t()` calls and let your component decide which to render.

## Selectordinal (for ordinal numbers)

If your branching looks like a select but the value is an ordinal ("1st place", "2nd place", "3rd place"), that's `selectordinal`. It's covered in [Plurals](/guide/writing/plurals#ordinals-selectordinal) since the categories and rules match `plural`.

## What `select` accepts at runtime

The parameter value is whatever you pass in:

- A string matching a branch key renders that branch.
- A string with no matching branch renders `other`.
- A non-string value is coerced to string with `String(value)`, then matched.

Keeping the values typed (a union literal like `'admin' | 'editor' | 'viewer'`) is the easiest way to be sure every legal value has a branch. TypeScript can't introspect the branches at the source-string level, but a tight union type at the call site catches mismatches at the call site.

## Compile-time checks

The compiler validates the structural shape:

- Every branch has a key and a body
- `other` is present
- Every nested placeholder is in the params object

It doesn't enforce that the value type is one of your declared branches. That's your TypeScript discipline at the call site. If you pass `'archived'` and only `'draft'` and `'published'` are listed, the runtime falls through to `other` cleanly. The `other` branch renders; nothing crashes.

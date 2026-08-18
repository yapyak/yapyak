---
name: yapyak-test
description: "Testing: the test-or-not rules, the Yap List verbs, the Yak Pool fixtures, property-based testing. Use when writing or editing a test."
---

### Which symbols to unit test

Apply in order. First match wins.

```
1. Non-exported (no `export` keyword)?
   → NEVER test. Test through callers.

2. Reachable from package.json `exports`?
   → MUST test. Package API contract.

3. Consumed by 2+ files in the same pnpm workspace package?
   → MUST test. Intra-package shared contract. (Consumers in other workspace packages don't count here — they reach it via rule 2's `exports`.)

4. Function has 3+ code paths (1 + branching keywords, per § Counting code paths)?
   → MUST test. Branchy logic.

5. File has 8+ conditional keywords total?
   → MUST test entry points. Safety net for hidden logic.
   (entry points = every exported symbol in the file; conditional
    keywords = the same keywords counted in 'Counting code paths',
    summed across all functions in the file.)

6. Otherwise:
   → NO test. Tested through single consumer.
```

Rule 1 is absolute. Private helpers are never tested directly, even with many code paths → give the export that reaches a helper one test per distinct return path of that helper, on top of the export's category count.

### Which files get a test file

A file gets a `.test.ts` sibling if it has at least one symbol matching rules 2–5.

Files that do **NOT** get unit tests:

| Category | Why |
| --- | --- |
| Barrel files (`index.ts`, `internal.ts`) | Re-export only |
| Type-only files (`type.ts`) | No runtime |
| Single-consumer helpers | Tested through consumer |
| Constants files | No behavior |
| Pure adapter wrappers | Tested through target |

### Browser e2e — `*.spec.ts`

- Playwright specs live in `e2e/src` with the `*.spec.ts` suffix; `*.test.ts` is unit-only — the suffix marks which rule set applies.
- `test` names draw from the Yap List; fixtures draw from the Yak Pool.
- The unit rules — symbol selection, source-file mirroring, `describe` structure, category formulas — do not apply to e2e specs.

### Counting code paths

Code paths = 1 + count of branching keywords in the function body.

Count: `if`, `else if`, `?:`, `case` (each branch), `&&` / `||` / `??` returning different value.

Do NOT count: `else`, `switch` keyword itself, `try/catch` (counts as 1 extra path), pure boolean `&&`/`||`, optional chains `?.`.

Syntactic test for `&&`/`||`/`??`: count it iff its result is assigned, returned, or passed as an argument (value position). Do NOT count it when it is the whole condition of an `if`/`while`/ternary or is coerced to boolean (`!`, `Boolean()`, `if (a && b)`).

```ts
function resolve(opts?: Options): string {      // 4 paths (1 + 3 if)
  if (!opts) return DEFAULT;
  if (opts.disabled) return DEFAULT;
  if (opts.fallback) return opts.fallback;
  return opts.value;
}
```

### Function categories — formula

Categorize first. Then apply mechanically.

1. Returns `boolean` → **Predicate**
2. Returns `Promise<T>` and may throw → **Async**
3. Returns `void` and mutates state → **Mutator**
4. Returns `T | undefined` / `T | null` → **Lookup**
5. Starts with `format*` / `to*` / `parse*` / `stringify*` → **Converter**
6. Takes options object → **Configurable**
7. Otherwise returns a value → **Pure**

#### Predicate

Exactly 2 tests — true case and false case.

```ts
describe('isPlainObject', () => {
  it('returns true for plain object', () => {
    expect(isPlainObject({})).toBe(true);
  });

  it('returns false for array', () => {
    expect(isPlainObject([])).toBe(false);
  });
});
```

`it` naming: `'returns true when <condition>'` / `'returns false when <condition>'`. Use `'returns true for <input>'` when the truth is fully determined by a single literal argument. Use `'returns true when <condition>'` when truth depends on relationships between multiple args or external state.

#### Pure

1 test per code path.

| Function shape | Tests |
| --- | --- |
| No branching | 1 |
| `if/else` | 2 |
| `switch` with N cases | N |
| Returns `null`/`undefined` as a path | +1 |

`it` naming: `'returns <what>'` for primary, `'returns <what> when <condition>'` for branches.

#### Async

1 test for success + 1 per error path.

```ts
describe('fetchWithRetry', () => {
  it('returns response on success', async () => {
    const result = await fetchWithRetry({ url: 'http://example.com' });
    expect(result.ok).toBe(true);
  });

  it('throws after maxRetries on 5xx', async () => {
    await expect(fetchWithRetry({ url, maxRetries: 2 })).rejects.toThrow(/5\d\d/);
  });
});
```

`it` naming: `'returns <what>'` for success, `'throws <Error> when <condition>'` for error.

#### Mutator

1 test verifying state change + 1 per branch.

`it` naming: `'updates <state>'`, `'ignores <input> when <condition>'`, `'notifies <observer> on change'`.

#### Lookup

Exactly 2 tests — found + not found.

`it` naming: `'returns the <noun> when found'` + `'returns undefined when not found'`.

#### Converter

1 test per output variant. No edge cases unless the signature signals them.

Output variant = each distinct return type/shape the function can produce (e.g. string vs null), not each distinct value. For value variety use the 'Edge cases from signature' table.

The 'Edge cases from signature' table is mandatory for every category, Converter included. 'No edge cases unless the signature signals them' means: add none BEYOND those the signature table requires.

`it` naming: `'builds <output> from <input>'`, `'parses <input> to <output>'`, `'formats <input> as <output>'`.

#### Configurable

Exactly 2 `describe` sub-blocks: `with defaults` and `with overrides`.

- `with defaults` — call with only required args. Assert every default explicitly.
- `with overrides` — call with every accepted option set to a non-default. Assert each individually. If an option has no non-default value, assert it in the defaults test only and note it has no override.
- A required option with no default is asserted in `with overrides` only; if every option is required, omit the `with defaults` block.

### Edge cases from signature

| Signature pattern | Required test |
| --- | --- |
| `param?: T` (optional) | with and without |
| `param: T[]` | with `[]`, `[oneItem]`, `[two, items]` |
| `param: T \| undefined` | with `undefined` (explicit) |
| `param: T \| null` | with `null` (explicit) |
| `param: number` where 0 is valid | include 0 |
| `param: string` where '' is valid | include '' |
| Throws on invalid input | 1 test per validation branch |

### `describe` block structure

1. One `describe` per exported function, named with the function as a string.
2. `describe` order: alphabetical by function name.
3. Within a `describe`: happy-path → edge cases → error paths.
4. Nested `describe` only for configurable categories.

### `it` naming — forbidden patterns

| ✗ Wrong | Why | ✓ Right |
| --- | --- | --- |
| `it('should return X')` | `should` | `it('returns X')` |
| `it('works correctly')` | Non-specific | Use formula |
| `it('handles the X case')` | Vague | `it('returns X when ...')` |
| `it('properly parses Y')` | Filler | `it('parses Y')` |
| `it('validates and saves')` | Multiple behaviors | Split into 2 |
| `it('it returns X')` | Stutter | `it('returns X')` |
| `it('test that X')` | `test that` | `it('returns X')` |
| `it('checks if X')` / `it('manages X')` / `it('supports X')` / `it('processes X')` | Vague verbs | Pick a specific verb |
| `it('ensures X')` / `it('validates X')` | Tautological | `it('throws when …')` / `it('returns false when …')` |
| `it('would return X')` / `it('may throw Y')` | Modal verbs | `it('returns X')` / `it('throws when …')` |
| `it('parse the input')` | Imperative | `it('parses the input')` |

### Test voice — yap-speak

`it` names draw verbs from the Yap List. Fixtures draw from the Yak Pool.

#### Sentence shapes — universal

| # | Shape | Example |
|---|---|---|
| S1 | `<verb> <object>` | `'returns the locale'` |
| S2 | `<verb> <object> when <condition>` | `'throws when source is empty'` |
| S3 | `<verb> <object> for <subject>` | `'extracts placeholders for plurals'` |
| S4 | `<verb> <quantifier> <object>` | `'writes no file when invariant fails'` |

S4 quantifiers — closed set: `no`, `every`, `all`, `each`.

S2 and S4 can combine. S3 cannot — if a test needs both a subject and a condition, the subject belongs in the object slot.

#### Lexical rules

- Lowercase first letter, except acronyms.
- Backticks around code identifiers: `` `t()` ``, `` `null` ``, `` `Map` ``.
- No trailing period.
- 3rd person present indicative: `returns`, not `return`.
- Acronyms uppercase: `ICU`, `YAP`, `JSX`, `TSX`, `ESM`, `HMR`, `SSR`, `HTTP`, `JSON`.

#### The Yap List

Closed set of verbs allowed in `it` names. Alphabetical.

| Verb | Domain |
|---|---|
| `binds` | binding/scope resolution |
| `blocks` | guard returns early without throwing |
| `builds` | constructs a value from parts |
| `captures` | retains an extracted value |
| `classifies` | token/symbol categorization |
| `clears` | explicit value removal |
| `collapses` | merges adjacent/whitespace into one |
| `collects` | gathers items into a result |
| `drops` | removes an entry from a sequence |
| `elides` | compiler removes dead code |
| `emits` | compiler outputs code/artifacts |
| `expands` | placeholder/macro expansion into parts |
| `extracts` | parser pulling messages out |
| `falls` | fallback path (`falls back`/`falls through`) |
| `finds` | lookup that may miss |
| `folds` | collapses multiple inputs to one |
| `follows` | re-export/redirect chasing |
| `forwards` | passes a value onward unchanged |
| `groups` | buckets items by key |
| `holds` | value-storing assertion |
| `interpolates` | string templating with placeholders |
| `invalidates` | marks cached/derived state stale |
| `isolates` | per-request/per-scope separation |
| `lists` | collects/returns an array |
| `loads` | IO read with parsing |
| `maps` | key → value association |
| `marks` | tokenizer classification tag |
| `merges` | combines two sources |
| `migrates` | locale-key transformation |
| `normalizes` | option/config canonicalization |
| `notifies` | invokes subscribers/observers |
| `overrides` | replaces a default with a value |
| `parses` | text → structured value |
| `picks` | locale catalog selection |
| `prefers` | selects one candidate over another |
| `preserves` | invariant-respecting no-change |
| `queues` | defers work onto a queue |
| `reads` | plain IO read |
| `records` | accumulates a diagnostic/entry |
| `refuses` | typed invariant rejection |
| `registers` | adds to a registry |
| `renames` | locale-key/export rename |
| `renders` | produces display output (markdown/JSX) |
| `replaces` | substitutes one value for another |
| `reports` | surfaces a count/summary |
| `resolves` | symbol/binding resolution |
| `returns` | plain return value |
| `rewrites` | compiler source rewriting |
| `segments` | splits text around boundaries |
| `sends` | dispatches a request |
| `separates` | partitions into parts |
| `skips` | guard skips an item without error |
| `sorts` | orders a collection |
| `splits` | divides into parts |
| `stops` | halts a running process |
| `strips` | removes a prefix/wrapper |
| `syncs` | bring two stores in line |
| `throws` | generic error path |
| `transforms` | input → modified output |
| `treats` | input-equivalence handling |
| `truncates` | shortens to a limit |
| `walks` | recursive iteration |
| `warns` | logs a diagnostic warning |
| `writes` | IO write |
| `yields` | generator/iterator producer |

The triplet `throws` / `refuses` / `blocks`:

- `throws` — generic `Error` class.
- `refuses` — typed invariant rejection (`YapyakInvariantError`).
- `blocks` — guard returns early without throwing.

#### The Yak Pool

Closed set of fixture data. No invented strings.

**English source strings:**

```
'Hello'
'World'
'Save'
'Save changes'
'Cancel'
'Settings'
'Loading...'
'Open'
'Switch account'
'Unnamed account'
```

**Swedish translations:**

| Source | Translation |
|---|---|
| `Hello` | `Hej` |
| `World` | `Världen` |
| `Save` | `Spara` |
| `Save changes` | `Spara ändringar` |
| `Cancel` | `Avbryt` |
| `Settings` | `Inställningar` |
| `Loading...` | `Laddar...` |
| `Switch account` | `Byt konto` |
| `Unnamed account` | `Namnlöst konto` |

**German translations:**

| Source | Translation |
|---|---|
| `Hello` | `Hallo` |
| `World` | `Welt` |
| `Save` | `Speichern` |
| `Save changes` | `Änderungen speichern` |
| `Cancel` | `Abbrechen` |
| `Settings` | `Einstellungen` |
| `Loading...` | `Lädt...` |
| `Switch account` | `Konto wechseln` |
| `Unnamed account` | `Unbenanntes Konto` |

**Homonym contexts** (`t.as` fixtures):

| Source | Context | Translation |
|---|---|---|
| `Open` | `button` | `Öppna` |
| `Open` | `badge` | `Öppen` |

**ICU patterns:**

```
'Hi {name}'
'You have {count, plural, one {# item} other {# items}}'
'{theme, select, dark {Dark mode} other {Light mode}}'
'{theme, select, dark {Dark mode} light {Light mode} other {System}}'
'Updated: {when, date, long}'
'Price: {amount, number, currency EUR}'
'You have {count, plural, one {# by {author}} other {# by {author}}}'
```

**Edge-case strings** (only when the test exercises the named edge case):

```
'Closing braces: }}'          Vue mustache parser test
'Closing braces inside: }}'   transform-output escape test
"It's"                         apostrophe escape inside single-quoted string
'K'                            messageId-hash collision tests
'café'                         Unicode NFC-normalization tests — typed in NFD in the test, asserted in NFC
'🦬'                            astral-plane character — surrogate-pair and 4-byte UTF-8 offset tests
'a &lt; b'                     HTML entity in template scaffolding — decoded-vs-raw offset tests
'a &lt b'                      HTML entity without its semicolon — decoded-vs-raw offset tests
'&#38 x'                       numeric reference without its semicolon — decoded-vs-raw offset tests
'{count, plural, one {# objekt}}'                                   M1 regression — plural target with `other` dropped
'{count, plural, one {# objekt} few {# objekt} many {# objekt} other {# objekt}}' locale-extra plural categories
'{theme, select, dark {Mörkt} other {System}}'                       M1 select regression — domain branch dropped
'{count, plural, en {# objekt} other {# objekt}}'                    YAP0045 regression — unknown plural branch name
'{count, plural, one {# objekt} few {# objekt} other {# objekt}}'    YAP0045 regression — category of another locale
'{count, plural, =1 {# objekt} other {# objekt}}'                    exact-match branch accepted by YAP0045
'{count, plural, one two {# item} other {# items}}'                  parse regression — branch name without a body
'{count, plural, {# item} other {# items}}'                          parse regression — branch body without a name
'{count, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}'  selectordinal source for ordinal-category tests
'{count, selectordinal, two {#nd} other {#th}}'                      YAP0045 regression — ordinal category invalid in target locale
'{count, plural, oen {# item} other {# items}}'                      YAP0046 regression — unknown plural keyword
'{count, selectordinal, oen {#st} other {#th}}'                      YAP0046 regression — unknown selectordinal keyword
'{count, plural, zero {# items} one {# item} two {# items} few {# items} many {# items} other {# items}}' every CLDR keyword accepted
'You have {count, plural, one {# msg} other\t{# msgs}}'              type-level whitespace regression — tab before the `other` body
'You have {count, plural, one {# msg} other\n{# msgs}}'              type-level whitespace regression — newline before the `other` body
'You have {count,\n plural, one {# msg} other {# msgs}}'             type-level whitespace regression — newline after the placeholder name
'Öppna {name}'                                                       context-variant target carrying a placeholder the source lacks — locale-file range tests
'Hi {first name}'                                                    YAP0052 regression — placeholder name holding a space
'You have {count, plura, one {# item} other {# items}}'              tokenizer regression — misspelled argument kind before branches
'Price: {amount, numbr, currency EUR}'                               tokenizer regression — misspelled argument kind before a style
```

If a test does not exercise one of these edge cases, use the regular pool strings.

**FileIds in mock locales:**

```
'src/a.ts',     'src/a.tsx',  'src/a.vue',  'src/a.svelte',  'src/a.astro'
'src/b.ts',     'src/b.tsx',  'src/b.vue',  'src/b.svelte',  'src/b.astro'
'src/components/c.tsx'
```

Slarv basenames (`foo`, `bar`, `new`, `app`, `page`) are forbidden.

### Extending the lists

Yap List and Yak Pool are closed. Adding a verb or fixture entry requires editing this file in the same commit as the first test that uses it.

### Property-based testing — fast-check

`@fast-check/vitest` for property-based testing. Properties live in a nested `describe('properties', ...)` block at the end of the source's `.test.ts`. Yap List verbs apply to property `it.prop()` names. `every` is the S4 quantifier of choice.

#### When to use

A function gets property tests if all four hold:

1. **Pure** — input → output, no side effects.
2. **Large input domain** — strings, numbers, AST trees, arbitrary records.
3. **Clear invariant** — `f(f(x)) === f(x)`, `interpret(parse(s), p) === expected`.
4. **Gated** — the function is in the closed 'Where it lives' list, OR the PR names a never-before-tested invariant.

#### Where it lives (closed list)

| Module | Reason |
|---|---|
| `template/interpret.ts` | Pure, big input space, clear invariants |
| `template/parse.ts` | Pure, robustness + idempotence |
| `template/placeholder.ts` | Pure extraction, uniqueness invariant |
| `compiler/parser/message-key.ts` | Pure encoder/decoder roundtrip |
| `compiler/parser/matching-brace.ts` | Pure brace-balance invariant |
| `translation/rich-text.ts` | Pure string-to-AST parser |

Adding properties to a new module requires explicit reasoning in the PR — name the invariant. Ad-hoc properties without a stated invariant are refused.

#### API form

```ts
import { fc, it } from '@fast-check/vitest';
import { describe, expect } from 'vitest';

describe('myFn', () => {
  describe('properties', () => {
    it.prop([fc.string()])(
      'returns the same output for every identical input',
      (input) => {
        expect(myFn(input)).toBe(myFn(input));
      },
    );
  });
});
```

### File template

```ts
import { describe, expect, it } from 'vitest';

import { resolveLocale } from './resolve';

describe('resolveLocale', () => {
  it('returns persisted value when supported', () => {
    expect(
      resolveLocale({ persisted: 'sv', locales: ['en', 'sv'], defaultLocale: 'en' }),
    ).toBe('sv');
  });

  it('returns defaultLocale when nothing matches', () => {
    expect(
      resolveLocale({ locales: ['en', 'sv'], defaultLocale: 'en' }),
    ).toBe('en');
  });
});
```

Rules:

1. Imports at top per [[yapyak-module]]: `vitest` first, then the symbol via relative import.
2. Always destructure named imports — never `import * as vitest`.
3. `describe` takes the function name as a string (camelCase, exactly).
4. `it` callbacks are arrow functions, `async` only when needed.
5. One blank line before `expect` when the test has setup. No blank line for one-liners.
6. Assertions: `toBe` for primitives, `toEqual` for objects/arrays, `toBeUndefined` for explicit undefined, `toBeNull` for explicit null.

### Mocking patterns

#### `vi.mock`

For tests that override module-level constants:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setLocale } from './store';

vi.mock('@yapyak/runtime', () => ({
  DEFAULT_LOCALE: 'en',
  LOCALES: ['en', 'sv'],
  PERSISTENCE: null,
}));
```

When the mocked module's exports are captured at import time, use top-level `await import(...)`:

```ts
vi.mock('@yapyak/runtime', () => ({ ... }));
const { setLocale, getLocale } = await import('./store');
```

Rules:

1. `vi.mock` goes after all static imports.
2. Consolidate `vi` into the existing `vitest` import.
3. Mock the full shape of the module.

#### `vi.stubGlobal`

For browser/Node globals:

```ts
afterEach(() => {
  vi.unstubAllGlobals();
});

it('sends API key header', async () => {
  vi.stubGlobal('fetch', async (_url, init) => new Response(...));
});
```

Always add `afterEach(() => vi.unstubAllGlobals())` when using `stubGlobal`. Stub per test.

#### Helper functions for shared setup

When 3+ tests share setup of 2+ statements, extract a helper. A single shared statement stays inline.

### `beforeEach` / `afterEach`

| Use | When |
| --- | --- |
| `afterEach(() => vi.unstubAllGlobals())` | After any `vi.stubGlobal` |
| `afterEach(() => resetState())` | After tests that mutate module-level state |
| `beforeEach(() => createFreshDb())` | When 3+ tests need fresh setup |
| `beforeAll` | Almost never |

### Test isolation

Every test must work independently. No test depends on another running first. If reaching for `it.serial` or "must run after X" — refactor.

### Async with throws

Prefer `rejects.toThrow`:

```ts
// ✓
await expect(fetchWithRetry({ url })).rejects.toThrow(/429/);

// ✗ — bug-prone
try {
  await fetchWithRetry({ url });
  expect.fail('should have thrown');
} catch (error) {
  expect(error).toBeInstanceOf(Error);
}
```

### Snapshot tests

Forbidden for unit tests. Use explicit `toEqual(...)` with the expected shape.

Snapshots are allowed only in:

- Compiler output tests (where the shape IS the contract)
- Generated-file tests (where any change must be reviewed)

### Fixture data

Inline fixtures up to 20 lines. At 21+ lines, move to a `fixtures/` sibling file.

For larger fixtures (compiler tests with source-code samples), put them in a `fixtures/` sibling folder, one file per fixture. Reference by path, not by import — the fixture content is treated as raw text.

### Coverage floor

- Keep each root `coverage.thresholds` value ~1 percentage point under the measured level.
- Raise a floor after a coverage improvement → never lower one; when the gate fails, add the mandated tests instead.

### Audit before commit

| Group | Check |
|---|---|
| **File** | `<source>.ts` paired with `<source>.test.ts`. |
| **Imports** | Vitest helpers first, then symbol via relative import. Per [[yapyak-module]]. |
| **Structure** | One `describe` per exported function, alphabetical. Order: happy-path → edge → error. |
| **Coverage** | Function categorized; test count matches the formula. Edge cases derived from signature. |
| **`it` names** | Formula shape + Yap List verb. No forbidden patterns. |
| **Fixtures** | Yak Pool only. No invented strings. |
| **Mocks** | Restored in `afterEach`. |
| **Snapshots** | None (unless in the allowed exceptions). |
| **Run** | `vitest --run` passes. |

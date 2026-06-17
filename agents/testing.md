## Testing

Mechanical convention for Vitest unit tests. Every rule is deterministic — no judgment calls.

### Which symbols to unit test

Mechanical decision tree. Apply in order — first match wins.

```
1. Is the symbol non-exported (no `export` keyword)?
   → NEVER test. Test through its callers.

2. Is it reachable from package.json `exports`?
   (e.g. exported from package's `index.ts` or `/internal` subpath barrel)
   → MUST test. This is the package's API contract.

3. Is it consumed by 2+ files in the package?
   → MUST test. Intra-package shared contract.

4. Does the function have ≥3 code paths?
   → MUST test. Branchy logic that integration can't reach.

5. Does the file have ≥8 conditional keywords total?
   → MUST test entry points. Safety net for complex hidden logic.

6. Otherwise:
   → NO test. Tested through its single consumer.
```

Rule 1 is an absolute override. Private helpers are never tested directly, even if they have many code paths — they're covered through whoever calls them.

Rule 5 catches files where the public entry is trivial but private helpers have hidden complexity. Count ALL conditional keywords in the file (including private). If ≥8: unit-test every exported entry point that delegates to private logic.

### Which files get a test file

A file gets a `.test.ts` sibling if it has at least one symbol matching rules 2–5.

Typical files that do **NOT** get unit tests:

| Category | Why |
| --- | --- |
| Barrel files (`index.ts`, `internal.ts`) | Just re-export — no behavior |
| Type-only files (`type.ts`, `types.ts`) | No runtime |
| Single-consumer helpers (per inline rule, shouldn't be standalone anyway) | Tested through their consumer |
| Constants files (only `export const X = literal`) | No behavior to test |
| Pure adapter wrappers with no logic | Tested through their target |
| Domain folder barrels (`locale/index.ts`, `parser/index.ts`) | Re-export only |

### Counting code paths

Code paths = 1 + count of branching keywords in the function body.

Count: `if`, `else if`, `?:` (ternary), `case` (each branch), `&&` short-circuit returning different value, `||` short-circuit, `??` returning different value.

Do NOT count: `else` (replaces default, doesn't add), `switch` keyword itself (only the cases), `try/catch` (counts as 1 extra path), `&&` / `||` in pure boolean expressions, optional chains `?.`.

```ts
function name(): string {                       // 1 path
  return value;
}

function isReady(state: State): boolean {       // 2 paths (1 + if)
  if (state.kind === 'init') return false;
  return state.loaded;
}

function format(kind: string): string {         // 4 paths (1 + 3 cases)
  switch (kind) {
    case 'a': return 'A';
    case 'b': return 'B';
    case 'c': return 'C';
  }
  return '';
}

function resolve(opts?: Options): string {      // 4 paths (1 + 3 if)
  if (!opts) return DEFAULT;
  if (opts.disabled) return DEFAULT;
  if (opts.fallback) return opts.fallback;
  return opts.value;
}
```

### Function categories — formula table

Categorize the function first. Then apply the formula mechanically.

1. Returns `boolean` → **Predicate**
2. Returns `Promise<T>` and may throw → **Async**
3. Returns `void` and mutates state → **Mutator**
4. Returns `T \| undefined` / `T \| null` → **Lookup**
5. Starts with `format*` / `to*` / `parse*` / `stringify*` → **Converter**
6. Takes options object → **Configurable** (see options sub-formula)
7. Otherwise returns a value → **Pure**

#### Predicate (returns boolean)

Always exactly **2 tests** — true case and false case.

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

`it` naming: `'returns true when <condition>'` / `'returns false when <condition>'`. When the condition is obvious from input, shortcut to `'returns true for <input>'` / `'returns false for <input>'`.

#### Pure (returns a value)

**1 test per code path**.

| Function shape | Tests |
| --- | --- |
| No branching | 1 test |
| `if/else` | 2 tests |
| `switch` with N cases | N tests |
| Returns `null`/`undefined` as a possible path | +1 for that path |

`it` naming: `'returns <what>'` for the primary path, `'returns <what> when <condition>'` for branches.

```ts
describe('resolveLocale', () => {
  it('returns persisted value when supported', () => {
    expect(resolveLocale({ persisted: 'sv', locales: ['en', 'sv'], defaultLocale: 'en' })).toBe('sv');
  });

  it('returns defaultLocale when persisted unsupported', () => {
    expect(resolveLocale({ persisted: 'de', locales: ['en', 'sv'], defaultLocale: 'en' })).toBe('en');
  });
});
```

#### Async (returns Promise<T>)

**1 test for success + 1 test per error path.**

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

`it` naming: `'returns <what>'` for success, `'throws <Error> when <condition>'` for error paths.

#### Mutator (returns void, changes state)

**1 test verifying the state change** + **1 test per branch** in the mutation logic.

```ts
describe('setLocale', () => {
  it('updates the current locale', () => {
    setLocale('sv');
    expect(getLocale()).toBe('sv');
  });

  it('ignores unsupported locale', () => {
    setLocale('de');
    expect(getLocale()).toBe('en');
  });
});
```

`it` naming: `'updates <state>'`, `'ignores <input> when <condition>'`, `'notifies <observer> on change'`.

#### Lookup (returns T | undefined / T | null)

**Exactly 2 tests** — found + not found.

```ts
describe('findCallSite', () => {
  it('returns the call site when found', () => {
    expect(findCallSite(ast, 'src/foo.ts', 10, 5)).toEqual({ line: 10, column: 5, source: 'Hello' });
  });

  it('returns undefined when not found', () => {
    expect(findCallSite(ast, 'src/foo.ts', 99, 99)).toBeUndefined();
  });
});
```

`it` naming: `'returns the <noun> when found'` + `'returns undefined when not found'` (or `'returns null'` — match the actual return type).

#### Converter (`format*`, `to*`, `parse*`, `stringify*`)

**1 test per output variant.** No edge cases unless the signature signals them.

```ts
describe('toRange', () => {
  it('builds a range from start and end positions', () => {
    expect(toRange({ line: 1, column: 5 }, { line: 1, column: 10 })).toEqual({
      start: { line: 1, column: 5 },
      end: { line: 1, column: 10 },
    });
  });
});
```

`it` naming: `'builds <output> from <input>'`, `'parses <input> to <output>'`, `'formats <input> as <output>'`.

#### Configurable (takes options object with defaults)

Always exactly **2 `describe` sub-blocks**: `with defaults` and `with overrides`.

- `with defaults` — Call with only required args. Assert every default explicitly.
- `with overrides` — Call with every accepted option set to a non-default. Assert each individually.

```ts
describe('anthropic', () => {
  describe('with defaults', () => {
    it('uses claude-sonnet-4-6 as model', () => {
      // ...
    });
    it('uses default endpoint', () => {
      // ...
    });
  });

  describe('with overrides', () => {
    it('uses custom model when specified', () => {
      // ...
    });
    it('uses custom endpoint when specified', () => {
      // ...
    });
  });
});
```

### Edge cases from signature

Apply mechanically — no judgment.

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

1. **One `describe` per exported function**, named with the function as a string: `describe('resolveLocale', ...)`.
2. **`describe` order: alphabetical** by function name.
3. **Within a `describe`:**
   - Happy-path `it` blocks first (most common usage).
   - Edge cases next (null, empty, special values).
   - Error paths last.
4. **Nested `describe`** only when the function has clear branches (configurable categories above) — no other reason.

### `it` naming — forbidden patterns

| ✗ Bad | Why | ✓ Good |
| --- | --- | --- |
| `it('should return X')` | `should` | `it('returns X')` |
| `it('works correctly')` | Non-specific | Use formula |
| `it('handles the X case')` | Vague | `it('returns X when ...')` |
| `it('properly parses Y')` | `properly` is filler | `it('parses Y')` |
| `it('correctly returns Z')` | `correct` is filler | `it('returns Z')` |
| `it('validates and saves')` | Multiple behaviors | Split into 2 |
| `it('it returns X')` | Stutter | `it('returns X')` |
| `it('test that X')` | `test that` | `it('returns X')` |
| `it('checks if X')` / `it('manages X')` / `it('supports X')` / `it('processes X')` / `it('deals with X')` | Vague action verbs | Pick a specific verb |
| `it('ensures X')` / `it('validates X')` | Tautological — reformulate | `it('throws when …')` / `it('returns false when …')` |
| `it('would return X')` / `it('may throw Y')` | Modal verbs | `it('returns X')` / `it('throws when …')` |
| `it('parse the input')` | Imperative — use 3rd person | `it('parses the input')` |

### Test voice — yap-speak

yapyak constrains test names to a **closed verb list** (the Yap List), test data to a **closed fixture pool** (the Yak Pool), and recognized acronyms. Every `it` name draws its verb from the Yap List. Every fixture value draws from the Yak Pool.

#### Sentence shapes — universal

Every `it` name follows exactly one of these shapes. Picking a shape is mechanical, not stylistic.

| # | Shape | Example |
|---|---|---|
| S1 | `<verb> <object>` | `'returns the locale'` |
| S2 | `<verb> <object> when <condition>` | `'throws when source is empty'` |
| S3 | `<verb> <object> for <subject>` | `'extracts placeholders for plurals'` |
| S4 | `<verb> <quantifier> <object>` | `'writes no file when invariant fails'` |

S4 quantifiers — closed set: `no`, `every`, `all`, `each`.

S2 and S4 can be combined when both a quantifier and a condition apply (`'lists every violation when invariant fails'`). S3 cannot — if a test needs both a subject and a condition, the subject usually belongs in the object slot (`'extracts placeholders from a plural with nested braces'`).

#### Lexical rules

- **Lowercase first letter** — except acronyms.
- **Backticks around code identifiers** — `` `t()` ``, `` `null` ``, `` `sv.json` ``, `` `Map` ``.
- **No trailing period.**
- **3rd person present indicative** — `returns`, not `return`. `throws`, not `throw`.
- **Acronyms uppercase** — the project declares its acronym list (e.g., `ICU`, `HTTP`, `JSON`, `TSX`, `SSR`).

#### The Yap List

The closed set of verbs allowed in `it` names. Alphabetical.

| Verb | Domain |
|---|---|
| `binds` | binding/scope resolution |
| `blocks` | guard returns early without throwing |
| `builds` | constructs a value from parts |
| `clears` | explicit value removal |
| `elides` | compiler removes dead code as optimization — call site after inlining, import after its local is fully replaced, etc. |
| `emits` | compiler outputs code/artifacts |
| `extracts` | parser/compiler pulling messages out |
| `finds` | lookup that may miss |
| `folds` | collapses multiple inputs to one |
| `holds` | value-storing assertion |
| `interpolates` | string templating with placeholders |
| `lists` | collects/returns an array |
| `loads` | IO read with parsing |
| `migrates` | locale-key transformation (rename) |
| `normalizes` | option/config canonicalization |
| `notifies` | invokes subscribers/observers |
| `parses` | text → structured value |
| `picks` | locale catalog selection |
| `preserves` | invariant-respecting no-change |
| `reads` | plain IO read |
| `refuses` | typed invariant rejection |
| `resolves` | symbol/binding resolution |
| `returns` | plain return value |
| `syncs` | bring two stores in line |
| `throws` | generic error path |
| `transforms` | input → modified output |
| `walks` | recursive iteration |
| `warns` | logs a diagnostic warning |
| `writes` | IO write |
| `yields` | generator/iterator producer |

The triplet `throws` / `refuses` / `blocks` is intentionally distinct:

- `throws` — generic `Error` class.
- `refuses` — typed invariant rejection (e.g., `YapyakInvariantError`).
- `blocks` — guard returns early without throwing.

#### The Yak Pool

The closed set of fixture data. Tests must draw from this — no invented strings.

**English source strings:**

```
'Hello'
'World'
'Save'
'Save changes'
'Cancel'
'Settings'
'Loading...'
'Switch account'
'Unnamed account'
```

**Swedish translations** (paired with the sources above):

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

The nested-placeholder pattern is the canonical fixture for Vue mustache and ICU type-inference tests. The 3-branch `select` is the canonical fixture for branch-parity tests where the locale must preserve every domain branch.

**Edge-case strings** (only when the test exercises the edge case named):

```
'Closing braces: }}'          — `}}` inside string literal (Vue mustache parser test)
'Closing braces inside: }}'   — variant: bracket inside catalog string (transform-output escape test)
"It's"                         — apostrophe escape inside single-quoted string
'K'                            — single-character source (messageId-hash collision tests)
'{count, plural, one {# objekt}}'                                   — plural target with `other` dropped (M1 regression fixture)
'{count, plural, one {# objekt} few {# objekt} many {# objekt} other {# objekt}}' — locale-extra plural categories (Polish-style)
'{theme, select, dark {Mörkt} other {System}}'                       — select target with a domain branch dropped (M1 select regression fixture)
```

If a test does not exercise one of these specific edge cases, use the regular pool strings.

**FileIds in mock locales:**

```
'src/a.ts',     'src/a.tsx',  'src/a.vue',  'src/a.svelte',  'src/a.astro'
'src/b.ts',     'src/b.tsx',  'src/b.vue',  'src/b.svelte',  'src/b.astro'
'src/components/c.tsx'
```

`a` and `b` cover all common framework extensions for processor and multi-file tests. `c.tsx` is reserved for nested-folder scenarios. Slarv basenames (`foo`, `bar`, `new`, `app`, `page`, etc.) are not allowed.

#### Acronyms

Preserved uppercase in `it` names and JSDoc:

```
ICU, YAP, JSX, TSX, ESM, HMR, SSR
```

`YAP` is the yapyak diagnostic code prefix, four-digit zero-padded (`YAP0001`, `YAP0007`, etc.).

#### Mechanical algorithm — naming a test

```
1. Identify the function's action. Map to a verb in the project's
   closed verb list (if declared). No fit → either reformulate the
   test or add the verb to the list FIRST.

2. Pick a shape:
   - No condition, no extra subject  → S1
   - Has a condition (when ...)      → S2
   - Has a subject distinct from object → S3
   - Has a quantifier on the object  → S4

3. Object is a domain noun. If the test uses fixture data, pull from
   the project's fixture pool. No invented strings.

4. Apply lexical rules: lowercase, backticks around code, no period,
   3rd person, acronyms uppercase.
```

#### Extending the lists

The Yap List and Yak Pool are closed. Adding a verb or fixture entry requires editing the relevant section above **in the same commit as the first test that uses it**. Ad hoc additions are refused.

### Property-based testing — fast-check

yapyak uses `@fast-check/vitest` for property-based testing. Properties live in a nested `describe('properties', ...)` block at the **end** of the source's regular `.test.ts` file — same file, same `it.prop(...)` style. Yap List verbs apply to property `it.prop()` names too. `every` is the S4 quantifier of choice (`for every input`).

#### When to use

A function gets property tests if **all four** hold:

1. **Pure** — input → output, no side effects (no fs, network, DOM, globalThis).
2. **Large input domain** — strings, numbers, AST trees, arbitrary records (>100 reasonable values).
3. **Clear invariant** — e.g. `f(f(x)) === f(x)`, `interpret(parse(s), p) === expected`, "result is a string", "no duplicates in output".
4. **Core correctness** — bugs here ship to users (compiler, interpreter, catalog emit, validators).

#### Where it lives (closed list)

| Module | Reason |
|---|---|
| `template/interpret.ts` | Pure, big input space, clear invariants |
| `template/parse.ts` | Pure, robustness + idempotence |
| `template/placeholder.ts` | Pure extraction, uniqueness invariant |
| `compiler/parser/message-key.ts` | Pure encoder/decoder roundtrip, injectivity |
| `compiler/parser/matching-brace.ts` | Pure brace-balance invariant |
| `translation/rich-text.ts` | Pure string-to-AST parser, robustness + identity for tag-free input |

#### Where it does NOT live

- Anything with side effects (`persistence/*`, `cli/command/*`, `compiler/io/*`, `translator/*`, `locale/store.ts`).
- Discrete-domain validators (`compiler/catalog/locale/code.ts` — locale codes are enumerable).
- Config normalizers and small-domain helpers.

**Adding properties to a new module requires explicit reasoning in the PR — name the invariant.** Ad-hoc properties without a stated invariant are refused. The rule above is the gate.

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

1. **Imports at top**, ordered per [[imports]]: `vitest` first (test framework), then the symbol being tested via relative import.
2. **Always destructure named imports** — never `import * as vitest`.
3. **`describe` takes a string** with the function name as written (camelCase, exactly).
4. **`it` callbacks are arrow functions**, `async` only when needed.
5. **One blank line before `expect`** when the test has setup; no blank line when it's a one-liner.
6. **Assertions:** `toBe` for primitives, `toEqual` for objects/arrays, `toBeUndefined` for explicit undefined, `toBeNull` for explicit null.

### Mocking patterns

#### Mock modules (`vi.mock`)

For tests that need to override module-level constants (like runtime config):

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setLocale } from './store';

vi.mock('@yapyak/runtime', () => ({
  DEFAULT_LOCALE: 'en',
  LOCALES: ['en', 'sv'],
  PERSISTENCE: null,
  // ... full mock shape
}));
```

If the test file imports a module that **captures the mocked module's exports at import time** (e.g. snapshots a constant into a closure), use top-level `await import(...)` for the dependent module so the mock is applied first:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@yapyak/runtime', () => ({ ... }));

const { setLocale, getLocale } = await import('./store');
```

Rules:
1. **`vi.mock` goes after all static imports, never between them.** The file structure is always: (all imports) → (`vi.mock` calls) → (test code). Vitest hoists `vi.mock` to the top at runtime, so source position is purely a readability convention — keep imports grouped.
2. **Consolidate `vi` into the existing `vitest` import.** Never a separate `import { vi } from 'vitest';` line.
3. **Use top-level `await import(...)` only when the mocked module's exports are captured at import time.** For most cases static imports work because vitest hoists the mock.
4. **Mock the full shape** of the module — don't partially mock.

#### Stub globals (`vi.stubGlobal`)

For browser/Node globals like `fetch`, `document`, `localStorage`:

```ts
afterEach(() => {
  vi.unstubAllGlobals();
});

it('sends API key header', async () => {
  vi.stubGlobal('fetch', async (_url, init) => new Response(...));
  // ...
});
```

Rules:
1. **Always** add `afterEach(() => vi.unstubAllGlobals())` when using `stubGlobal`.
2. Stub per test, not globally — test isolation.

#### Helper functions for shared setup

When 3+ tests share complex setup, extract a helper. Inline otherwise.

```ts
function stubFetch(response: string): { body: () => unknown } {
  let captured: unknown;
  vi.stubGlobal('fetch', async (_url, init) => {
    captured = JSON.parse(init.body as string);
    return new Response(JSON.stringify({ content: response }), { status: 200 });
  });
  return { body: () => captured };
}
```

### `beforeEach` / `afterEach`

| Use | When |
| --- | --- |
| `afterEach(() => vi.unstubAllGlobals())` | After any `vi.stubGlobal` |
| `afterEach(() => resetState())` | After tests that mutate module-level state |
| `beforeEach(() => createFreshDb())` | When ≥3 tests need fresh setup |
| `beforeAll` | Almost never — favor `beforeEach` |

Avoid `beforeEach` for trivial setup that's faster inline.

### Test isolation

**Every test must work independently.** No test depends on another running first. If you find yourself reaching for `it.serial` or comments like "must run after X", refactor — the tests are coupled.

### `expect.assertions(n)` for async with throws

When asserting that an async function throws, prefer `rejects.toThrow`:

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

**Forbidden** for unit tests. They obscure intent and update silently. Use explicit `toEqual(...)` with the expected shape.

Snapshots are allowed only in:
- Compiler output tests (where the shape IS the contract)
- Generated-file tests (where any change must be reviewed)

In those cases, snapshot files must be reviewed in PRs like any other source file.

### Fixture data

**Inline literal values** for everything that fits in one screen. Test data lives in the test file.

For larger fixtures (compiler tests with source code samples), put them in a `fixtures/` sibling folder, one file per fixture. Reference by path, not by import — the fixture content is treated as raw text.

```ts
// ✓ — inline
it('parses single locale', () => {
  expect(parseAcceptLanguage('sv')).toEqual(['sv']);
});

// ✓ — fixture for source-code samples
it('extracts $t() calls from JSX', () => {
  const source = readFileSync(join(FIXTURES, 'jsx-simple.tsx'), 'utf-8');
  expect(extractFile({ fileId, locales, source }).messages).toHaveLength(2);
});
```

### Complete algorithm

Given a function to test:

1. Does it qualify per the decision tree (rules 1–4)? No → skip. Yes → continue.
2. Create or open `<file>.test.ts` next to the source.
3. Add imports: `vitest` helpers, then symbol under test (relative path).
4. Add module mocks (`vi.mock`) and global stubs (`vi.stubGlobal`) as needed.
5. Wrap each tested function in `describe('<functionName>', ...)`.
6. Categorize the function (predicate / pure / async / mutator / lookup / converter / configurable).
7. Count code paths → exact number of `it` blocks.
8. Check signature for edge cases → add `it` blocks per the table.
9. Name `it` blocks using the formula table plus the project's voice rules (see § Test voice — project vocabulary).
10. Order: happy path → edge cases → errors.

### Checklist

Before a unit test file is done:

1. File next to source: `<source>.ts` + `<source>.test.ts`.
2. Imports follow [[imports]] order (vitest, then relative).
3. One `describe` per exported function, alphabetical.
4. Each function categorized; test count matches the formula.
5. Edge cases derived from signature.
6. `it` names follow the naming formula table.
7. No `should`, `correctly`, `properly`, `works`, `handles`, stutters.
8. If the project declares a verb list / fixture pool, `it` names and fixtures comply.
9. Mocks restored in `afterEach`.
10. No snapshots (unless in the allowed exception list).
11. Tests pass with `vitest --run`.

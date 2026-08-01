---
name: yapyak-type
description: "Type system: `type` vs `interface`, inline-vs-named unions, boolean and argument defaults, error classes. Use when defining a type, union, default, or function signature."
---

### Always use `type`, never `interface`

Every type declaration uses `type`. `interface` is forbidden. Enforced by Biome's `useConsistentTypeDefinitions` with `style: "type"`.

```ts
// ✓
type Options = { include: string[]; exclude: string[] };
type ContextLevel = 'none' | 'minimal' | 'rich';
type Handler = (x: T) => U;

// ✗
interface Options { include: string[]; exclude: string[]; }
```

**Single exception** — declaration-merging augmentation slot for consumers:

```ts
// biome-ignore lint/style/useConsistentTypeDefinitions: yap yap yap
// biome-ignore lint/suspicious/noEmptyInterface: yap yap yap
export interface Register {}

export type Locale = Register extends { Locale: infer L extends string }
  ? L
  : string;
```

This is the only legitimate `interface`. For any other use of declaration merging, find a different design.

### File layout

Order inside every `.ts` / `.tsx` file:

1. Imports (formatter-controlled).
2. Exported types.
3. Exported constants.
4. Exported function(s) — primary export first.
5. Helper functions — below primary, in order of first usage.
6. Module-scope constants used only by helpers — directly above the helper that uses them.

Helpers never appear above the exported function they support.

### Union types — inline vs named

A union/object type only ever referenced from one public field is not a concept. Inline it.

Inline the entire union on the field when BOTH hold:

1. Referenced from exactly one location in the public surface.
2. Consumers have no realistic need to derive variants via `Extract<>` / `Pick<>`.

Otherwise extract a named type. (The former third condition, "No natural name exists," is dropped: it has no mechanical test. Rely only on the two conditions above.)

```ts
// ✓ Inline — single-use field shape, no natural name
type YapyakOptions = {
  persistence?:
    | 'cookie'
    | 'localStorage'
    | { name?: string; type: 'cookie' }
    | { key?: string; type: 'localStorage' }
    | null;
};
```

If a private helper needs the union type, reference it via `YapyakOptions['persistence']`. Never reintroduce a named alias.

### Union variants — inline vs named

For tagged-union variants, inline the variant shape when BOTH hold:

1. Variant is used in exactly one union.
2. Variant has no top-level JSDoc.

Field count is not a test. A 7-field variant inlines fine.

```ts
// ✓ Inline — simple variants, single consumer
type PersistenceOptions =
  | 'cookie'
  | { type: 'cookie'; name?: string }
  | { type: 'localStorage'; key?: string };

// ✓ Named — variant reused OR has top-level JSDoc
type ButtonAtomicProps = { /* used by Button AND ButtonGroup */ };
type ButtonProps = ButtonAtomicProps | ButtonContainerProps;
```

### Additive variants forbidden as union

A discriminated union models semantically distinct shapes. When one variant's fields are a strict subset of another's (purely additive), use a single object type with optional fields.

**Mechanical test:** is variant A's field set a proper subset of B's, with every shared field carrying the same type?

| Result | Action |
| --- | --- |
| Yes — strict subset | Collapse into one type with optional fields |
| No — differ in shape, type, or required combinations | Keep the discriminated union |

```ts
// ✗ Wrong — additive variants masquerading as a union
runtime?: { module: string } | { invoke: string; module: string };

// ✓ Right — single type, optional field
runtime?: { invoke?: string; module: string };
```

### Multi-target options — nested per-target objects

When a function configures multiple output targets, expose per-target options as inline nested objects keyed by target name. Cross-cutting options stay at the top level.

```ts
// ✓
type BuildOptions = {
  outDir: string;                  // cross-cutting
  sourcemap: boolean;              // cross-cutting
  esm?: { entry: string; minify?: boolean };
  cjs?: { entry: string };
};
```

### Defaults — call site

Never pass a value that equals the default. Defaults exist so callers can omit them.

```ts
// ✗ Redundant
<Button disabled={false} />
useState<boolean>(false)

// ✓ Variable
<Button disabled={isDisabled} />
```

Applies to JSX props, function arguments, object literals, class instantiation.

### Defaults — API design

Boolean options default to `false`. Opt-in semantics — features must be explicitly enabled.

```ts
// ✓
type NormalizerOptions = {
  dedupe?: boolean;       // false by default
  stripNulls?: boolean;   // false by default
};

// ✗ — opt-out semantics
type NormalizerOptions = {
  dedupe?: boolean;   // ?? true — forbidden
};
```

If you would otherwise write a bare `?? true` default for a flag, remove the flag and make the behavior unconditional instead. A boolean flag's default is either `false` or a derived expression (see below) — never a bare `?? true`.

**Exception — derived default.** A boolean MAY default to an expression computed from another already-resolved config field. Mechanical test on the `??` fallback: `false` is the norm; a bare `true` is forbidden; an expression referencing 1+ already-resolved fields of the same options object is allowed — a context-derived default (sometimes `true`, sometimes `false` by context), not a blanket opt-out. An external probe (`?? isCI()`, `?? import.meta.env.PROD`) is forbidden — resolve it into a named field first.

```ts
// ✓ — default derived from another field, not a literal
preserveTranslationsOnRename: config.preserveTranslationsOnRename ?? !config.translator,
```

### Argument shape — positional vs options

Mechanical, no judgment.

#### The default rule

1. Required arguments → positional, in conceptual order.
2. Optional arguments → fields in a single trailing `options` object.

A required value never lives in an `options` object.

#### Suffix mechanics

The suffix on the parameter type is binding (pairing with parameter name per [[yapyak-name]]):

| Suffix | Parameter name | Semantics |
| --- | --- | --- |
| `*Options` | `options` | Atomic options bundle. |
| `*Input` | `input` | Internal-helper input bundle. |
| `*Request` | `request` | Complete operation request. |
| `*Context` | `context` | Persistent flow state. |
| `*Config` | `config` | User-declared configuration. |

#### Bundling test — when `*Input`/`*Request`/`*Context`/`*Config` is allowed

Required fields MAY be bundled when one holds:

1. **Forced**: splitting would result in 5+ required positional arguments.
2. **Shared**: the bundle type is consumed by 2+ functions.

Neither holds → bundling is forbidden. Required fields go positional, optional fields go in a `*Options` object.

When only a subset of required fields meets Forced/Shared, bundle that subset; the remaining required fields stay positional in conceptual order.

| Function | Required positional if split | Consumers | Bundle? |
| --- | --- | --- | --- |
| `migrateLocales` | 5+ | 1 | ✓ Forced |
| `autoTranslate` (LocaleContext used by 4) | 4 | 4 | ✓ Shared |
| `createTranslator` (1 req + 4 opt) | 1 | 1 | ✗ `createTranslator(translate, options?)` |
| `walkSourceFiles` (2 req) | 2 | 1 | ✗ `walkSourceFiles(filter, projectRoot)` |

#### Exception A — extending an upstream API

When `class Foo extends UpstreamClass`, match upstream's signature exactly. Adding fields to upstream's `options` object — including required ones — is allowed. New positional arguments are not.

```ts
// ✓ — extends Error; (message, options) is upstream-locked
class YapyakError extends Error {
  constructor(
    message: string,
    options: { code: string; cause?: unknown },
  ) { ... }
}
```

#### Exception B — factory pattern

For factory-by-name (function named after domain object) or `create*` factory:

- No required fields → `*Options` (paired with `options`).
- Any required field → `*Input` (paired with `input`).
- A bundled `*Input` whose fields include a recipe-qualifying cluster (2+ fields shared by 2+ functions) splits per § Refactor recipe; otherwise it stays one `*Input`.

```ts
// ✓ Factory-by-name
function openai(options: { apiKey: string; baseUrl?: string }): Translator;
function cookie(options: { name: string }): Persistence;

// ✓ create* with required fields → *Input
function createTranslator(input: CreateTranslatorInput): Translator;
function createProcessor(input: CreateProcessorInput): Processor;
```

#### Hard cap — 5+ required positional

5+ required positional arguments triggers the refactor recipe. Lift recurring sub-bundles into named domain types per [[yapyak-name]] § Type suffix vocabulary.

#### Refactor recipe

1. List every required field.
2. Cluster by concept: operation input, domain context, optional tweaks.
3. If a cluster (2+ fields) appears in 2+ functions → lift to a shared `*Context`/`*Config`.
4. Function-specific clusters → `*Input` or `*Request`.
5. Optional tweaks → `*Options`.
6. New signature: `fn(input: *Input, context: *Context, ...standalone positionals, options?: *Options)`. Universal positionals (e.g. `projectRoot: string`) stay standalone.

#### Same-type positional ambiguity is not an exception

`transferMoney(from: string, to: string)` keeps both positional. Lean on signature + IDE tooltips. Never move required values into `options` to "self-document" the call site.

### Null/undefined checks

Three-tier rule.

#### 1. Defaulting — always `??`

```ts
// ✓
const localesDir = config.localesDir ?? 'locales';
const temperature = options.temperature ?? 0.2;   // 0 passes through
const shouldApplyInMemory = persistence?.set(value) ?? true;   // false passes through
```

`??` triggers only on `null`/`undefined`. Always prefer over `||` for defaults.

#### 2. Truthy checks — when `T` has no meaningful falsy value

| `T` is | Truthy check safe? |
|---|---|
| object / array / class / function | ✓ |
| string where `''` means "not set" | ✓ |
| number where `0` is invalid | ✓ |
| `boolean` | ✗ — collapses `false` and `undefined` |
| number where `0` is valid | ✗ |
| string where `''` is distinct from `undefined` | ✗ |

`!!x` is idiomatic boolean coercion.

#### 3. `=== undefined` — when falsy values are meaningful

```ts
// ✓ — boolean | undefined where false is a real choice
if (options.detectUserLocale !== undefined) {
  // user explicitly passed true OR false
}

// ✓ — narrowing where 0 must remain usable
if (count === undefined) initialize();
else use(count);
```

For `T | null | undefined`, use `value == null` / `value != null`.

#### No silent fallbacks

`?.` and `??` are reserved for genuine optionality. Never use them for paranoid defensive coding against types you control.

```ts
// ✗ Wrong — masks the real problem
const name = user?.profile?.name ?? 'Unknown';

// ✓ Right — assert presence explicitly
if (user.profile === undefined) {
  throw new Error('User profile missing');
}
const name = user.profile.name;
```

### Return types — no `T | null` for "no work done"

A function that processes input and returns a typed result always returns that type; signal "no change" with a flag, never a nullable return. When `T | null` is legitimately allowed (platform returns, wire formats): see [[yapyak-nullability]].

```ts
// ✗ Wrong
function transformSource(code, options): TransformResult | null { ... }

// ✓ Right — flag tells you if it changed
type TransformResult = { changed: boolean; code: string };
function transformSource(code, options): TransformResult { ... }
```

### Never re-declare upstream types

If a runtime or peer dependency exports a type, import it. Never re-declare it locally. A devDependency-only upstream is never imported at runtime → declare the shape locally.

```ts
// ✗ Wrong — vite is a peer dependency of @yapyak/vite
type Plugin = { name: string; enforce?: 'pre' | 'post' };

// ✓ Right
import type { Plugin } from 'vite';

// ✓ Right — vite is devDependency-only in yapyak; local shape, no import
export type FilterPattern = string | RegExp | (string | RegExp)[];
```

### Prefer `===` over `!==`

Flip ternaries and `if`-statements so the simple branch holds `===`.

```ts
// ✗ Wrong — negation in true branch
const rows = block.head !== null ? [block.head, ...block.body] : block.body;

// ✓ Right — flip so === holds the simple branch
const rows = block.head === null ? block.body : [block.head, ...block.body];
```

For `if`-statements, prefer early return on the negative case:

```ts
// ✓ Right — guard then proceed
function use(value: string | null) {
  if (value === null) {
    handleMissing();
    return;
  }
  doStuff(value);
}
```

**Exception:** `!==` is fine when no equivalent positive form exists (`array.filter((x) => x !== current)`).

### Pass function reference directly

When a callback takes exactly one argument with matching type, pass the function reference directly.

```ts
// ✓ Right
return block.children.map(blockToText).join('');
return items.filter(isActive);

// ✗ Wrong — unnecessary arrow wrapper
return block.children.map((child) => blockToText(child)).join('');
```

Wrap in an arrow only when the function has more arguments, optional parameters that could be polluted by callback extras (e.g. `index` passed to `parseInt`), or argument needs reshaping.

```ts
// ✓ — parseInt has optional radix; .map would pass index as radix
['1', '2', '3'].map((value) => parseInt(value, 10));
```

### Error classes

Custom error types extend `Error` — directly, or via one domain base class that extends `Error` — set `this.name` explicitly, and use ES2022 `cause` for wrapped errors.

```ts
export class ValidationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ValidationError';
  }
}
```

- Always set `this.name` — default `'Error'` gives unhelpful stack traces.
- Use `cause` for wrapped errors instead of stuffing the original into the message.
- Never extend a domain error class to add fields. Compose via `cause` or add fields to a single base class.

Document with `@throws {ErrorName} when [condition].` per [[yapyak-jsdoc]].

### Browser timers — `window.*`

In code that runs in the browser, always call timers on `window`:

```ts
// ✓
window.setTimeout(fn, 100);
window.requestAnimationFrame(fn);

// ✗
setTimeout(fn, 100);
requestAnimationFrame(fn);
```

Applies to `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`, `requestAnimationFrame`, `cancelAnimationFrame`.

### Language atoms

- `readonly` is forbidden in types and array types. Exception: class properties assigned only in the constructor — Biome's `useReadonlyClassProperties` requires the modifier there. `Readonly<T>`, `ReadonlyMap<K, V>`, and `ReadonlySet<T>` are forbidden.
- `Array<T>` and `ReadonlyArray<T>` are forbidden. Use `T[]`. For unions and function types, wrap in parens: `(string | RegExp)[]`, `(() => void)[]`.
- `as unknown as` is forbidden. Fix the type.
- `as` to narrow to a literal union is forbidden. Write an `is*` typeguard.
- `if`-statements always use braces and a newline. No one-line form.
- One property per line in object literals. Exceptions: `{ sync: true }`, `{ timeout: 3000 }`.
- `.then()` chains are forbidden. Always `async`/`await`.
- Nested ternaries are forbidden. Max one `?:` per expression. Extract anything more into a `get*` helper with `switch`.
- `_` prefix is allowed only for:
  1. Reserved-word escape (`_enum`).
  2. Compiler-emitted runtime helpers (`_pick`, matching React's `_jsx`, Vue's `_createBlock`).
  3. Intentionally-unused function parameters where the position is fixed.

## Library

### TypeScript config

- Extend the workspace's `library` tsconfig preset.
- `isolatedDeclarations: true` — every exported function and component must have an explicit return type.

### Public vs internal packages

Before applying the symbol-level visibility model below, classify the package itself. A package is one of:

| Kind | What it means | Installed by end users? | Reference docs? | JSDoc on symbols? | `/internal` subpath? |
|---|---|---|---|---|---|
| **Public** | End users `npm install` and `import` from it directly. | Yes | Yes | Yes, on public + cross-package semi-public symbols | Optional — only when it has cross-package semi-public material |
| **Internal** | Transitively installed via other packages. End users never import it directly. Consumed by sibling packages in the workspace. | No | No | No — the package itself is the boundary | **No** — adding one would be redundant; the whole package is internal |
| **Workspace-private** | `"private": true` in `package.json`. Not published. | No (not on npm) | No | No | No |

An internal package does not need a `/internal` subpath because the whole package is the boundary. Consumers signal "I'm reaching into internals" by depending on the package at all. Adding `/internal` to an already-internal package is ceremony.

JSDoc exception for re-exported types: if an internal package defines a type that a public package re-exports to end users (e.g. `YapyakConfig` lives in `@yapyak/config` but is re-exported from `@yapyak/vite/config`), the JSDoc on that type stays — it surfaces in the user's IDE through the re-export. The "no JSDoc" rule applies only to symbols that are consumed solely by sibling packages.

### Visibility — public, semi-public, private

The 3-tier visibility model, the "would a realistic user type this name?" test, and the Consumption/Annotation/Extension categories live in [[general]] § Visibility. Read that first.

TypeScript-specific storage:

| Level | Where it lives | Reachable via |
|---|---|---|
| **Public** | `src/index.ts` re-exports | Main `package.json exports`: `"."` |
| **Cross-package semi-public** | `src/internal.ts` re-exports | Subpath: `"./internal"` |
| **Intra-package semi-public** | Domain folder barrel only (`src/<domain>/index.ts`) | Relative imports inside `src/` |
| **Private** | Never exported from any barrel | – |

#### Cross-package semi-public uses the `/internal` subpath

When a symbol is consumed by another package in the monorepo but not by external users, expose it via a dedicated `/internal` entry point.

`packages/foo/package.json`:

```json
{
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./internal": { "types": "./dist/internal.d.ts", "default": "./dist/internal.js" }
  }
}
```

`packages/foo/src/internal.ts` — just exports, no comments, no `@internal` tag:

```ts
export { sharedHelper } from './domain/helper';
export type { InternalShape } from './options';
```

`packages/foo/tsup.config.ts`:

```ts
entry: ['src/index.ts', 'src/internal.ts'],
```

Consumers in other monorepo packages:

```ts
import { sharedHelper } from '@yourorg/foo/internal';
```

The `/internal` suffix in the import path is the boundary signal. Reading the import line, the reader knows this reaches into another package's internals.

Packages without cross-package semi-public material don't need an `/internal` entry. Don't add it for ceremony.

#### Intra-package semi-public stays in the domain barrel

When a symbol is used by other files in the SAME package but not by users or other packages, export it from its domain folder's barrel — never from `src/index.ts` or `src/internal.ts`:

```ts
// packages/foo/src/locale/index.ts
export { resetLocale } from './store';
```

```ts
// packages/foo/src/persistence/cookie.ts
import { resetLocale } from '../locale';
```

The domain barrel is intrinsically private — not listed in `package.json exports`, unreachable from outside the package.

#### Private symbols stay unexported

Examples of symbols that need no export at all:

- Type-level helpers used only in another type's body — TypeScript resolves them transparently; users never write them.
- Post-processed option shapes used only inside one function.
- Closure state of an exported factory.

#### Decision flow

1. Used only in one file → keep unexported.
2. Used across files in this package only → export from domain barrel.
3. Used across packages in the monorepo, not by external users → export from `src/internal.ts`. Add `./internal` to `package.json exports`. Add to tsup `entry`.
4. Used by external users → export from `src/index.ts`. Add to `package.json exports` at `.`.

#### Don't use `@internal` JSDoc or `stripInternal`

Older patterns used `@internal` JSDoc + `stripInternal: true` to hide cross-package semi-public symbols inside the main entry. We don't:

- `@internal` is a soft signal — runtime `.js` still ships the symbol; `.d.ts` removal only fires if every consumer's doc tool respects the tag.
- Subpath separation is stricter — `package.json exports` is enforced by Node and bundlers, not by JSDoc convention.
- The `/internal` suffix appears in every import line, signaling the boundary at the call site. JSDoc tags only show in the definition file.

If a symbol shouldn't be in `index.ts` and shouldn't be in `internal.ts`, it doesn't belong in any package-published barrel — put it in a domain barrel or leave it unexported.

### Transitive closure of public types

Any type referenced in a public API signature must itself be exported and reachable in the public barrel.

```ts
// ✗ Wrong — PersistenceConfig referenced from public YapyakOptions, but only defined locally
interface CookiePersistence { ... }                    // not exported
type PersistenceConfig = 'cookie' | CookiePersistence; // not exported

export interface YapyakOptions {
  persistence?: PersistenceConfig | null;   // user sees "PersistenceConfig" but can't navigate to it
}

// ✓ Right — all reachable types are exported and in the barrel
export interface CookiePersistence { ... }
export type PersistenceConfig = 'cookie' | CookiePersistence;
export interface YapyakOptions {
  persistence?: PersistenceConfig | null;
}

// barrel:
export type { CookiePersistence, PersistenceConfig, YapyakOptions } from './options';
```

The rule applies transitively: if `A` is public and references `B`, and `B` references `C`, then `B` and `C` are both public.

Internal post-processed types (`NormalizedOptions`, internal helpers) are NOT in the public API surface and stay unexported — they don't appear in any public signature, so they don't need to be reachable.

#### What counts as "reachable in a public signature"

Transitive closure applies to types the user **names** at the API boundary. It does *not* apply to types that only appear inside another type's body. TypeScript resolves type-body helpers transparently — users never see them.

| Position | Counts as public surface? | Example |
|---|---|---|
| Parameter type | ✓ Yes | `function f(x: Foo)` → `Foo` must be exported |
| Return type | ✓ Yes | `function f(): Bar` → `Bar` must be exported |
| Property type on an exported interface | ✓ Yes | `interface Opts { x: Persist }` → `Persist` must be exported |
| Helper in a type alias body | ✗ No | `type TParams<T> = ... ExtractTParams<T> ...` → `ExtractTParams` stays internal |
| Conditional/mapped type computation | ✗ No | `T extends ... ? Helper<T> : ...` → `Helper` stays internal |
| Internal post-processed shape | ✗ No | `NormalizedOptions` derived from `YapyakOptions` |

```ts
// Public — user writes `TParams` in wrapper code
export type TParams<T extends string> = T extends `${string}{${string}`
  ? ExtractTParams<T>  // ← internal helper, never written by user
  : {};

// Internal — only appears inside TParams's body
type ExtractTParams<TSource extends string, TAccumulator = unknown> = /* ... */;
```

### Error classes

Custom error types extend `Error` directly, set `this.name` explicitly, and use the ES2022 `cause` parameter for wrapped errors. Always document with `@throws { ErrorName } Thrown when [condition].`

```ts
export class ValidationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ValidationError';
  }
}

/**
 * @throws {ValidationError} Thrown when the input fails schema validation.
 */
export function parseConfig(input: unknown): Config { /* ... */ }
```

- Always set `this.name` — default is `'Error'`, which gives unhelpful stack traces.
- Use `cause` for wrapped errors instead of stuffing the original into the message.
- Never extend a domain error class to add fields — compose via `cause` or add fields to a single base class.

### README API Reference sync

Universal rule in [[general]] § Visibility. TypeScript specifics: the CI/check workflow should fail if a public export exists with no README mention (or vice versa).

### Build

- Source code uses `.ts`/`.tsx` extensions in imports. The bundler rewrites to `.js` on emit to `dist/`.
- `package.json` `exports` point to `./dist/**`.
- Every public subpath in `package.json` `exports` has a corresponding entry point in the bundler config — there's a 1:1 mapping between published subpaths and built outputs.
- ESM-only (no dual ESM/CJS emit) — the ecosystem has converged.
- `.d.ts` files emitted alongside `.js` so type-checking works for consumers.

For tsdown-specific conventions, see [[tsdown]].

### JSDoc

Per-visibility rules and format in [[jsdoc]].

### Name conventions — scope signals commitment tier

The npm name itself communicates how stable the package is and what the maintainer promises.

| Tier | Naming | What it signals | Examples |
|---|---|---|---|
| **Semi-OSS** | `@skiftle/*` | Internal-first. Source-shipped. No stability promises. Breaking changes without deprecation cycles. PRs at maintainer's discretion. "Use at own risk." | `@skiftle/ui`, `@skiftle/intl`, `@skiftle/form` |
| **Real OSS** | Unscoped name (e.g. `yapyak`) or its own dedicated scope (e.g. `@yapyak/*` for sub-packages of one OSS product) | Semver discipline. Deprecation cycles for breaking changes. Community PRs welcome. Stable public API. | `yapyak`, `@yapyak/doc-compiler` |

Rules:

- **Never mix tiers under one scope.** `@skiftle/*` is reserved for the semi-OSS tier. A real-OSS project from the same org gets its own name or scope (`yapyak`, not `@skiftle/yapyak`).
- **Sub-packages of a real-OSS product** can share that product's scope (`@yapyak/doc-compiler`, `@yapyak/vite`). The scope IS the product identity in that case, not an org identity.
- **The scope determines policy.** Source-shipping, deprecation policy, contribution guidelines, README tone — all derive from which tier the package sits in.

@~/GitHub/agents/typescript/library/jsdoc.md

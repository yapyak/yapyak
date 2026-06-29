## Visibility

### Package kinds

Classify the package itself before applying the symbol-level model.

| Kind | What it means | Installed by end users | Reference docs | JSDoc on symbols | `/internal` subpath |
|---|---|---|---|---|---|
| **Public** | End users `npm install` and `import` from it. | Yes | Yes | Yes, on public + cross-package semi-public symbols | Optional |
| **Internal** | Transitively installed via other packages. Consumed by sibling packages. | No | No | No — the package itself is the boundary | No |
| **Workspace-private** | `"private": true`. Not published. | No | No | No | No |

An internal package does not need a `/internal` subpath — the whole package IS the boundary. Adding `/internal` to an already-internal package is ceremony.

**JSDoc exception for re-exported types:** if an internal package defines a type that a public package re-exports to end users (e.g. `YapyakConfig` from `@yapyak/config` re-exported by `@yapyak/vite/config`), JSDoc on that type stays.

### Symbol-level visibility

| Level | Where it lives | Reachable via |
|---|---|---|
| **Public** | `src/index.ts` re-exports | Main `package.json exports`: `"."` |
| **Cross-package semi-public** | `src/internal.ts` re-exports | Subpath: `"./internal"` |
| **Intra-package semi-public** | Domain folder barrel only (`src/<domain>/index.ts`) | Relative imports inside `src/` |
| **Private** | Never exported from any barrel | – |

### Default to NOT exposing

Adding a public export later is non-breaking; removing one is breaking. Err on the side of internal.

### The "would a realistic user type this name" test

Before promoting a symbol to public, construct a concrete usage example. If none exists, keep it internal.

A symbol is legitimately public if it serves at least one:

| Category | What it means | Example |
| --- | --- | --- |
| **Consumption** | User invokes it | `createTranslator`, `t` |
| **Annotation** | User references the name as a type | `const opts: CreateClientOptions`, `throw new ConfigurationError` |
| **Extension** | User subclasses or implements against it | `class MyContract extends BaseContract` |

### Cross-package semi-public — the `/internal` subpath

`packages/foo/package.json`:

```json
{
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./internal": { "types": "./dist/internal.d.ts", "default": "./dist/internal.js" }
  }
}
```

`packages/foo/src/internal.ts` — exports only, no comments, no `@internal` tag:

```ts
export { sharedHelper } from './domain/helper';
export type { InternalShape } from './options';
```

`packages/foo/tsdown.config.ts`:

```ts
entry: ['src/index.ts', 'src/internal.ts'];
```

Consumers in other monorepo packages:

```ts
import { sharedHelper } from '@yourscope/foo/internal';
```

The `/internal` suffix in the import path IS the boundary signal. Packages without cross-package semi-public material do not need an `/internal` entry.

### Intra-package semi-public — domain barrel

Symbols used by other files in the same package but not by external users export from their domain folder's barrel — never from `src/index.ts` or `src/internal.ts`:

```ts
// packages/foo/src/locale/index.ts
export { resetLocale } from './store';
```

```ts
// packages/foo/src/persistence/cookie.ts
import { resetLocale } from '../locale';
```

The domain barrel is intrinsically private — not listed in `package.json exports`, unreachable from outside the package.

### Decision flow

1. Used only in one file → keep unexported.
2. Used across files in this package → export from domain barrel.
3. Used across packages, not by external users → export from `src/internal.ts`. Add `./internal` to `package.json exports`. Add to `tsdown` `entry`.
4. Used by external users → export from `src/index.ts`. Add to `package.json exports` at `.`.

### `@internal` JSDoc and `stripInternal` are forbidden

`@internal` is a soft signal — runtime `.js` still ships the symbol. Subpath separation via `package.json exports` is strict; JSDoc convention is not.

If a symbol does not belong in `index.ts` and does not belong in `internal.ts`, it does not belong in any package-published barrel.

### Transitive closure of public types

Any type referenced in a public API signature must itself be exported and reachable in the public barrel.

```ts
// ✗ Wrong — PersistenceConfig referenced from public YapyakOptions, only defined locally
type CookiePersistence = { ... };                    // not exported
type PersistenceConfig = 'cookie' | CookiePersistence;
type YapyakOptions = { persistence?: PersistenceConfig | null };

// ✓ Right — all reachable types exported and in the barrel
export type CookiePersistence = { ... };
export type PersistenceConfig = 'cookie' | CookiePersistence;
export type YapyakOptions = { persistence?: PersistenceConfig | null };
```

#### What counts as "reachable"

Transitive closure applies to types the user names at the API boundary. Helpers inside another type's body do not count.

| Position | Counts as public surface | Example |
|---|---|---|
| Parameter type | ✓ | `function f(x: Foo)` → `Foo` exported |
| Return type | ✓ | `function f(): Bar` → `Bar` exported |
| Property type on exported type | ✓ | `type Opts = { x: Persist }` → `Persist` exported |
| Helper in a type alias body | ✗ | `type TParams<T> = ... ExtractTParams<T> ...` → internal |
| Conditional/mapped type computation | ✗ | `T extends ... ? Helper<T> : ...` → internal |
| Post-processed internal shape | ✗ | `NormalizedOptions` |

### README API Reference sync

If a package README has `## API Reference`, treat it as public surface. When a public symbol is added, removed, or renamed, update the README in the same commit.

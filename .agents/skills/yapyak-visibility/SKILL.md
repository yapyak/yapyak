---
name: yapyak-visibility
description: "Visibility: public vs internal vs private, the `/internal` subpath, transitive closure of exported types. Use when deciding whether a symbol is exported or internal."
---

### Package kinds

Classify the package itself before applying the symbol-level model.

| Kind | What it means | Installed by end users | Reference docs | JSDoc on symbols | `/internal` subpath |
|---|---|---|---|---|---|
| **Public** | End users `npm install` and `import` from it. | Yes | Yes | Yes, on public + cross-package semi-public symbols | Optional |
| **Internal** | Transitively installed via other packages. Consumed by sibling packages. | No | No | No — the package itself is the boundary | No |
| **Workspace-private** | `"private": true`. Not published. | No | No | No | No |

Classify by `package.json`: `"private": true` → Workspace-private (even when sibling packages consume it); else published but not end-user-installed → Internal; else Public.

An internal package does not need a `/internal` subpath — the whole package IS the boundary. An internal package MUST NOT declare a `/internal` subpath. If one exists, remove it.

**JSDoc exception for re-exported types:** if an internal package defines a type that a public package re-exports to end users (e.g. `YapyakConfig` from `@yapyak/config` re-exported by `@yapyak/vite/config`), JSDoc on that type stays.

### Symbol-level visibility

| Level | Where it lives | Reachable via |
|---|---|---|
| **Public** | `src/index.ts` re-exports | Main `package.json exports`: `"."` |
| **Cross-package semi-public** | `src/internal.ts` re-exports | Subpath: `"./internal"` |
| **Intra-package semi-public** | Domain folder barrel only (`src/<domain>/index.ts`) | Relative imports inside `src/` |
| **Private** | Never exported from any barrel | – |

### Default to NOT exposing

Adding a public export later is non-breaking; removing one is breaking. Default private. Promote to public only when a Consumption / Annotation / Extension / Reference example exists (see the test below).

### The "would a realistic user type this name" test

A symbol is public iff a concrete example exists in at least one of these four categories: Consumption, Annotation, Extension, Reference. No other example justifies promotion.

A symbol is legitimately public if it serves at least one:

| Category | What it means | Example |
| --- | --- | --- |
| **Consumption** | User invokes it | `createTranslator`, `t` |
| **Annotation** | User references the name as a type | `const opts: CreateClientOptions`, `throw new ConfigurationError` |
| **Extension** | User subclasses or implements against it | `class MyContract extends BaseContract` |
| **Reference** | User passes the value by name (preset, sentinel, default) | `[...defaultProcessors]`, `retry: DEFAULT_RETRY` |

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

Add `src/internal.ts` to the `tsdown` `entry` — wiring details in [[yapyak-package]].

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

Classify by the widest consumer. First match wins.

1. An external user → `src/index.ts` (the `.` entry).
2. A sibling package, not external → `src/internal.ts` (reached via the `./internal` subpath).
3. 2+ files in this package only → export from the domain barrel.
4. One file only → keep unexported.

Wiring a new subpath's `package.json exports` + `tsdown` `entry`: see [[yapyak-package]].

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
| Inferred or explicit type of an exported default value | ✓ | `function f(x = DEFAULT)` → `typeof DEFAULT` exported |
| Helper in a type alias body | ✗ | `type TParams<T> = ... ExtractTParams<T> ...` → internal |
| Conditional/mapped type computation | ✗ | `T extends ... ? Helper<T> : ...` → internal |
| Post-processed internal shape | ✗ | `NormalizedOptions` |

#### `/internal` surfaces

Apply the closure rule to public surfaces only — the `.` entry and every non-`/internal` subpath. On an `/internal` surface, export exactly the types a sibling package annotates.

- Never closure-export a type from `internal.ts` → promote it when its first Annotation example appears (per the four-category test), through every barrel in the same change.
- Until then, consumers reach sub-shapes via indexed access.

```ts
// ✓ Sub-shape unexported — consumers write SyncLocaleFilesResult['orphaned'][number]
type SyncItem = {
  fileId: string;
  locale: string;
  source: string;
};
export type SyncLocaleFilesResult = {
  orphaned: SyncItem[];
  restored: SyncItem[];
};

// ✗ Closure-export with no Annotation example — keep the sub-shape unexported
export type SyncItem = {
  fileId: string;
  locale: string;
  source: string;
};
```

### README API Reference sync

If a package README has `## API Reference`, treat it as public surface. When a public symbol is added, removed, or renamed, update the README in the same commit.

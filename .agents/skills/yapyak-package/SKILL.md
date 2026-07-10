---
name: yapyak-package
description: "Packaging: `package.json`, `exports`, dependencies, the `tsdown` build, scope tiers, README convention. Use when editing package config, exports, or the build."
---

### TypeScript config

- Library packages extend the workspace's `library` tsconfig preset.
- `isolatedDeclarations: true` — every exported function and component has an explicit return type.
- App packages extend the workspace's `app` tsconfig preset (no `isolatedDeclarations`). TypeScript infers return types.

### Scope signals commitment tier

The npm name communicates stability commitment.

| Tier | Naming | What it signals | Examples |
|---|---|---|---|
| **Semi-OSS** | A non-product `@scope/*` (not `@yapyak/*`) | Source-shipped. No stability promises. Breaking changes without deprecation cycles. | — |
| **Real OSS** | Unscoped (`yapyak`) or dedicated scope (`@yapyak/*`) | Semver discipline. Deprecation cycles. Stable public API. | `yapyak`, `@yapyak/doc-compiler` |

- Never mix tiers under one scope.
- Sub-packages of a real-OSS product share the product's scope (`@yapyak/doc-compiler`).
- The scope determines policy: source-shipping, deprecation, contribution guidelines, README tone.

### `package.json` field order

Biome's `useSortedKeys` is disabled for `package.json`. Alphabetical breaks `exports` resolution (conditions check in key order, first match wins).

Subset of `sort-package-json` canonical:

```
name, version, private, description, keywords, homepage, bugs,
repository, license, author, type, imports, exports, main, types,
sideEffects, files, bin, scripts, dependencies, devDependencies,
peerDependencies, peerDependenciesMeta, optionalDependencies,
engines, packageManager, publishConfig, pnpm, workspaces
```

### `exports` condition order — hard rules

- `"types"` MUST be first (TypeScript stops at first match).
- `"default"` MUST be last (Node fallback).
- `"source"` / `"development"` BEFORE `"import"` / `"require"`.
- Canonical: `types, source, development, browser, node, import, require, default`.

```jsonc
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  }
}
```

Include only conditions needed. Keep relative order regardless of subset. Decision rule: `types` and `default` always. Add `browser`/`node` only when the package ships environment-divergent builds (separate `dist/browser` + `dist/node` outputs exist). Add `source`/`development` only when a `src` export is wired for the dev bundler.

### Sub-path export keys

`"."` first, rest alphabetical.

### Nested objects — alphabetical

`scripts`, `dependencies`, `devDependencies`, `peerDependencies`, `files`, `keywords`, `engines`, `pnpm.overrides`.

### Dependencies

- `^` and `~` in version specifiers are forbidden. All versions are exact. The one exception is `workspace:^` in `peerDependencies` (§ In a pnpm monorepo).
- External `peerDependencies` use `>=X` (library minimum-version contract).
- `engines` uses `>=X`.

#### In a pnpm monorepo

- External dependencies in `dependencies`/`devDependencies` use `catalog:` — never inline version strings. Versions live exactly once in `pnpm-workspace.yaml` under `catalog:`.
- Internal workspace packages use `workspace:*` in `dependencies`/`devDependencies` and `workspace:^` in `peerDependencies` — publish rewrites `workspace:*` to an exact pin; a peer contract needs the caret range.

Adding a new external dep: pin in `pnpm-workspace.yaml` under `catalog:` first, then reference with `"catalog:"`.

```jsonc
// ✓
{
  "dependencies": {
    "vite": "catalog:",
    "@yapyak/typescript-config": "workspace:*"
  },
  "peerDependencies": {
    "react": ">=19",
    "yapyak": "workspace:^"
  },
  "engines": {
    "node": ">=22.12"
  }
}
```

### Build — universal

- Source uses `.ts`/`.tsx` extensions in imports. The bundler rewrites to `.js` on emit.
- `package.json` `exports` points to `./dist/**`.
- 1:1 mapping between published subpaths and built outputs.
- ESM-only — no dual ESM/CJS emit.
- `.d.ts` emitted alongside `.js`.

### Build — `tsdown`

Library packages use `tsdown` (rolldown-powered). One `tsdown.config.ts` per package. Always config file, no CLI form.

```jsonc
// package.json
{ "scripts": { "build": "tsdown" } }
```

#### Shared base config

Standard `tsdown` options live in one shared config package (e.g. `@yapyak/tsdown-config`) that re-exports a pre-seeded `defineConfig`:

```ts
// packages/tsdown-config/src/index.ts
import type { UserConfig } from 'tsdown';

export function defineConfig(overrides: UserConfig): UserConfig {
  return {
    clean: true,
    dts: true,
    fixedExtension: false,
    format: 'esm',
    treeshake: { moduleSideEffects: 'no-external' },
    ...overrides,
  };
}
```

The base config package imports `defineConfig` from raw `'tsdown'`. Every other package imports from the shared wrapper.

#### Standard `tsdown.config.ts` shape

```ts
import { defineConfig } from '@yapyak/tsdown-config';

export default defineConfig({
  entry: ['src/index.ts'],
});
```

With externalized peers:

```ts
import { defineConfig } from '@yapyak/tsdown-config';

export default defineConfig({
  deps: {
    neverBundle: ['react'],
  },
  entry: [
    'src/index.ts',
    'src/internal.ts',
    'src/processor.ts',
  ],
});
```

#### Options table

| Option | Value | Why |
|---|---|---|
| `clean` | `true` | Wipe `dist/` before build. |
| `dts` | `true` | Emit `.d.ts` files. |
| `format` | `'esm'` | ESM-only. |
| `fixedExtension` | `false` | Keep `.js` output extension. |
| `treeshake.moduleSideEffects` | `'no-external'` | Treat externals as side-effect-free. |
| `entry` | array of `src/.../index.ts` | One entry per public `exports` subpath / `bin`. |
| `deps.neverBundle` | array | Force-externalize. |
| `sourcemap` | (omitted) | Libraries do not ship sourcemaps. |
| `minify` | (omitted) | Libraries do not minify. |

`clean` / `dts` / `format` / `fixedExtension` / `treeshake` go in the shared base. A package's own `tsdown.config.ts` carries only `entry` and (when needed) `deps.neverBundle`.

#### Entry-point convention

Every `entry` corresponds to a public subpath in `exports` (or a `bin`). 1:1 mapping.

```ts
entry: [
  'src/index.ts',              // → "."
  'src/internal.ts',           // → "./internal"
  'src/cli/bin.ts',            // → bin
  'src/config/index.ts',       // → "./config"
];
```

Adding a public subpath → add to BOTH `entry` AND `exports` in the same change.

#### `deps.neverBundle` — externalizing

`tsdown` auto-externalizes anything in `dependencies` and `peerDependencies`. Use `neverBundle` only when:

- **Single-instance runtimes** — a dependency whose runtime relies on one shared instance: frameworks the consumer owns (`react`, `vue`, `svelte`, `@sveltejs/kit`, `vite`), React-context owners, plugin registries. Bundling a second copy breaks the singleton.
- **Sibling workspace runtime imports** — `yapyak/runtime` replaced at consumer build time.
- **Vendor compilers pulled in only for types/AST** — `@vue/compiler-sfc`.

A regular npm dependency never goes in `neverBundle`.

#### File order in `tsdown.config.ts`

Top-level keys are alphabetical. Inside `entry`, `src/index.ts` first, then alphabetical.

### Package README convention

Every `packages/*` README has a blockquote one line under the title:

```
> [Internal · ]<Node-only | Browser-only | Universal>
```

- `Internal` added when `"private": true` or package is workspace-consumed only.
- Omit the runtime classifier iff the package's `dist` ships no `.js` with runtime logic (every export is a type, or the only `.js` is a passthrough `defineConfig`). Otherwise classify by the `engines` / `browser` fields: `browser` set → Browser-only; `engines.node` only → Node-only; neither field → Universal.

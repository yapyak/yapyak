---
name: yapyak-package
description: "Packaging: `package.json`, `exports`, dependencies, the `tsdown` and `svelte-package` builds, scope tiers, README convention. Use when editing package config, exports, or the build."
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
| **Real OSS** | Unscoped (`yapyak`) or dedicated scope (`@yapyak/*`) | Semver discipline. Deprecation cycles. Stable public API. | `yapyak`, `@yapyak/react` |

- Never mix tiers under one scope.
- Sub-packages of a real-OSS product share the product's scope (`@yapyak/docs-compiler`).
- The scope determines policy: source-shipping, deprecation, contribution guidelines, README tone.

### Nested workspace packages

- Name a nested workspace package after its full path: `@yapyak/` + path segments joined with `-`.
- The directory carries only its own noun — the parent segment supplies the prefix.

| Path | Package name |
|---|---|
| `docs/compiler` | `@yapyak/docs-compiler` |
| `e2e/sandbox` | `@yapyak/e2e-sandbox` |

### Root tool scope

Scope each root script by workspace class. Apps: `docs`, `examples/*`, `e2e/sandbox`.

| Tool | Scope |
|---|---|
| `check` / `typecheck` / `test` | every workspace |
| `knip` | every workspace except apps and `packages/*-config` |
| `build` | every workspace another workspace resolves through `dist` |
| `test:coverage` | published packages only |

Name a shared config package `<tool>-config` — the `*-config` suffix is what scopes it out of `knip` and coverage.

### `exports` conditions

- Include only conditions needed: `types` and `default` always.
- Add `browser`/`node` only when the package ships environment-divergent builds (separate `dist/browser` + `dist/node` outputs exist).
- Add `source`/`development` only when a `src` export is wired for the dev bundler.

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

### Dependencies

- `^` and `~` in version specifiers are forbidden. All versions are exact.
- External `peerDependencies` use `>=X` (library minimum-version contract).
- A vendor compiler is a `peerDependency` iff the host framework guarantees it in the consumer's project (`@vue/compiler-sfc`); otherwise it is a regular dependency (`@astrojs/compiler-rs`).
- `engines` uses `>=X`.

#### In a pnpm monorepo

- External dependencies in `dependencies`/`devDependencies` use `catalog:` — never inline version strings. Versions live exactly once in `pnpm-workspace.yaml` under `catalog:`.
- Internal workspace packages use `workspace:*` — in `dependencies`, `devDependencies`, and `peerDependencies` alike. Publish rewrites it to an exact pin; `/internal` carries no cross-version guarantee, so a caret peer promises combinations the packages do not keep.

Add a new external dep with `pnpm add <pkg>` in the consuming package — `catalogMode: strict` + `savePrefix: ''` write the exact version to the catalog and reference `"catalog:"`.

#### Changeset bumps

- Every changeset declares `patch`; breaking changes carry their migration in the changeset text. With `workspace:*` peers a `minor` escalates every peer dependent to `major` and the fixed group with it, at any version.
- Declare `minor` or `major` only as part of the user's decision to release 1.0.0, in one change: switch the `yapyak` peer to `workspace:^`, set `onlyUpdatePeerDependentsWhenOutOfRange: true` in `.changeset/config.json`, and remove `scripts/verify-changesets.mjs` with its CI `changesets` job. Caret peers stay narrow below 1.0.0, so there is no intermediate 0.y line — graduation goes straight to 1.0.0.

```jsonc
// ✓
{
  "dependencies": {
    "vite": "catalog:",
    "@yapyak/typescript-config": "workspace:*"
  },
  "peerDependencies": {
    "react": ">=19",
    "yapyak": "workspace:*"
  },
  "engines": {
    "node": ">=22.22"
  }
}
```

### Build — universal

- Relative imports are extensionless: `./storage`, never `./storage.js` or `./storage.ts`.
- Framework single-file components keep their mandatory extension: `.vue`, `.svelte`, `.astro`.
- `package.json` `exports` points to `./dist/**`.
- 1:1 mapping between published subpaths and built outputs.
- ESM-only — no dual ESM/CJS emit.
- `.d.ts` emitted alongside `.js`.

### Build — `tsdown`

Library packages use `tsdown` (rolldown-powered), except packages carrying `.svelte` source — see § Build — `svelte-package`. One `tsdown.config.ts` per package. Always config file, no CLI form.

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

### Build — `svelte-package`

A package whose `src` carries `.svelte` or `.svelte.ts` files builds with `@sveltejs/package` — rolldown compiles neither extension.

- `svelte-package` owns `dist/` alone. Never run it and `tsdown` into one output directory.
- Set the `build` script to `svelte-package --input src --output dist --tsconfig tsconfig.build.json`.
- Add `tsconfig.build.json` extending `./tsconfig.json` with `isolatedDeclarations: false`. `svelte2tsx` generates the component shims that emit `.d.ts`, and generated code satisfies no declaration rule; `tsc --noEmit` keeps the flag on for the hand-written source.
- Hand-write `<component>.svelte.d.ts` beside a component carrying a `generics` attribute. `svelte-package` prefers it over the generated file.
- Set `preprocess: vitePreprocess({ script: true })` in `svelte.config.js`. Without `script: true` the emitted `.svelte` files keep their TypeScript.
- Exclude the compiled tests from `files`: `"!dist/**/*.test.*"`.
- Add the `svelte` export condition beside `types` and `default`, pointing into `dist`.
- Ship no TypeScript — `vite-plugin-svelte` prebundles Svelte libraries in dev by default and compiles them with no TypeScript step, so a published `.svelte.ts` is a parse error in every consumer.
- Chain `publint` and `attw` onto the `build` script. `tsdown` runs both on its own; `svelte-package` runs neither.

```jsonc
// ✓
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "svelte": "./dist/index.js",
      "default": "./dist/index.js"
    }
  }
}
```

```jsonc
// ✗ prebundling meets TypeScript
{
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "svelte": "./src/index.ts",
      "default": "./src/index.ts"
    }
  }
}
```

### Package README convention

Every `packages/*` README has a blockquote one line under the title:

```
> [Internal · ]<Node-only | Browser-only | Universal>
```

- `Internal` added when `"private": true` or package is workspace-consumed only.
- Omit the runtime classifier iff the package's `dist` ships no `.js` with runtime logic (every export is a type, or the only `.js` is a passthrough `defineConfig`). Otherwise classify by the `engines` / `browser` fields: `browser` set → Browser-only; `engines.node` only → Node-only; neither field → Universal.

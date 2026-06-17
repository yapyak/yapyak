## Package — `tsdown`

`tsdown` is the bundler for library packages (rolldown-powered, the spiritual successor to `tsup`). ESM-only, `.d.ts` emit, one `tsdown.config.ts` per package.

### Config file, always — no CLI form

Unlike `tsup`, library packages here always use a `tsdown.config.ts` (even for a single entry), and `"build": "tsdown"` in `package.json` scripts. The config is where `entry` and externalization live, and keeping it in a file means a single grep finds every package's build shape.

```jsonc
// package.json
{ "scripts": { "build": "tsdown" } }
```

### Shared base config in a monorepo

In a workspace, the standard tsdown options live in **one** shared config package (e.g. `@scope/tsdown-config`) that re-exports a pre-seeded `defineConfig`. Every package's `tsdown.config.ts` imports that wrapper and supplies only what's package-specific (`entry`, externalized deps).

```ts
// packages/tsdown-config/src/index.ts — the shared wrapper
import type { UserConfig } from 'tsdown';

export function defineConfig(overrides: UserConfig): UserConfig {
  return {
    clean: true,
    dts: true,
    fixedExtension: false,
    format: 'esm',
    treeshake: {
      moduleSideEffects: 'no-external',
    },
    ...overrides,
  };
}
```

The base config package itself imports `defineConfig` from raw `'tsdown'`; everyone else imports from the shared wrapper.

### Standard `tsdown.config.ts` shape

```ts
import { defineConfig } from '@scope/tsdown-config';

export default defineConfig({
  entry: [
    'src/index.ts',
  ],
});
```

With externalized peers:

```ts
import { defineConfig } from '@scope/tsdown-config';

export default defineConfig({
  deps: {
    neverBundle: [
      'react',
    ],
  },
  entry: [
    'src/index.ts',
    'src/internal.ts',
    'src/processor.ts',
  ],
});
```

### Standard options — what to set, what to leave default

| Option | Value | Why |
|---|---|---|
| `clean` | `true` | Wipe `dist/` before build. Avoids stale outputs leaking between runs. |
| `dts` | `true` | Emit `.d.ts` files. Required for typed library publishing. |
| `format` | `'esm'` | ESM-only. The ecosystem has converged — no dual ESM/CJS emit. |
| `fixedExtension` | `false` | Keep the `.js` output extension (not `.mjs`), so `exports` map to `./dist/*.js`. |
| `treeshake.moduleSideEffects` | `'no-external'` | Treat external modules as side-effect-free so they tree-shake; keep this in the shared base, not per package. |
| `entry` | array of `src/.../index.ts` | One entry per public `exports` subpath / bin in `package.json` (set per package). |
| `deps.neverBundle` | array | Force-externalize specific deps that tsdown would otherwise inline (see below). |
| `sourcemap` | (omitted, defaults off) | Sourcemaps not shipped for library output. |
| `minify` | (omitted, defaults off) | Libraries don't minify — consumers' bundlers do. |

Set `clean` / `dts` / `format` / `fixedExtension` / `treeshake` **once** in the shared base. A package's own `tsdown.config.ts` should usually carry only `entry` and, when needed, `deps.neverBundle`.

### Entry-point convention

Every entry in `entry: [...]` corresponds to a public subpath in `package.json` `exports` (or a `bin`). The mapping is 1:1.

```ts
// tsdown.config.ts
entry: [
  'src/index.ts',              // → "."
  'src/internal.ts',           // → "./internal"
  'src/cli/bin.ts',            // → bin
  'src/config/index.ts',       // → "./config"
]
```

```jsonc
// package.json
{
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./internal": { "types": "./dist/internal.d.ts", "default": "./dist/internal.js" },
    "./config": { "types": "./dist/config/index.d.ts", "default": "./dist/config/index.js" }
  }
}
```

Adding a new public subpath → add to BOTH `entry` AND `exports` in the same change.

### `deps.neverBundle` — externalizing

By default tsdown bundles local/relative code and auto-externalizes anything in `dependencies` and `peerDependencies`. Use `deps.neverBundle` to force a module to stay external when it would otherwise be inlined or when it **must** resolve to the consumer's copy:

- **Frameworks the consumer owns** — `react`, `vue`, `svelte`, `@sveltejs/kit`, `@tanstack/react-start`, `vite`. Bundling a second copy breaks singletons (hooks, reactivity, the plugin pipeline).
- **Sibling workspace runtime imports** — e.g. a self-referential subpath like `yapyak/runtime` that is replaced at the consumer's build time.
- **Vendor compilers pulled in only for types/AST** — `@vue/compiler-sfc`, `@vue/compiler-core`.

```ts
deps: {
  neverBundle: [
    'svelte',
    '@sveltejs/kit',
  ],
},
```

A regular npm package the library genuinely depends on never goes in `neverBundle` — it's already externalized via `dependencies`/`peerDependencies`. Reach for `neverBundle` only when the default would bundle something that must stay a peer.

### File order in `tsdown.config.ts`

`src/index.ts` (the root export) goes first in `entry: [...]`, then the rest alphabetically. This matches the `exports` ordering convention (`"."` first, rest alphabetical). Keep `deps` above `entry` (alphabetical top-level keys).

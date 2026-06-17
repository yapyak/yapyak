## package-json

Biome's `useSortedKeys` is disabled for `package.json` files. Alphabetical sorting breaks Node's `exports` resolution — conditions are checked in key order, first match wins.

### Top-level field order

Subset of `sort-package-json` canonical:

```
name, version, private, description, keywords, homepage, bugs,
repository, license, author, type, imports, exports, main, types,
sideEffects, files, bin, scripts, dependencies, devDependencies,
peerDependencies, peerDependenciesMeta, optionalDependencies,
engines, packageManager, publishConfig, pnpm, workspaces
```

### `exports` condition order — hard rules

- `"types"` MUST be first (TypeScript stops at first match)
- `"default"` MUST be last (Node resolver fallback)
- `"source"` / `"development"` BEFORE `"import"` / `"require"`
- Full canonical order: `types, source, development, browser, node, import, require, default`

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

Include only conditions a package needs; keep the relative order regardless of which subset is present.

### Sub-path export keys

`"."` first, rest alphabetical.

### Nested objects

`scripts`, `dependencies`, `devDependencies`, `peerDependencies`, `files`, `keywords`, `engines`, `pnpm.overrides`: alphabetical.

### Package README convention

Every `packages/*` README has a blockquote one line under the title:

```
> [Internal · ]<Node-only | Browser-only | Universal>
```

- `Internal` is added when `package.json` has `"private": true` or the package is workspace-consumed only.
- Runtime classifier (`Node-only` / `Browser-only` / `Universal`) is omitted only for config-only packages with no executable code.

## Dependencies

### Always (any project)

- **Never** use `^` or `~` in version specifiers. All versions are exact.
- **peerDependencies** use `>=X`-ranges (library minimum-version contract — these are not installed by pnpm).
- **`engines`** uses `>=X`.

### In a pnpm monorepo workspace

- **All external dependencies** in `dependencies`/`devDependencies` use `catalog:` — never inline version strings. Versions live exactly once in `pnpm-workspace.yaml` under `catalog:`.
- **Internal workspace packages** use `workspace:*`.

Adding a new external dep: pin the exact version in `pnpm-workspace.yaml` under `catalog:` first, then reference with `"catalog:"` in the consuming `package.json`.

```jsonc
// ✓ Right
{
  "dependencies": {
    "vite": "catalog:",
    "@yourscope/typescript-config": "workspace:*"
  },
  "peerDependencies": {
    "react": ">=19"
  },
  "engines": {
    "node": ">=22"
  }
}

// ✗ Wrong
{
  "dependencies": {
    "vite": "^8.0.0",        // caret forbidden
    "react": "19.0.0"        // inline forbidden in monorepo — use catalog:
  }
}
```

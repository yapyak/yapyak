# CLAUDE.md

## Project

`lokale` is a monorepo of i18n libraries: a runtime (`core`), a compiler, a React adapter, a Vite plugin, and a CLI. The product name is "lokale" — package scope is `@lokale/*`. Library export is `createIntl()`; the convention for the variable is `intl`.

## Conventions (strict)

### File naming

- All files and folders use kebab-case. No exceptions.
- Filename matches primary export by spelling, not casing: `createIntl` → `create-intl.tsx`, `useLocale` → `use-locale.ts`.

### Modules

- **Named exports only.** Never `export default`.
- One concept per file.
- `index.ts` re-exports the public API of a package.

### TypeScript

- All library packages extend `@lokale/typescript-config/library`.
- `isolatedDeclarations: true` — every exported function and component must have an explicit return type.
- Never use the `readonly` modifier.
- Never use `as unknown as` to make code compile. Fix the type instead.

### React

- Props type is an exported interface in the same file: `export interface ProviderProps`.
- Props are destructured on the first line of the function body, not in the signature.
- Defaults are set in destructuring assignment.
- `...restProps` is spread onto the root element when wrapping a native or base element.

### Hooks

- One hook per file: `use-locale.ts`.
- Options/return types named `Use[Name]Options` / `Use[Name]Return`.

### Refs

- DOM root ref always named `element`.
- Other refs suffix `Ref`: `timerRef`, `onChangeRef`.
- `$`-prefix reserved for ref extractions: `const $element = element.current`.
- Always call `setTimeout`/`setInterval`/`clearTimeout`/`clearInterval`/`requestAnimationFrame` on `window`.
- Timeout/interval refs typed `useRef<number>(undefined)` — never `useRef<ReturnType<typeof setTimeout>>`.

### Control flow

- Always use braces and a newline. No one-line `if`-statements.

### Object literals

- One property per line. Exceptions: well-known patterns like `{ sync: true }`, `{ timeout: 3000 }`.

### Comments

- Default to no comments. Add only when the WHY is non-obvious and the code itself cannot communicate it.
- No multi-line comments, no JSDoc on internal symbols.

### Build

- No build step for libraries. Ship `src/` directly. `package.json` exports point to `./src/index.ts`.

### Versioning

- Use `workspace:*` for internal package references.
- Use `catalog:` for shared external dependencies (defined in `pnpm-workspace.yaml`).

### Formatting

- Always run `pnpm check:write` after changes.

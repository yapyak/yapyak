## Imports

### The one rule

> **Relative imports stay inside your own module. Crossing out of the module uses an alias.**

A "module" is the logical unit a folder represents. Most modules are a single file. Some are a **barrel file + co-located implementation folder** sharing the same name — e.g. `content-layout.tsx` next to `content-layout/`, or `node.tsx` next to `node/`. Together they are ONE module split for organizational reasons.

```ts
// In: src/components/content-layout/toolbar.tsx
// (toolbar.tsx is part of the content-layout module — same module as ../content-layout.tsx)

// ✓ Relative — staying inside the same module
import { useContentLayout } from '../content-layout';
import { Sidebar } from './sidebar';

// ✓ Alias — reaching a different module
import { Box } from '#components/box';
import { useLocale } from '#hooks/use-locale';
```

The decision:

- **Same module** (current folder, sub-folders of current folder, or the parent barrel file when this folder is the implementation half of a module) → relative (`./...` or `../<own-module-name>`)
- **Different module** anywhere else in the project → `#alias/*`

`../` is **only ever allowed** when going from an implementation folder up to its own barrel file (or to another file within the same module). It is **never used to reach a sibling or distant module**.

```ts
// ✓ Allowed `../` — implementation file reaching its own module's barrel
// (src/components/content-layout/toolbar.tsx → src/components/content-layout.tsx)
import { useContentLayout } from '../content-layout';

// ✗ Forbidden `../` — reaching a different module
import { Button } from '../../components/button';
import { useLocale } from '../hooks/use-locale';
import { Persistence } from '../persistence';
```

### Mechanism — package.json `imports` field

Aliases are configured via Node's `imports` field in package.json. The `#`-prefix is mandatory (Node treats `#name` as the self-reference namespace).

```jsonc
{
  "imports": {
    "#components/*": "./src/components/*",
    "#hooks/*": "./src/hooks/*",
    "#lib/*": "./src/lib/*",
    "#utils/*": "./src/utils/*"
  }
}
```

Tooling (TypeScript, Vite, esbuild, Vitest) reads this directly — no separate `tsconfig.paths` entry needed.

### When to configure aliases

**Configure an alias for every top-level domain folder** the project has. If a folder exists at the top level of `src/` and code in other folders imports from it, it gets an alias.

Common aliases:

| Alias | Maps to | Holds |
|---|---|---|
| `#components/*` | `./src/components/*` | UI components |
| `#hooks/*` | `./src/hooks/*` | React hooks |
| `#lib/*` | `./src/lib/*` | Library code, integrations, internal SDKs |
| `#utils/*` | `./src/utils/*` | Pure helpers, formatters, parsers |
| `#types` | `./src/types.ts` | Shared type definitions (singular file, no `/*`) |
| `#docs/*` | `./src/docs/*` | Domain content (in docs apps) |
| `#config/*` | `./src/config/*` | App config (in backend services) |

**Exception:** if a project has only one top-level folder under `src/` (e.g. a small library with everything in `src/runtime/`), aliases aren't needed.

### `lib/` vs `utils/` — when to put what where

Deterministic split:

- **`lib/`** — domain-aware code. Knows about the project's specific abstractions. Wraps external libraries with project conventions (`lib/form.ts` re-exports `@skiftle/form` with project tweaks). Often imports from `#components/*` or other domain folders.
- **`utils/`** — pure, domain-agnostic helpers. Takes simple input, returns output. No knowledge of the rest of the project. Could be copy-pasted to another codebase and still work (`utils/format-currency.ts`, `utils/parse-iso-date.ts`).

Test: **could this file be lifted into a separate package without modification?**
- Yes → `utils/`
- No (depends on project context) → `lib/`

### Import statement order

Defer to Biome's `organizeImports` (or equivalent) — don't hand-order. The tooling enforces a canonical order:

1. `import type` statements (separated group)
2. External package imports
3. Internal alias imports (`#*`)
4. Relative imports (`./`)

Each group alphabetized. Blank line between groups.

```ts
import type { ReactNode } from 'react';
import type { ButtonProps } from '#components/button';

import { useState } from 'react';

import { Box } from '#components/box';
import { useLocale } from '#hooks/use-locale';

import { ButtonText } from './text';
```

### Library packages — exception

Library packages (TS libraries published to npm) use **relative paths to module barrels** (`./module/index.ts`) instead of `#alias/*`, because:

- Libraries have shallower structure (one or two levels of nesting)
- The `imports` field complicates bundler/dist resolution
- Module barrels (`module/index.ts`) provide the same encapsulation

For libraries, the rule relaxes to: **same folder → `./sibling`; cross-module → `./module/index.ts`** (always via barrel, per [[library]]).

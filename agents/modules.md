## Modules

### Export form

- Named exports only. `export default` is forbidden.
- One concept per file.
- `index.ts` re-exports the public API of a folder/module.

### Mechanical file-extraction rule

A symbol lives in its own file when ANY is true. Otherwise, inline it in its sole consumer.

| Test | Action |
| --- | --- |
| Imported by 2+ files | Own file |
| In a public/internal barrel (`index.ts`, `internal.ts`) | Own file |
| Has its own `.test.ts` | Own file |
| Peer-instance pattern (one of N siblings in a peer-folder: `commands/`, `persistence/`) | Own file |

If a standalone file has exactly 1 consumer and no exception applies, move it into the consumer and delete the file. A symbol with 0 consumers gets its own file; if it stays 0-consumer it is dead code — delete it.

Types follow the same logic. Used by 1 file → declare locally. Used by 2+ → exported from shared location.

A **peer-folder** holds N files that each implement the same shape, chosen at runtime by a key (one `Command` per file in `command/`, one `Persistence` in `persistence/`); its name is the singular of that shape.

### File size is never a trigger

| Forbidden justification | Why wrong |
| --- | --- |
| "File is large (500+ LOC)" | Size measures volume, not coupling. |
| "Functions are conceptually distinct" | Single-consumer = inline. |
| "Splitting improves organization" | The 4-trigger table IS the organization rule. |
| "Cognitive load reading top-to-bottom" | Editor folding solves this. |
| "Each helper deserves its own home" | Single-consumer helpers belong in their consumer. |
| "Adding test coverage requires extraction" | Test the public API. |

### Coherent module — when 700+ LOC is correct

A file stays together regardless of size when ALL hold:

1. One public entry point drives all other symbols.
2. Sub-functions operate on the same input/output types.
3. No external consumers of helpers.
4. Every helper is called (directly or transitively) only by the single public entry point.

Evaluate these conditions after extracting every trigger-firing symbol — the exception protects only the symbols with 0 triggers.

### Pre-split checklist

Before proposing any split:

1. List every symbol to extract.
2. For each, count triggers from the 4-trigger table.
3. If every candidate has 0 triggers → the split is forbidden.
4. If the justification appears in the forbidden table → the split is forbidden.
5. If the file is a coherent module per the 4 conditions → the split is forbidden.

Splitting is allowed only when at least one candidate has 1+ trigger AND no forbidden justification drives the proposal.

### Folder threshold

A folder exists when at least one is true:

1. 2+ files share a concept — the folder name describes the shared concept.
2. The folder is a public subpath, exposed via `package.json` `exports`.

A folder always has an `index.ts` barrel. Cross-folder imports go through the barrel.

Single-file concepts do not get folders. A standalone `parser.ts` stays a file until a second file joins it.

Folder names are singular: `adapter/`, `locale/`, `runtime/`. Plural only for peer-item dictionary folders (`cli/command/`), or app framework-scaffolding (`components/`, `hooks/`, `routes/`, `styles/`) — see [[naming]] § Singular vs plural.

#### When to split into sub-folders

- Create a sub-folder only when the folder has 5+ files AND 2+ of them resolve (per the naming algorithm) to names sharing a common leading domain segment; the sub-folder is named after that segment.
- When 2+ leading segments each have 2+ files, split each into its own sub-folder; if that would leave 0 files at the top level, rename the folder after the dominant segment instead.
- Otherwise, stay flat.

### `index.ts` is always a barrel

`index.ts` never contains implementation. It exists for one purpose: re-exporting from named files.

| Lives in | What |
|---|---|
| `index.ts` | `@packageDocumentation` JSDoc, `export {...} from ...` re-exports, `import './x';` side-effect imports. Nothing else. |
| Named file | Implementation. JSDoc on the export itself. |

Named imports (`import { X } from './x'`) and default imports are forbidden in barrels — they create local bindings that imply hidden use.

### `utils/` and `helpers/`

Forbidden in **library code** (published `packages/*`). Every utility has a concept — name the file after it.

| Situation | Correct response |
| --- | --- |
| 1 utility, 1 consumer | Inline at consumer |
| 1 utility, 2+ consumers | Concept-named file (`pluralize.ts`, `dedupe.ts`) |
| Multiple unrelated utilities | Split into concept files, each in its own home |
| Multiple tightly-related utilities | Merge into concept file (`string-format.ts`) |

**App-code exception.** Private app packages MAY keep a single top-level `src/utils/` for pure, domain-agnostic helpers — see § `lib/` vs `utils/` in apps below. `helpers/` stays forbidden everywhere.

### Decision flow when writing new code

1. New exportable symbol → file matching its name (kebab-case primary export).
2. Existing folder fits → add the file there. If consumed from outside, add to barrel.
3. No existing folder fits, single new file → place it in the directory of its consumer (the importing module); if consumed from several modules, the nearest shared ancestor directory. No folder yet. A pure, domain-agnostic helper in an app package goes in `src/utils/` instead (see § `lib/` vs `utils/`).
4. Multiple new files share a new concept → create folder + barrel.

### Cross-module imports — library packages

Library packages use **relative paths to module barrels** (`./module/index.ts`) instead of alias-prefixed imports:

- Same folder → `./sibling`
- Cross-module → `./module` (always via barrel)

`../` is allowed only when reaching from an implementation folder up to its own barrel file. Never used to reach a sibling or distant module.

```ts
// ✓ Same folder
import { Sidebar } from './sidebar';

// ✓ Cross-module via barrel
import { parseSourceFile } from './parser';

// ✗ `../` to reach a different module
import { Button } from '../../components/button';
```

### Cross-module imports — app packages

App packages use the `#alias/*` pattern via `package.json` `imports`:

```jsonc
{
  "imports": {
    "#components/*": "./src/components/*",
    "#hooks/*": "./src/hooks/*",
    "#lib/*": "./src/lib/*",
    "#utils/*": "./src/utils/*",
    "#types": "./src/types.ts"
  }
}
```

Decision:

- Same module (current folder, sub-folders, or parent barrel of an implementation-folder pair) → relative.
- Different module → `#alias/*`.

```ts
// ✓ Relative — same module
import { useContentLayout } from '../content-layout';

// ✓ Alias — reaching a different module
import { Box } from '#components/box';
```

#### `lib/` vs `utils/` in apps

Private app packages get exactly **one** top-level `src/utils/` and **one** top-level `src/lib/` — never nested `utils/` folders inside feature directories.

- `utils/` — **pure, domain-agnostic** helpers. No import of any project package, no project domain type. Could be copy-pasted into an unrelated codebase and still work.
- `lib/` — **domain-aware** code. Imports a project package or domain type, or wraps an external library with a project-specific API or domain type.

**The lift test** — could this file be lifted into a separate package without modification?

- Yes → `utils/` (`merge-class-names.ts`, `merge-refs.ts`, `format-currency.ts`)
- No → `lib/` (anything importing `@yapyak/*`, a generated type, or app-specific content)

A file that imports from a project package but is otherwise generic still goes in `lib/` — the import is the domain coupling. If the lift test is ambiguous because the file has zero imports, it is domain-agnostic → `utils/`.

### Import statement order

Defer to Biome's `organizeImports`. Canonical order:

1. `import type` statements (separated group).
2. External package imports.
3. Internal alias imports (`#*`).
4. Relative imports (`./`).

Each group alphabetized. Blank line between groups.

### Test files

- Unit tests: `*.test.ts` co-located next to implementation.
- Type-only tests: `*.test-d.ts`.
- One test file per implementation file. Never a `tests/` folder.
- Test filename mirrors source filename exactly. See [[naming]] § Test files.

# Parser fixtures

Input files for the compiler/parser tests. They are read as **raw text** via
`readFileSync` + `ts.createSourceFile` (see `../*.test.ts`) and fed through
yapyak's own AST logic — they are never type-checked or executed.

## Why every file starts with `// @ts-nocheck`

Several fixtures are *intentionally* invalid yapyak usage (the `diagnostic/`
files exercise `YPK1xx`/`YPK2xx` build-time diagnostics), and some use syntax
that doesn't fully resolve from inside this framework-agnostic package (e.g. JSX
has no runtime here). These files are already excluded from `tsc`
(`../../../../tsconfig.json` → `exclude`) and ignored by knip, but the
editor's language server still type-checks an open, excluded file via an
inferred project and shows squiggles. `// @ts-nocheck` silences that.

It is loss-free: the compiler diagnostics are asserted on parsed text (by
`code`, not position), and the type-level guarantees of `t()` are covered
separately by the `*.test-d.ts` suites. `@ts-nocheck` is never reported as an
unused directive, so it is applied uniformly to keep the rule simple: **every
fixture is `@ts-nocheck`.**

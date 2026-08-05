# Parser fixtures

Input files for the compiler/parser tests. They are read as **raw text** via
`readFileSync` + `ts.createSourceFile` (see `../*.test.ts`) and fed through
yapyak's own AST logic. They are never type-checked or executed.
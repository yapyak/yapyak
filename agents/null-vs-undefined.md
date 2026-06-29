## `null` vs `undefined`

Mechanical, deterministic. Two reviewers reach the same answer on any line.

### Type decision

Apply top to bottom. First match wins.

```
Q1: Literal value required by an external API?
    (e.g. JSON.stringify(x, null, 2), CSS value, 3rd-party config option)
    YES → null
    NO  → Q2

Q2: Type owned by a platform or 3rd-party library?
    (DOM: localStorage.getItem, Headers.get, Element.closest, Document.querySelector;
     parser ASTs: @formatjs/*, typescript.*, @markdoc/*;
     Node: process.X, fs callbacks)
    YES → mirror the upstream type's exact nullability verbatim (`T | null`, `T | undefined`, or `T`). Never substitute.
    NO  → Q3

Q3: Does the value cross a JSON.stringify boundary
    where the key MUST appear in the output?
    (on-disk JSON, persisted state, wire format between packages, RPC payloads)
    YES → `T | null` (and the field is NON-optional: `field: T | null`)
    NO  → Q4

Q4: Runtime typeof-quirk guard?
    (`typeof x === 'object' && x !== null` — because `typeof null === 'object'`)
    YES → keep `=== null` / `!== null` at the runtime check
    NO  → undefined
```

### Expression decision

Only reached when Q4 says `undefined`.

```
S1: Object/interface field?
    YES → `field?: T` and omit the key when absent.
         FORBIDDEN: `field: T | undefined` paired with `field: undefined` literal.
    NO  → S2

S2: Function parameter?
    YES → `param?: T` and omit at call site.
         FORBIDDEN: calling `f(undefined)` to mean "no value".
         To clear a mutable slot, define `resetX()` instead.
    NO  → S3

S3: Function return for "not found / absent"?
    YES → return type `T | undefined`, value `return undefined;`.
    NO  → S4

S4: Mutable local or module variable?
    YES → `let x: T | undefined;` (no init, no `= null`, no `= undefined`)
```

### Allowed `null` — closed list

`null` appears in source only when one is true:

| Category | Example |
|---|---|
| 3rd-party API literal arg | `JSON.stringify(x, null, 2)` |
| Platform return type | `Headers.get()` returns `string \| null` |
| JSON wire-format field | `type Block = { label: string \| null }` (serialized to disk) |
| Runtime typeof guard | `if (typeof x === 'object' && x !== null)` |

Any other `null` is a violation.

### Forbidden patterns

1. `field: undefined` as a value in an object literal. Use `field?: T` and omit the key.
2. `f(undefined)` to signal "absent". Make the parameter optional and call `f()`, or define `resetX()`.
3. `let x: T | undefined = null`. Use `let x: T | undefined;` (no init).
4. `let x: T | null = null` for in-memory state that never serializes. Use `let x: T | undefined;`.
5. `field: T | null` inside `*Options` / `*Input` / `*Config` types that do not represent a JSON wire format. Use `field?: T`.

### Wire boundaries — make them visible

When in-memory data (using `undefined`) crosses into a wire-format type (using `null` per Q3), the conversion is explicit and greppable. Define one helper:

```ts
export function nullify<T>(value: T | undefined): T | null {
  return value ?? null;
}
```

Use it at every wire-boundary site:

```ts
// ✓ Wire boundary is visible — grep for `nullify(` finds every one
return {
  label: nullify(getStringAttribute(attributes.label)),
  language: nullify(getStringAttribute(attributes.language)),
  source: getStringAttribute(attributes.source) ?? '',  // sentinel, not wire
  type: 'code-block',
};
```

Rule: if the field is `T | null` AND the value is `T | undefined`, wrap in `nullify(...)`. A bare `?? <literal>` defaulting expression (e.g. `?? ''`, `?? 0`) is sentinel-defaulting and needs no `nullify`. Use `nullify(x)` instead of `x ?? null` whenever the target field is a `T | null` wire field.

### App layer — domain vs UI

App code layers domain-`null` over UI-`undefined`, converted at the dispatcher — see [[app]].

### Mechanical verification

```bash
# Forbidden #1: literal `: undefined` in object/type
grep -rE ":\s*undefined\b" --include="*.ts" src/

# Forbidden #2: literal `undefined` argument
grep -rE "\(\s*undefined\s*\)" --include="*.ts" src/

# Forbidden #3: T | undefined initialized with null
grep -rE "let \w+:\s*\w+\s*\|\s*undefined\s*=\s*null" --include="*.ts" src/

# Audit candidates for Q3 — every `T | null` must justify itself
grep -rEn ":\s*[A-Za-z_<>[\] ,]+\s*\|\s*null\b" --include="*.ts" src/
```

### Worked examples

| Code | Q-path | Verdict |
|---|---|---|
| `JSON.stringify(report, null, 2)` | Q1 | `null` ✓ |
| `localStorage.getItem('locale')` returns `string \| null` | Q2 | accept `\| null` ✓ |
| `type CodeBlock = { label: string \| null }` (serialized to `manifest.json`) | Q3 | `null` ✓ |
| `if (typeof parsed === 'object' && parsed !== null)` | Q4-runtime | `=== null` ✓ |
| `type LoadResult = { configFile: string \| null }` (in-memory only) | Q4→S1 | `configFile?: string` |
| `function findUser(): User \| null` (in-memory only) | Q4→S3 | `User \| undefined` |
| `let timer: ReturnType<typeof setTimeout> \| null = null` | Q4→S4 | `let timer: ReturnType<typeof setTimeout> \| undefined;` |
| `setWriter(writer \| null)` with `setWriter(null)` to clear | Q4→S2 | `setWriter(writer)` + `resetWriter()` |

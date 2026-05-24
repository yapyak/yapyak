# AST Parser — Design Doc

**Status:** Planerad. Kommer efter `@yapyak/*` paket-splitten.
**Författare:** Joakim + Claude-session 2026-05-24.
**Ersätter:** `packages/yapyak/src/parser/parser.ts` (regex-baserad).

---

## 1. Varför

Nuvarande extractor är regex-baserad (~100 LOC i `parser.ts`). Den klarar grundläggande extraction men kan inte:

- Spåra `const t = $t; t('Hej')` (wrapper-bindning)
- Stödja `const t = $createT({ context: 'nav' }); t('Hello')` (factory)
- Stödja `withLocale('sv', () => $t(...))` / `withContext(...)` (scope helpers)
- Validera placeholders statiskt (`$t('Hej {name}')` utan params → tyst miss, runtime error)
- Producera precis position-info för diagnostics
- Generera source maps
- Återanvändas i andra build-tools (Webpack, esbuild) utan duplicering
- Driva en LSP, ESLint-plugin eller codemods

Regex = MVP. För att bygga något bortom v1 krävs en AST-grund.

## 2. Vad — val av parser

**TypeScript Compiler API** (`typescript`-paketet, `ts.createSourceFile`).

Övriga utvärderade:

| Alternativ | Varför inte |
|---|---|
| Babel (`@babel/parser` + `@babel/traverse`) | Industri-standard men 3-4x större deps, långsammare parse, alla i18n-konkurrenter använder det |
| swc | Rust-binär, kompliceradeplattforms-builds, oversikt-API mindre moget för traversal |
| oxc | Lovande men för ungt 2026, breaking changes vanliga |
| TS Compiler API | Redan i alla TS-projekts `node_modules`, ren JS, snabbare parse än Babel, **unikt val i i18n-space** |

**Nyckelinsikt:** vi använder bara `ts.createSourceFile()` + `forEachChild()` — INTE `createProgram` eller `TypeChecker`. Det betyder:
- Per-fil parsing, ingen helprojekt-init-kostnad
- Hanterar JS lika gärna som TS (`ScriptKind.JS`/`JSX`/`TS`/`TSX`)
- Inga type-checking-deps eller `tsconfig`-läsning

**Framtidssäkring:** TypeScript 7 (Corsa, Go-rewrite) behåller samma JS-API enligt Microsoft. När den landar = 10x snabbare extraction utan kodändring.

## 3. Arkitektur-axiom

**Extractor är en ren funktion.**

```
(source: string, fileId: string, framework: Framework) → {
  messages: ExtractedMessage[],
  diagnostics: Diagnostic[],
  calls: CallVisit[],  // för transform-steget
}
```

Inget I/O. Ingen Vite. Inget filsystem. Inget cache.

Allt annat (Vite-plugin, CLI, HMR, locale-files, LSP, webpack-loader) är skal runtom samma kärna.

## 4. Modul-layout

Efter `@yapyak/*` splitten lever detta i `packages/core/src/parser/`:

```
parser/
├── index.ts                       ← public barrel
├── resolve-bindings.ts            ← resolveBindings() + BindingTable
├── resolve-bindings.test.ts
├── visit-calls.ts                 ← visitCalls() + CallVisit + StaticOptions
├── visit-calls.test.ts
├── parse-arguments.ts             ← parseArguments() / placeholder-validering
├── parse-arguments.test.ts
├── jsx-context.ts                 ← findJsxContext()
├── jsx-context.test.ts
├── diagnostic.ts                  ← Diagnostic + DynamicSourceError
├── extract.ts                     ← extractMessages() — orkestrerar allt (public)
├── extract.test.ts
├── transform.ts                   ← transformSource() via magic-string (public)
├── transform.test.ts
├── walk-source-files.ts           ← oförändrad från idag
└── frameworks/                    ← peer-item dictionary, plural
    ├── vanilla.ts
    ├── vue.ts
    ├── svelte.ts
    └── astro.ts
```

### Försvinner

- `parser/parser.ts` (hela regex-implementationen)
- `parser/extract-messages.ts` (ersätts av `extract.ts` — qualifier "messages" droppas eftersom parent-modul `parser/` redan ger context)

### Flyttar

- `packages/vite/src/transform-source.ts` (idag i `yapyak/src/vite/`) → `packages/core/src/parser/transform.ts`. Transformen är verktygsagnostisk magic-string-logik. Framtida webpack/esbuild-loaders ska kunna återanvända den.

## 5. Komponenter — översikt

### 5.1 `resolve-bindings.ts`

Hjärtat. Bygger en `BindingTable` per fil som spårar alla identifierare som resolvar till `$t` eller `$createT`.

```ts
export interface YapyakBinding {
  kind: 'direct' | 'factory' | 'wrapper';
  localName: string;
  declarationNode: ts.Node;
  factoryOptions?: StaticOptions;  // för $createT({ context, locale })
}

export interface BindingTable {
  byName: Map<string, YapyakBinding>;
  byScope: WeakMap<ts.Node, Map<string, YapyakBinding>>;
}
```

Hanterar:
- `import { $t } from '@yapyak/core'`
- `import { $t as tr } from '@yapyak/core'` (alias)
- `import * as Y from '@yapyak/core'` (namespace, `Y.$t(...)`)
- `const t = $t` (wrapper)
- `const greet = $createT({ context: 'greeting' })` (factory)
- Scope-nesting (wrapper i `if`-block läcker inte ut)

### 5.2 `visit-calls.ts`

Traverserar AST, hittar alla anrop som matchar någon binding. Stödjer ambient options via rekursion:

```ts
const visit = (node: ts.Node, ambient: StaticOptions) => {
  const scoped = detectScopeHelper(node, bindings);
  const nextAmbient = scoped ? { ...ambient, ...scoped } : ambient;
  // ... visit children with nextAmbient
};
```

Detta gör `withLocale`/`withContext`-stöd "gratis" — ingen extra traversal-pass behövs.

### 5.3 `parse-arguments.ts`

Statisk validering av call-arguments:

1. Source måste vara string-literal eller no-substitution template
2. Extraherar placeholders (`{name}`, `{count, plural, ...}`)
3. Om placeholders finns → andra argument måste vara objekt-literal med matching keys
4. Tredje argument (eller andra om inga placeholders) → options-objekt

Producerar diagnostics som "Missing parameter 'name'" med exakt source-position.

### 5.4 `jsx-context.ts`

Walka uppåt från ett `$t`-anrop, hitta:
- Närmaste omslutande JSX-element (`<Button>`, `<div>`, etc)
- Component-deklaration (`function Foo()`, `const Foo = () => ...`, `const Foo = forwardRef(...)`, `export default function ...`)

Ersätter dagens regex-baserade backward-scan. Hanterar JSX-fragment, self-closing tags, dynamiska expressions korrekt.

### 5.5 `diagnostic.ts`

Strukturerade diagnostics med stable codes:

```ts
export interface Diagnostic {
  severity: 'error' | 'warning';
  code: string;                 // 'YPK001' etc
  message: string;
  fileId: string;
  range: { start: Position; end: Position };
  hint?: string;
  codeFrame: string;            // 3 rader context, ^^^ underline
}
```

Position kommer från `ts.getLineAndCharacterOfPosition(sourceFile, node.getStart())` — exakt, inte ungefärlig.

Stable codes (YPK001, YPK002, ...) möjliggör att användare kan disable specifika varningar.

### 5.6 `transform.ts`

Använder `magic-string` för att skriva om `$t(...)` → `_$pick(...)` med bevarad source-map.

Behåller offsets från CallVisit, så transform-steget aldrig parsar om.

## 6. Frameworks

Pre-processorer som ger oss ren TS från SFC-format:

### Vue
```ts
import { parse } from '@vue/compiler-sfc';
// Tar descriptor.script.content och descriptor.scriptSetup.content
// med offsetInOriginal för diagnostic-position-mapping
```

### Svelte
```ts
import { compile } from 'svelte/compiler';
// (eller enkel regex för <script>-block — outer shell är trivial)
```

### Astro
Liknande Svelte — extrahera `---` frontmatter-script.

**Nyckelpunkt:** användaren behöver INTE skriva TypeScript. ScriptKind sätts från fil-typ (`.vue` utan `lang="ts"` = JS, etc). Plain JavaScript funkar identiskt.

## 7. `$createT()` design

Compiler-macro som factory:

```ts
// Källa
const greet = $createT({ context: 'greeting', locale: 'sv' });
greet('Hello');
greet('Bye, {name}!', { name });

// Efter transform
// $createT-raden RADERAS helt
_$pick({en:'Hello', sv:'Hej'}, undefined, { locale: 'sv' });
_$pick({en:'Bye, {name}!', sv:'Hej då, {name}!'}, { name }, { locale: 'sv' });
```

`greet` är ett **compile-time-namn**. Inlinas vid varje call-site. Noll runtime-overhead. `$createT` finns inte i bundlen.

Runtime-stub kastar:
```ts
export function $createT(_opts?: CreateTOptions): T {
  throw new Error('yapyak: $createT() reached runtime. The Vite plugin must be installed.');
}
```

## 8. Context stripping

`context`-fältet är ENBART översättarhint. Strippas alltid från runtime-bundle:

```ts
// Källa
$t('Save', { context: 'submit button' });
$t('Hi {name}', { name }, { context: 'greeting', locale: 'sv' });

// Efter transform
_$pick({en:'Save', sv:'Spara'});
_$pick({en:'Hi {name}', sv:'Hej {name}'}, { name }, { locale: 'sv' });
```

Effekter:
- Mindre bundle (långa context-strängar försvinner)
- Inga secrets-läckage från context-anteckningar
- Translation-cache + extractor-metadata är source of truth

`locale` (runtime-relevant) behålls. `context` (extraction-only) försvinner.

## 9. Dependencies

| Paket | Storlek | Roll | Status |
|---|---|---|---|
| `typescript` | peer | parser + AST | krävs (optional peer i monolit-läge, dep i `@yapyak/core`) |
| `magic-string` | 38kb | transform + source maps | ny dep |
| `@vue/compiler-sfc` | optional peer | Vue SFC | bara om Vue-användare |
| `svelte` | optional peer | Svelte preprocess | bara om Svelte-användare |

**Inget Babel. Inget swc. Inget oxc.**

## 10. Performance budget

Riktmärken (från andra TS-tooling-projekt, ej yapyak-mätt än):

| Operation | Regex idag | TS Compiler API | Babel |
|---|---|---|---|
| Parse 1 fil (10kb) | ~0.5ms | ~3ms | ~6ms |
| Full scan 500 filer | ~250ms | ~1.5s | ~3s |
| HMR enskild fil | ~1ms | ~3ms | ~6ms |
| Memory steady-state | låg | medel (AST i cache) | hög |

**3x långsammare än regex, 2x snabbare än Babel.** För dev-loop osynligt (HMR <10ms). För full build = ~1s extra.

## 11. Caching

```ts
interface FileCache {
  mtime: number;
  contentHash: string;
  bindings: BindingTable;
  calls: CallVisit[];
  diags: Diagnostic[];
}
```

Persisteras till `node_modules/.cache/yapyak/files.json`. Kallstart på stort repo: ~50ms istället för ~2s.

## 12. Testpolicy

`parser/` ska levereras med **100% branch coverage på core/**:

- `resolve-bindings.test.ts` — varje import/wrapper/factory-mönster
- `visit-calls.test.ts` — varje call-shape, with*-helpers, edge cases
- `parse-arguments.test.ts` — varje literal-typ, alla diagnostics
- `jsx-context.test.ts` — function/arrow/forwardRef/memo komponenter
- `extract.test.ts` — integration över hela flödet
- `transform.test.ts` — source map-bevarande
- `frameworks/*.test.ts` — Vue/Svelte/Astro pre-processing

## 13. Migration

**Inget parallellt körande med regex.** Ersätt direkt, pre-1.0 är rätt moment.

PR-sekvens:

1. **PR 1:** Skapa hela `parser/` AST-strukturen + tester. Matchar regex-feature-set 1:1.
2. **PR 2:** Hooka in i `extractMessages()`. Riv `parser/parser.ts` och `parser/extract-messages.ts`. Gröna tester = klar.
3. **PR 3:** Lägg till diagnostics + JSX-context förbättringar (features som regex inte kunde).
4. **PR 4:** `$createT()` — första nya feature.
5. **PR 5:** `withLocale`/`withContext` om/när vi vill det.

Estimat: 2 veckor faktisk kod + 1 vecka stabilitet.

## 14. Vad detta INTE löser

Ärlighetsplikt:

- **Cross-fil binding-tracking** är medvetet inte med. `export const t = $t` i fil A, `import { t } från './a'` i fil B → vi extraherar inte i B. Kräver fullt `createProgram` med TypeChecker, dödar performance + kall-start. Inte värt det för en edge case ingen ber om.
- **Type-checking av params mot källliteral.** Gör TypeScript redan via `ExtractTParams<T>`. Plugin behöver inte göra om det.
- **Runtime-spread:** `$t('Hi {name}', { ...obj })` — kan inte verifieras statiskt. Diagnostic: "couldn't statically verify params — skipping validation". Warning, inte error.

## 15. Framtida lås-ups

Allt detta kan byggas ovanpå AST-extractorn:

| Tier | Feature | Insats |
|---|---|---|
| 2 | VS Code LSP (hover + diagnostics + CodeLens) | ⭐⭐ (1v) |
| 2 | Type-safe catalog `.d.ts` generation | ⭐ (2d) |
| 2 | CLI `find` / `wrap` / `rename-param` | ⭐⭐ (1v) |
| 3 | ESLint plugin | ⭐ (3d) |
| 3 | Webpack-loader (Next.js Pages) | ⭐⭐ (1v) |
| 4 | `yapyak studio` web-UI | ⭐⭐⭐⭐ (4v) |
| 4 | AI auto-context | ⭐⭐ (1v) |

**Alla återanvänder samma core-extractor.** Det är hela poängen med pure-function-designen.

## 16. Beslut sammanfattade

- ✅ TypeScript Compiler API som parser
- ✅ Pure-function core, ren från I/O
- ✅ Per-file `createSourceFile`, inget `createProgram`
- ✅ Frameworks som preprocessors (inte separata extractors)
- ✅ magic-string för transform
- ✅ `$createT` med `$`-prefix (compiler macro convention)
- ✅ Context strippas alltid från runtime
- ✅ Stable diagnostic codes (YPK001, ...)
- ✅ Ingen parallel-period med regex — ersätt direkt
- ✅ Bor i `packages/core/` efter `@yapyak/*` splitten

## 17. Källor från diskussionen

Designen kom ur en lång session 2026-05-24 där följande motargument testades och avfärdades:

- "Vänta tills första externa integrator efterfrågar AST" → Nej, framtida användare bär kostnaden av migration; pre-1.0 är billigast.
- "Stödja både regex och AST parallellt" → Nej, ökar underhållsbörda utan värde.
- "Babel är mer beprövat" → Sant, men yapyak är unik i i18n-space genom TS-val; differentiering + zero new deps.
- "Behöver användare skriva TypeScript?" → Nej, ScriptKind.JS fungerar identiskt.

Originalkonversationen: `/Users/joakim/.claude/projects/-Users-joakim-GitHub-frontend/db05d361-6d41-4b35-845b-9f7970395b7f.jsonl` (kan komprimerasut framtida sessions).

# AST Parser — Design Doc

**Status:** Planerad. Kommer efter `@yapyak/*` paket-splitten (klar).
**Författare:** Joakim + Claude-session 2026-05-24.
**Ersätter:** `packages/compiler/src/parser/parser.ts` (regex-baserad).

---

## 1. Vision (TL;DR)

> "Wrap everything in `$t()` from day one. Yapyak compilerar bort allt du inte använder. Lägg till första översättningen när du är redo — utan en enda kodändring. Din production-bundle är **bevisbart noll** tills du faktiskt skalar till flera språk."

Två killer-features som den nya AST-parsern möjliggör:

1. **Single-locale-elision.** Med en locale: `$t('Hello')` compilas till `'Hello'`. `$t('Hi {name}', { name })` compilas till `` `Hi ${name}` ``. Import-statements som blir tomma stryks. Resultat: noll yapyak i bundle.
2. **`$createT` compiler-macro.** `const $tSv = $createT({ locale: 'sv' })` är compile-time-namn. Alla `$tSv(...)` får locale/context inlinad. `$createT`-raden raderas. Noll runtime-overhead.

Plus en grund för LSP, codemods, ESLint-plugin, type-safe catalogs — allt återanvänder samma core-extractor.

## 2. Varför — bortom regex

Nuvarande extractor (`parser.ts`, 587 LOC) är regex-baserad. Den klarar grundläggande extraction men kan inte:

- Spåra `const t = $t; t('Hej')` (wrapper-bindning)
- Stödja `const $tSv = $createT({ locale: 'sv' }); $tSv('Hello')` (factory-macro)
- Validera placeholders statiskt (`$t('Hej {name}')` utan params → tyst miss, runtime error)
- Producera precis position-info för diagnostics
- Generera korrekta source maps
- Återanvändas i andra build-tools (Webpack, esbuild) utan duplicering
- Driva en LSP, ESLint-plugin eller codemods
- **Strippa imports vid single-locale-elision** (kräver scope-medvetenhet)

Regex = MVP. För att bygga något bortom v1 krävs en AST-grund.

## 3. Val av parser

**TypeScript Compiler API** (`typescript`-paketet, `ts.createSourceFile`).

| Alternativ | Varför inte |
|---|---|
| Babel (`@babel/parser` + `@babel/traverse`) | Industri-standard men 3-4x större deps, långsammare parse, alla i18n-konkurrenter använder det |
| swc | Rust-binär, komplicerade plattforms-builds, översikt-API mindre moget för traversal |
| oxc | Lovande men för ungt 2026, breaking changes vanliga |
| TS Compiler API | Redan i alla TS-projekts `node_modules`, ren JS, snabbare parse än Babel, **unikt val i i18n-space** |

**Nyckelinsikt:** vi använder bara `ts.createSourceFile()` + `forEachChild()` — **inte** `createProgram` eller `TypeChecker`. Det betyder:

- Per-fil parsing, ingen helprojekt-init-kostnad
- Hanterar JS lika gärna som TS (`ScriptKind.JS`/`JSX`/`TS`/`TSX`)
- Inga type-checking-deps eller `tsconfig`-läsning

**Framtidssäkring:** TypeScript 7 (Corsa, Go-rewrite) behåller samma JS-API enligt Microsoft. När den landar = 10x snabbare extraction utan kodändring.

## 4. Arkitektur-axiom

**Extractorn är en ren funktion.**

```ts
extractFile(input: ExtractInput): ExtractResult
```

- **Inget I/O.** Ingen filsystem-läsning. Tar text in, returnerar struktur ut.
- **Ingen Vite.** Ingen build-tool-koppling.
- **Ingen cache.** Caching är ett shell-lager (Vite-plugin, CLI), inte parser-internt.
- **Deterministisk.** Samma input → exakt samma output, alltid. Krävs för cache, snapshot-tester, CI-reproducerbarhet.

Allt annat — Vite-plugin, CLI, HMR, locale-files, LSP, webpack-loader, ESLint-plugin — är skal runtom samma kärna.

## 5. Single-locale-first (graceful runtime scaling)

**Inget binärt "mode-switch". Inga förbud. Inga errors.** Allt fungerar i båda fall — skillnaden är bara hur mycket runtime som faktiskt landar i bundle.

### 5.1 Compile-output sida vid sida

| Källkod | `locales: ['en']` | `locales: ['en','sv']` |
|---|---|---|
| `$t('Hello')` | `'Hello'` | `_$pick({en:'Hello', sv:'Hej'})` |
| `$t('Hi {name}', { name })` | `` `Hi ${name}` `` | `_$pick({en:'Hi {name}', sv:'Hej {name}'}, { name })` |
| `$t('{count, plural, one{# item} other{# items}}', { count })` | `_$pick({en:'...'}, { count })` (en-only plural-fn, ~200b) | `_$pick({...}, { count })` (full CLDR, ~2kb) |
| `$t('{date, date, medium}', { date })` | `_$pick({en:'...'}, { date })` (en-only format, liten) | `_$pick({...}, { date })` full |
| `getLocale()` | `'en'` (constant, inlinad) | runtime store-read |
| `useLocale()` | returnerar `['en', noop]` (constant tuple) | full hook med subscribe |
| `setLocale('sv')` | no-op, statement helt borttagen | skriver store + persistence |
| `const $tSv = $createT({ locale: 'sv' })` + `$tSv('X')` | `'X'` (sv finns inte → fallback till source) | `_$pick({en:'X', sv:'Y'}, undefined, { locale: 'sv' })` |

### 5.2 Import-elision

Efter call-site-transform räknas alla `@yapyak/*`-import-specifiers. Oreferenced specifiers stryks. Tomma import-statements tas bort.

```ts
// Källa
import { $t, useLocale } from '@yapyak/core';
function Greeting({ name }: { name: string }) {
  const [locale] = useLocale();
  return <div lang={locale}>{$t('Hi {name}', { name })}</div>;
}

// Compiled (locales: ['en'])
function Greeting({ name }: { name: string }) {
  const locale = 'en';
  return <div lang={locale}>{`Hi ${name}`}</div>;
}
```

`$t` är inlinad. `useLocale` är constant-folded. Import-raden är borta. **Noll yapyak-runtime i bundle.**

### 5.3 Trigger-regel

Mode auto-detekteras från Vite-plugin-config:

- `locales: ['en']` (eller bara default-locale konfigurerad) → **elision-pass aktiveras**
- `locales: ['en', 'sv', ...]` → standard `_$pick`-transform

Ingen separat `singleLocale: true`-flagga. En locale = elision. Flera = full runtime.

### 5.4 Marketing-position

> *"Skriv din i18n-kod som om du redan hade 10 språk. Yapyak compilerar bort allt du inte använder."*

Diff:bart före/efter `yapyak add sv` — du ser exakt vad varje locale kostar. **Det är inte 'billigt'. Det är bevisbart noll.**

## 6. Modul-layout

Bor i `packages/compiler/src/parser/`:

```
parser/
├── index.ts                       ← public barrel
├── type.ts                        ← alla publika type-contracts
├── resolve-bindings.ts            ← resolveBindings() + BindingTable
├── resolve-bindings.test.ts
├── discover-calls.ts              ← discoverCalls() + CallSite
├── discover-calls.test.ts
├── parse-arguments.ts             ← parseArguments() + ParsedArguments
├── parse-arguments.test.ts
├── call-site-context.ts           ← resolveCallSiteContext()
├── call-site-context.test.ts
├── diagnostic.ts                  ← Diagnostic + DiagnosticCode catalog
├── extract.ts                     ← extractFile() — orkestrerar allt (public)
├── extract.test.ts
├── transform.ts                   ← transformFile() via magic-string (public)
├── transform.test.ts
├── plural.ts                      ← ICU plural-parsing + validation
├── plural.test.ts
├── id.ts                          ← toMessageId() generation
├── id.test.ts
├── fixtures/                      ← snapshot-driven testharness
│   ├── bindings/
│   ├── calls/
│   ├── diagnostics/
│   ├── single-locale/
│   └── multi-locale/
└── preprocessors/
    ├── vue.ts
    ├── svelte.ts
    └── astro.ts
```

Notera: ingen `walk-source-files.ts` i `parser/`. Den lever i `packages/compiler/src/io/` eftersom den gör filsystem-IO (bryter mot axiomet i §4).

### Försvinner

- `parser/parser.ts` (regex-implementationen, 587 LOC)
- `parser/extract-messages.ts` (ersätts av `extract.ts`)

### Flyttar in

- `packages/vite/src/transform-source.ts` → `parser/transform.ts`. Transformen är verktygsagnostisk magic-string-logik. Framtida webpack/esbuild-loaders ska kunna återanvända den.

### Flyttar ut

- `parser/walk-source-files.ts` → `io/walk-source-files.ts`. Inte parser-concern.

## 7. Publik API-yta

`@yapyak/compiler/parser` exporterar:

```ts
// Orkestrerande
export function extractFile(request: ExtractFileRequest): ExtractFileResult;
export function transformFile(request: TransformFileRequest): TransformFileResult;

// Komponenter (för avancerade konsumenter — LSP, codemods)
export function resolveBindings(sourceFile: ts.SourceFile): BindingTable;
export function discoverCalls(sourceFile: ts.SourceFile, bindings: BindingTable): CallSite[];
export function parseArguments(callSite: CallSite): ParsedArguments;
export function resolveCallSiteContext(node: ts.Node, sourceFile: ts.SourceFile): CallSiteContext;

// Diagnostic + ID
export function toMessageId(source: string, context?: string): string;
export { Diagnostic, type DiagnosticCode };

// Types
export type {
  ExtractFileRequest, ExtractFileResult,
  TransformFileRequest, TransformFileResult,
  BindingTable, YapyakBinding,
  CallSite, ParsedArguments, ParsedParams,
  CallSiteContext, Position, Range,
  ExtractedMessage, Framework,
  StaticOptions, Placeholder, Location, Scope,
};
```

**Naming-konventioner följda:**
- `*Request`/`*Result` för function-scoped input/output med single consumer → prefix med full funktion-namn (`extractFile` → `ExtractFileRequest`)
- `discover*` för "scan source for set of items" (inte `visit*` — inte i verb-vokabulären)
- `resolve*` för "compute final value from inputs" (`resolveCallSiteContext`, `resolveBindings`)
- `to*` för "convert value to another shape" (`toMessageId`)
- `*Site` för "location enriched with context" (`CallSite`, inte `CallVisit`)
- `*Context` för "bundle of state" (`CallSiteContext`)
- `Parsed*` past-participle prefix för processed form (`ParsedArguments`, `ParsedParams`)

## 8. Type contracts

Alla publika types samlade. Ingen ambiguity.

```ts
export type Framework = 'vanilla' | 'vue' | 'svelte' | 'astro';

export interface Position {
  line: number;       // 1-based
  column: number;     // 1-based
  offset: number;     // 0-based byte/char offset in source
}

export interface Range {
  start: Position;
  end: Position;
}

export interface ExtractFileRequest {
  source: string;
  fileId: string;
  framework?: Framework;       // default 'vanilla'
  locales: readonly string[];  // for elision decisions
}

export interface ExtractFileResult {
  messages: ExtractedMessage[];
  callSites: CallSite[];        // re-used by transform step (no re-parse)
  diagnostics: Diagnostic[];
}

export interface ExtractedMessage {
  id: string;                  // stable hash (see §17)
  source: string;              // literal first arg
  placeholders: Placeholder[]; // parsed from source
  locations: Location[];       // every call-site producing this message
  context?: string;            // hint string (extraction-only)
  factoryLocale?: string;      // from $createT, if any
}

export interface Placeholder {
  name: string;
  kind: 'simple' | 'plural' | 'select' | 'date' | 'time' | 'number';
  variants?: Record<string, string>; // for plural/select sub-messages
}

export interface Location {
  fileId: string;
  range: Range;
  callSiteContext: CallSiteContext;
}

export interface CallSiteContext {
  componentName?: string;       // 'Greeting', 'useFoo', etc
  enclosingFunction?: string;   // closest fn/method name
  enclosingJsx?: string;        // closest JSX element tag, if any
  enclosingHook?: string;       // closest 'use*' fn, if any
}

export interface StaticOptions {
  context?: string;
  locale?: string;
}

export interface YapyakBinding {
  kind: 'direct' | 'wrapper' | 'factory' | 'namespace';
  localName: string;
  declarationNode: ts.Node;
  factoryOptions?: StaticOptions;
}

export interface Scope {
  node: ts.Node;
  parent?: Scope;
  bindings: Map<string, YapyakBinding>;
}

export interface BindingTable {
  root: Scope;
  find(name: string, atNode: ts.Node): YapyakBinding | undefined;
}

export interface CallSite {
  binding: YapyakBinding;
  node: ts.CallExpression;
  range: Range;
}

export interface ParsedArguments {
  source: string;               // first arg literal
  sourceRange: Range;
  params?: ParsedParams;        // second arg (if any)
  options?: StaticOptions;      // third arg, statically resolved
  diagnostics: Diagnostic[];
}

export interface ParsedParams {
  keys: string[];               // statically known
  kind: 'static' | 'spread';    // discriminator — 'spread' means {...rest} present
  range: Range;
}

export interface TransformFileRequest {
  source: string;
  fileId: string;
  framework?: Framework;
  locales: readonly string[];
  translations: Record<string, Record<string, string>>; // locale → id → translation
  extracted: ExtractFileResult; // from extractFile()
}

export interface TransformFileResult {
  code: string;
  map: SourceMap;               // magic-string output
  diagnostics: Diagnostic[];
}
```

## 9. `resolve-bindings.ts`

Bygger en **scope-trädad** binding-table per fil. Spårar alla identifierare som resolvar till `$t`, `$createT`, eller wrapper/factory-bindningar därav.

### Scope-modellen

En `Scope` per fil + per funktion/block där en `const`-binding deklareras. Lookup går scope-uppåt tills binding hittas.

**Ingen flat `byName: Map`**. Bara scope-trädet. Det löser nested-shadowing-problem (wrapper i en `if`-block läcker inte ut).

### Bindings som detekteras

```ts
// direct
import { $t } from '@yapyak/core';                    // { localName: '$t', kind: 'direct' }
import { $t as t } from '@yapyak/core';               // { localName: 't', kind: 'direct' }

// namespace
import * as Y from '@yapyak/core';                    // { localName: 'Y', kind: 'namespace' }
// → Y.$t(...) känns igen via property-access

// wrapper
const t = $t;                                          // { localName: 't', kind: 'wrapper' }

// factory
const $tSv = $createT({ locale: 'sv' });              // { kind: 'factory', factoryOptions: { locale: 'sv' } }
const $tCtx = $createT({ context: 'admin' });         // { kind: 'factory', factoryOptions: { context: 'admin' } }
```

### Constraints på `$createT`

- **Endast `const` top-level eller function-scope-top.** `let` → YPK010. `if (foo) const` → YPK010.
- **Factory-arg måste vara statiskt analyserbart.** `$createT({ locale: someVar })` → YPK004.
- **Får inte exporteras.** `export const $tSv = $createT(...)` → YPK011 (per-file constraint, se §15).

## 10. `discover-calls.ts`

Traverserar AST med `forEachChild`. För varje `CallExpression`:

1. Resolva callee (identifier eller property-access) mot `BindingTable.find(name, node)`.
2. Om binding hittas → registrera som `CallSite`.

**Ingen ambient state-tracking.** `withLocale`/`withContext` är **explicit cuts**. Locale/context kommer enbart från:

- `$createT(...)`-factoryns options (via `binding.factoryOptions`)
- Tredje argumentet till call-site `$t('...', params, { locale, context })`

Per-call options merges över factory-options. Per-call wins.

## 11. `parse-arguments.ts`

Validerar argument-strukturen vid varje `CallSite`.

### Regel 1: First arg = string-literal

**Endast string-literal eller no-substitution template-literal.** Inget annat.

```ts
$t('Hello')                    // ✅
$t(`Hello`)                    // ✅ no-substitution template
$t('Hi {name}', { name })      // ✅ literal med placeholder-syntax

$t(`Hi ${name}`)               // ❌ YPK001 Dynamic source
$t(someVar)                    // ❌ YPK001
$t('Hi ' + name)               // ❌ YPK001
$t('Hi ' + STATIC_CONST)       // ❌ YPK001 även om StaticConst är statisk
```

**Tagged templates stöds inte.** Bara plain string-literals. Period.

### Regel 2: Placeholders extraheras från source

Source-strängen parsas för `{name}`, `{name, plural, ...}`, `{name, select, ...}`, `{name, date|time|number, ...}`.

### Regel 3: Params måste matcha placeholders

Om source har placeholders:
- Andra argumentet **måste** vara objekt-literal med matching keys.
- Saknad key → **YPK002** error.
- Extra key → **YPK003** warning.
- `{...spread}` → **YPK005** warning ("couldn't statically verify params").

### Regel 4: Options-objekt är tredje arg (eller andra om inga placeholders)

```ts
$t('Save', { context: 'submit button' });
$t('Hi {name}', { name }, { context: 'greeting', locale: 'sv' });
```

`context` strippas alltid från runtime (extraction-only metadata).
`locale` behålls (runtime-relevant — påverkar `_$pick`-call).

## 12. `call-site-context.ts`

Walka uppåt från ett `$t`-anrop. Bygg en `CallSiteContext` med:

- **`componentName`** — namnet på närmaste React-komponent/`function Foo()`/`const Foo = () => ...`/`forwardRef`/`memo`/`export default function`-deklaration. Bredare än bara JSX.
- **`enclosingFunction`** — närmaste funktion/method-namn (oavsett om komponent eller ej).
- **`enclosingJsx`** — närmaste omslutande JSX-element-tag, om någon. Hanterar fragment, self-closing, dynamiska expressions korrekt.
- **`enclosingHook`** — närmaste `use*`-funktion, om någon.

Alla är `string | undefined`. Tomma fält är OK (top-level-anrop har inga av dem).

Ersätter dagens regex-baserade backward-scan. Korrekt för alla JSX-edge-cases.

## 13. `diagnostic.ts`

Strukturerade diagnostics med stable codes:

```ts
export interface Diagnostic {
  severity: 'error' | 'warning';
  code: DiagnosticCode;
  message: string;
  fileId: string;
  range: Range;
  hint?: string;
  source: string;  // file source text, for downstream code-frame rendering
}

export type DiagnosticCode =
  | 'YPK001' | 'YPK002' | 'YPK003' | 'YPK004' | 'YPK005'
  | 'YPK006' | 'YPK007' | 'YPK008' | 'YPK009' | 'YPK010' | 'YPK011';
```

**Diagnostic frame rendering** sker i shell-lagret (Vite-plugin, CLI, LSP), inte i parser-core. Pure-core ger bara `range + source`. Renderern kan vara terminal-färger, HTML, LSP-format.

### Katalog

| Kod | Severity | Trigger | Hint |
|---|---|---|---|
| YPK001 | error | Dynamic source i `$t(...)` | "Use `{placeholder}` syntax + params object instead of string concatenation or template interpolation." |
| YPK002 | error | Saknad placeholder-param | "Add `{name}` to the params object." |
| YPK003 | warning | Extra placeholder-param | "Remove unused `{name}` from params object." |
| YPK004 | error | Icke-statisk `$createT`-option | "`$createT` options must be statically analyzable string literals." |
| YPK005 | warning | Spread params (`{...obj}`) | "Spread params cannot be statically verified. Pass keys explicitly to enable validation." |
| YPK006 | warning | Wrapper deklarerad i unreachable branch | "Wrapper binding may not be applied consistently. Consider declaring at function scope." |
| YPK007 | error | Invalid ICU plural shape | "Plural requires `other` branch. Optional: `zero`, `one`, `two`, `few`, `many`." |
| YPK008 | error | Tom source-string | "$t('') has no meaning. Pass a non-empty string literal." |
| YPK009 | warning | Två `$t`-calls med samma source men olika context | "Different contexts produce different message IDs. Verify this is intentional." |
| YPK010 | error | `$createT` i `let` / conditional / non-top-of-scope | "`$createT` must be a top-level `const` declaration." |
| YPK011 | error | `export` av `$createT`-binding | "`$createT` bindings cannot be exported. Call sites must be in the same file as the declaration." |

Användare kan disable enskilda koder via shell-config (Vite-plugin options eller `.yapyak.json`).

## 14. `transform.ts`

Använder `magic-string` för rewrite med bevarad source-map. Återanvänder offsets från `ExtractResult.calls` — ingen re-parse.

### Transform-pipeline

```
1. Replace call-sites (from ExtractFileResult.callSites)
   a. $t(...) → elide (single-locale) | _$pick(...) (multi-locale)
   b. $createT() declarations → delete entire VariableStatement
   c. $createT()-bound calls → expand to _$pick(...) with factory options
2. Constant-fold (single-locale only)
   a. getLocale() → 'en' (literal)
   b. useLocale() → ['en', () => {}] (literal tuple)
   c. setLocale(...) calls → remove entire ExpressionStatement
3. Import-elision pass
   a. Scan all import declarations from @yapyak/*
   b. For each specifier: count remaining references in source
   c. Remove specifiers with 0 references
   d. Remove import statements with empty specifier lists
4. Emit code + source-map
```

### Transform-specs per construct

#### `$t` standalone, single-locale, no placeholders
```ts
// in:  $t('Hello')
// out: 'Hello'
```

#### `$t` standalone, single-locale, with simple placeholders
```ts
// in:  $t('Hi {name}, you have {count} messages', { name, count })
// out: `Hi ${name}, you have ${count} messages`
```

#### `$t` standalone, single-locale, with plurals/format
```ts
// in:  $t('You have {count, plural, one{# item} other{# items}}', { count })
// out: _$pick({en:'You have {count, plural, one{# item} other{# items}}'}, { count })
// (still requires runtime — plural rules can't be inlined as template literal)
```

#### `$t` standalone, multi-locale
```ts
// in:  $t('Hi {name}', { name })
// out: _$pick({en:'Hi {name}', sv:'Hej {name}'}, { name })
```

#### `$createT` factory, single-locale
```ts
// in:  const $tSv = $createT({ locale: 'sv' });
//      $tSv('Hello');
//      $tSv('Hi {name}', { name });
// out: (factory declaration deleted)
//      'Hello';
//      `Hi ${name}`;
```

#### `$createT` factory, multi-locale
```ts
// in:  const $tSv = $createT({ locale: 'sv', context: 'admin' });
//      $tSv('Save');
//      $tSv('Delete', { context: 'destructive' });
// out: (factory declaration deleted)
//      _$pick({en:'Save', sv:'Spara'}, undefined, { locale: 'sv', context: 'admin' });
//      _$pick({en:'Delete', sv:'Radera'}, undefined, { locale: 'sv', context: 'destructive' });
```

Per-call options merges över factory-options. Per-call wins. `context` strippas före runtime-emit (extraction-only).

#### `useLocale`/`getLocale`/`setLocale`, single-locale
```ts
// in:  const [locale, setLocale] = useLocale();
//      console.log(getLocale());
//      setLocale('sv');
// out: const locale = 'en'; const setLocale = () => {};
//      console.log('en');
//      (setLocale call removed entirely)
```

Compiler känner igen destructure-pattern på `useLocale`-resultatet och inlinar både elements.

## 15. `$createT()` — full spec

### Definition

```ts
// I @yapyak/core (runtime-stub)
export function $createT(_opts?: CreateTOptions): T {
  throw new Error(
    'yapyak: $createT() reached runtime. The compiler plugin must be installed.',
  );
}

export interface CreateTOptions {
  context?: string;
  locale?: string;
}
```

Fail-loud — om compiler-pluginen inte är installerad får användaren en tydlig run-time error vid första call. Inte tyst breakage.

### Semantik

`$createT` är en **compiler-macro**. Den skapar **inget** runtime. Resultatet är ett compile-time-namn.

Vid compile:
1. `const $tSv = $createT(opts)` → declaration RADERAS HELT.
2. Varje `$tSv(...)` rewrites med `opts` som default på third-arg.
3. Per-call third-arg merges över factory-opts. Per-call wins.
4. `context` strippas före runtime-emit.

### Constraints (per §9)

- Endast `const` top-level eller function-scope-top → annars YPK010.
- Factory-arg statiskt analyserbart → annars YPK004.
- Får inte exporteras → annars YPK011.

### Vad om factory-locale inte finns i `locales`?

I single-locale-mode:
```ts
// locales: ['en']
const $tSv = $createT({ locale: 'sv' });
$tSv('Hello');
// → 'Hello' (sv finns inte, fallback till source)
```

Silent — ingen error, ingen warning. När `yapyak add sv` körs börjar samma kod automatiskt växla locale korrekt. **Det är hela point:en.**

### Inget `withLocale`/`withContext`

Skippas helt. `$createT` täcker alla legitima use-cases. Scope-helpers skulle tvinga visit-pass att tracka ambient state — onödig komplexitet för en feature 98% av användarna aldrig rör.

## 16. Framework preprocessors

Pre-processorer som ger oss ren TS/JS från SFC-format:

### Vue
```ts
import { parse } from '@vue/compiler-sfc';
// Extraherar descriptor.script.content + descriptor.scriptSetup.content
// med offsetInOriginal för diagnostic-position-mapping
```

### Svelte
```ts
import { compile } from 'svelte/compiler';
// (eller enkel regex för <script>-block — outer shell är trivial)
```

### Astro
Liknande Svelte — extrahera `---` frontmatter-script.

### Vanilla
No-op. Source skickas direkt till parser.

**Användaren behöver INTE skriva TypeScript.** `ScriptKind` sätts från fil-typ (`.vue` utan `lang="ts"` = JS, etc). Plain JavaScript fungerar identiskt.

## 17. ID generation

**Stable hash per (source, context).**

```ts
export function toMessageId(source: string, context?: string): string {
  const input = context === undefined ? source : `${source} ${context}`;
  return sha256(input).slice(0, 12);  // 12-char hex prefix
}
```

Egenskaper:

- **Deterministisk.** Samma input → samma id, alltid.
- **Stabil mot kosmetiska ändringar.** Whitespace i ett komponent-namn ändrar inte id (componentName inte i hash).
- **Kollision-resistent på praktisk skala.** 48 bits → ~16M unique ids före 1% kollisions-risk.
- **Context-känslig.** Samma source + olika context = olika ids (intentionellt — översättningar kan variera).

Translation-files keyas på id (kort), inte source (lång). Mindre filer, snabbare lookup.

## 18. Plurals & ICU format

Source-syntax: standard ICU MessageFormat.

```ts
$t('{count, plural, one{# item} other{# items}}', { count });
$t('{gender, select, male{he} female{she} other{they}}', { gender });
$t('{when, date, medium}', { when });
$t('{cost, number, currency}', { cost });
```

### Validering

- **`plural` kräver `other`-branch.** Saknas → YPK007.
- **`select`-branches måste vara statiska strängar.** Variables → YPK001 (dynamic source).
- **Format-typer (`date`, `time`, `number`) kontrolleras inte djupare.** Runtime hanterar dem.

### Runtime-strategi

| Pattern | Single-locale | Multi-locale |
|---|---|---|
| Bara `{name}` | Inline template literal | `_$pick(...)` |
| `{count, plural}` | `_$pick(...)` + 1-locale plural-fn (~200b) | `_$pick(...)` + full CLDR (~2kb) |
| `{when, date}` | `_$pick(...)` + Intl.DateTimeFormat-wrapper | samma |
| `{cost, number}` | `_$pick(...)` + Intl.NumberFormat-wrapper | samma |

**Allt funkar.** Bara enkla placeholders får literal-template-elision. Plural/format kräver runtime även för en locale.

## 19. Caching

**Cache lever i shell-lagret, inte i parser-core.**

Vite-plugin/CLI ansvar:

```ts
interface FileCache {
  mtime: number;
  contentHash: string;
  extracted: ExtractResult;
  transformed?: TransformResult;
}
```

Persisteras till `node_modules/.cache/yapyak/files.json`. Kallstart på stort repo: ~50ms istället för ~2s.

Pure-core (§4) tar input och returnerar output — vet inte om cache existerar.

## 20. Dependencies

| Paket | Storlek | Roll | Status |
|---|---|---|---|
| `typescript` | peer | parser + AST | krävs (peer i `@yapyak/compiler`) |
| `magic-string` | 38kb | transform + source maps | ny dep |
| `@vue/compiler-sfc` | optional peer | Vue SFC | bara om Vue-användare |
| `svelte` | optional peer | Svelte preprocess | bara om Svelte-användare |

**Inget Babel. Inget swc. Inget oxc.**

## 21. Performance budget

Riktmärken (från andra TS-tooling-projekt, ej yapyak-mätt än):

| Operation | Regex idag | TS Compiler API | Babel |
|---|---|---|---|
| Parse 1 fil (10kb) | ~0.5ms | ~3ms | ~6ms |
| Full scan 500 filer | ~250ms | ~1.5s | ~3s |
| HMR enskild fil | ~1ms | ~3ms | ~6ms |
| Memory steady-state | låg | medel (AST i cache) | hög |

**3x långsammare än regex, 2x snabbare än Babel.** För dev-loop osynligt (HMR <10ms). För full build = ~1s extra.

## 22. Test policy

Parser/ ska levereras med **100% branch coverage**.

Test-modell: **fixture-driven snapshot tests.**

```
parser/fixtures/
├── bindings/                    # one .ts file per binding pattern
│   ├── direct-import.ts
│   ├── aliased-import.ts
│   ├── namespace-import.ts
│   ├── wrapper.ts
│   ├── factory-locale.ts
│   ├── factory-context.ts
│   ├── factory-both.ts
│   └── shadowed-wrapper.ts
├── calls/
│   ├── simple.ts
│   ├── placeholders.ts
│   ├── nested-jsx.ts
│   └── arrow-callback.ts
├── diagnostics/
│   ├── ypk001-dynamic-source.ts
│   ├── ypk002-missing-param.ts
│   └── ... (one per code)
├── single-locale/
│   ├── elision-literal.ts
│   ├── elision-template.ts
│   ├── elision-import.ts
│   └── constant-fold-uselocale.ts
└── multi-locale/
    └── full-pick.ts
```

Varje fixture parsas → snapshotas. Diff = test fail. **Innan implementation** sätts hela suite upp så feature-parity är bevisbart, inte antaget.

Per-modul-tester (`*.test.ts`) testar enheten isolerat. Fixture-suiten är integration.

## 23. Determinism + error recovery

### Determinism

`extractFile(input)` är **rent deterministisk**. Samma input → samma output, alltid. Inga `Date.now()`, `Math.random()`, `process.env`, eller iteration-ordning från `Set`/`Map` utan explicit sort.

### Error recovery

**Parser bailar inte vid syntax errors.** `ts.createSourceFile` producerar partial AST även för broken input. Vi extraherar vad vi kan och returnerar syntax errors som diagnostics.

`$t` i kommentarer eller inside type-positions skipas via `ts.isCallExpression` + `parent.kind`-check.

## 24. Migration

**Inget parallellt körande med regex.** Ersätt direkt, pre-1.0 är rätt moment.

PR-sekvens:

1. **PR 0:** Doc finalization (denna fil). Approval = grön ljus.
2. **PR 1:** `types.ts` + `fixtures/`-skeleton + test-harness. Ingen logik. Bara contracts.
3. **PR 2:** `resolve-bindings.ts` + tester. Gröna mot bindings-fixtures.
4. **PR 3:** `visit-calls.ts` + `parse-arguments.ts` + tester. Gröna mot calls + diagnostics fixtures.
5. **PR 4:** `callsite-context.ts` + tester.
6. **PR 5:** `plurals.ts` + `ids.ts` + tester.
7. **PR 6:** `extract.ts` + integration-tester över hela flödet.
8. **PR 7:** `transform.ts` med single-locale-elision + import-elision + tester.
9. **PR 8:** `preprocessors/` (Vue/Svelte/Astro).
10. **PR 9:** Wire in i `@yapyak/vite`. Riv `parser.ts` (regex) och `extract-messages.ts`. Feature-parity-gate måste vara grön.
11. **PR 10+:** Nya features (`$createT`-macro går live, plural-validation, etc).

Estimat: 2-3 veckor faktisk kod + 1 vecka stabilitet.

## 25. Vad detta INTE löser

Ärlighetsplikt:

- **Cross-fil binding-tracking.** `export const $tSv = $createT(...)` i fil A, importerad i fil B → vi extraherar inte i B. Per-file constraint (YPK011). Kräver `createProgram` med TypeChecker, dödar performance + kallstart.
- **Type-checking av params mot källliteral.** TypeScript gör redan det via `ExtractTParams<T>`. Plugin behöver inte göra om det.
- **Runtime-spread:** `$t('Hi {name}', { ...obj })` — kan inte verifieras statiskt. YPK005 warning.
- **Dynamiska factory-locales:** `$createT({ locale: someVar })` — YPK004 error. Bara statiska locales.

## 26. Framtida lås-ups

Allt detta kan byggas ovanpå AST-extractorn:

| Tier | Feature | Insats |
|---|---|---|
| 2 | VS Code LSP (hover + diagnostics + CodeLens) | ⭐⭐ (1v) |
| 2 | Type-safe catalog `.d.ts` generation | ⭐ (2d) |
| 2 | CLI `yapyak add <locale>` | ⭐ (3d) |
| 2 | CLI `yapyak doctor` (bundle-cost preview) | ⭐ (2d) |
| 3 | CLI `find` / `wrap` / `rename-param` | ⭐⭐ (1v) |
| 3 | ESLint plugin | ⭐ (3d) |
| 3 | Webpack-loader (Next.js Pages) | ⭐⭐ (1v) |
| 4 | `yapyak studio` web-UI | ⭐⭐⭐⭐ (4v) |
| 4 | AI auto-translate vid `yapyak add` | ⭐⭐ (1v) |

**Alla återanvänder samma core-extractor.** Det är hela poängen med pure-function-designen.

## 27. Beslut sammanfattade

- ✅ TypeScript Compiler API som parser
- ✅ Pure-function core, ren från I/O
- ✅ Per-file `createSourceFile`, inget `createProgram`
- ✅ Bor i `packages/compiler/src/parser/`
- ✅ Frameworks som preprocessors (inte separata extractors)
- ✅ magic-string för transform
- ✅ **Single-locale-mode = compile-time elision + import-stripping = noll yapyak i bundle**
- ✅ **`$createT` är compiler-macro — declaration raderas, calls inlinas med options**
- ✅ **`withLocale`/`withContext` finns inte. Cut.**
- ✅ **Endast string-literal som first arg till `$t`. Inga tagged templates.**
- ✅ **Inga "forbids" baserat på locale-count — allt fungerar, runtime skalar gracefully**
- ✅ Context strippas alltid från runtime
- ✅ Stable diagnostic codes (YPK001-YPK011)
- ✅ ID = sha256(source + context).slice(0,12) via `toMessageId()`
- ✅ Naming-rules: `*Request`/`*Result` på function-scoped types med full function-name-prefix; `discover*`/`resolve*`/`to*` från verb-vokabulären; `*Site`/`*Context`/`Parsed*` från type-suffix-vokabulären
- ✅ Cache lever i shell-lagret, inte parser-core
- ✅ Fixture-driven snapshot tests innan implementation
- ✅ Ingen parallel-period med regex — ersätt direkt

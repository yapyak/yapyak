# AST Parser — Design Doc

**Status:** Implementation in progress (PR 1–9 landed, PR 10+ pending).
**Författare:** Joakim + Claude-sessioner 2026-05-24.
**Implementation:** `packages/compiler/src/parser/`.

---

## 1. Vision

```
"Wrap everything in $t() from day one.
 Yapyak compilerar bort allt du inte använder.
 Lägg till första översättningen när du är redo — utan en enda kodändring.
 Din production-bundle är bevisbart noll tills du faktiskt skalar till flera språk."
```

Killer-feature: **single-locale-elision.** Med en locale: `$t('Hello')` compilas till `'Hello'` och hela `@yapyak/core`-importen försvinner. Lägg till `sv` → samma kod blir `_$pick({en:'Hello',sv:'Hej'})` och runtime aktiveras. Användarens app-kod är **identisk** i båda fall.

## 2. Hela publika API:t

```ts
// @yapyak/core
export function $t<T extends string>(
  source: T,
  params?: ParamsForSource<T>,
  options?: { locale?: string },
): string;

export function getLocale(): string;
export function setLocale(next: string): void;
export function useLocale(): readonly [string, (next: string) => void];
export function subscribeLocale(callback: (next: string) => void): () => void;
export const defaultLocale: string;
export const locales: readonly string[];
```

**Det är allt.** En översättnings-funktion. Locale-store. Inget annat.

Designprincip: *one way to do it. No magic. Everything composes with standard JavaScript.*

### Argument-semantik för `$t`

| Position | Krav | Compile-time | Runtime |
|---|---|---|---|
| `source` | Plain string-literal eller no-substitution template | Extraherad för översättning. Måste vara statisk (YPK001 annars). | Inlinas i catalog |
| `params` | Object literal (statisk shape) eller reference | Keys-shape verifieras mot placeholders | Skickas verbatim till `_$pick` |
| `options` | Object literal eller reference | Inline literal: re-renderas. Reference: preserveras verbatim | Runtime kan ha dynamiska värden (locale-byte etc) |

### Exempel som täcker hela ytan

```ts
// Enklast
$t('Hello');

// Med placeholders
$t('Hi {name}', { name });

// Med plural
$t('{count, plural, one {# item} other {# items}}', { count });

// Med statiskt forced locale
$t('Hello', undefined, { locale: 'sv' });

// Med dynamiskt locale (reactive)
$t('Hello', undefined, { locale: previewLocale.value });

// Options som variable — preserveras verbatim
const svOptions = { locale: 'sv' };
$t('Hello', undefined, svOptions);

// Options från function call
$t('Hello', undefined, getOptions());

// Wrapper för kortare namn (existerande binding-pattern)
const t = $t;
t('Hello');
```

Alla dessa fungerar reaktivt i Vue/Svelte-templates och computed/derived eftersom options-uttrycket evalueras vid varje `_$pick`-anrop.

## 3. Varför AST-parser (inte regex)

Förr använde vi en regex-baserad extractor (587 LOC). Den klarade grundläggande extraction men kunde inte:

- Spåra wrapper-bindningar (`const t = $t; t('Hej')`)
- Validera placeholders statiskt
- Producera precis position-info för diagnostics
- Generera korrekta source maps
- Stödja LSP / codemods / ESLint-plugins
- **Strippa imports vid single-locale-elision** (kräver scope-medvetenhet)

Regex = MVP. För allt bortom det krävs AST.

## 4. Val av parser

**TypeScript Compiler API** (`typescript`-paketet, `ts.createSourceFile`).

| Alternativ | Varför inte |
|---|---|
| Babel | 3-4x större deps, alla i18n-konkurrenter använder det (vi differentierar) |
| swc | Rust-binär, plattforms-builds komplicerat |
| oxc | För ungt 2026 |
| TS Compiler API | Redan i alla TS-projekts `node_modules`, ren JS, **unikt val i i18n-space** |

**Nyckelinsikt:** vi använder bara `ts.createSourceFile()` + `forEachChild()` — **inte** `createProgram` eller `TypeChecker`. Per-fil parsing, ingen helprojekt-init.

**Framtidssäkring:** TypeScript 7 (Corsa, Go-rewrite) behåller samma JS-API. När den landar = 10x snabbare extraction utan kodändring.

## 5. Arkitektur-axiom

**Extractorn är en ren funktion.**

```ts
extractFile(request: ExtractFileRequest): ExtractFileResult
```

- **Inget I/O.** Ingen filsystem-läsning. Text in, struktur ut.
- **Ingen Vite.** Ingen build-tool-koppling.
- **Ingen cache.** Caching är ett shell-lager (Vite-plugin, CLI), inte parser-internt.
- **Deterministisk.** Samma input → exakt samma output, alltid.

Allt annat — Vite-plugin, CLI, HMR, locale-files, LSP — är skal runtom samma kärna.

## 6. Single-locale-first (graceful runtime scaling)

**Inget binärt "mode-switch". Inga förbud. Allt fungerar i båda fall** — skillnaden är hur mycket runtime som landar i bundle.

### Compile-output sida vid sida

| Källkod | `locales: ['en']` | `locales: ['en','sv']` |
|---|---|---|
| `$t('Hello')` | `'Hello'` | `_$pick({en:'Hello', sv:'Hej'})` |
| `$t('Hi {name}', { name })` | `` `Hi ${name}` `` | `_$pick({en:'Hi {name}', sv:'Hej {name}'}, { name })` |
| `$t('{count, plural, ...}', { count })` | `_$pick({en:'...'}, { count })` (en-only plural-fn, ~200b) | `_$pick({...}, { count })` (full CLDR, ~2kb) |
| `$t('Hello', undefined, { locale: 'sv' })` | `_$pick({en:'Hello'}, undefined, { locale: 'sv' })` (förbi elision pga forced locale) | `_$pick({en:'Hello',sv:'Hej'}, undefined, { locale: 'sv' })` |
| `$t('Hello', undefined, opts)` | `_$pick({en:'Hello'}, undefined, opts)` (preserve verbatim) | `_$pick({en:'Hello',sv:'Hej'}, undefined, opts)` |
| `getLocale()` | `'en'` (constant, inlinad) | runtime store-read |
| `useLocale()` | `['en', () => {}]` (constant tuple) | full hook |
| `setLocale('sv')` | no-op, statement borttagen | skriver store + persistence |

### Import-elision

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

### Trigger-regel

Mode auto-detekteras från Vite-plugin-config:

- `locales: ['en']` (eller bara default-locale) → **elision-pass aktiveras**
- `locales: ['en', 'sv', ...]` → standard `_$pick`-transform

Ingen separat flagga. En locale = elision. Flera = full runtime.

### Marketing-position

> *"Skriv din i18n-kod som om du redan hade 10 språk. Yapyak compilerar bort allt du inte använder."*

Diff:bart före/efter `yapyak add sv` — du ser exakt vad varje locale kostar.

## 7. Modul-layout

Bor i `packages/compiler/src/parser/`:

```
parser/
├── index.ts                       ← public barrel
├── type.ts                        ← alla publika type-contracts
├── resolve-bindings.ts            ← BindingTable
├── resolve-bindings.test.ts
├── discover-calls.ts              ← CallSite[]
├── discover-calls.test.ts
├── parse-arguments.ts             ← ParsedArguments + diagnostics
├── parse-arguments.test.ts
├── call-site-context.ts           ← CallSiteContext (componentName, JSX, hook)
├── call-site-context.test.ts
├── diagnostic.ts                  ← createDiagnostic helper
├── plural.ts                      ← ICU placeholder-parsing + validation
├── plural.test.ts
├── id.ts                          ← toMessageId (sha256)
├── id.test.ts
├── position.ts                    ← toPosition + toRange helpers
├── extract.ts                     ← extractFile() orchestrator
├── extract.test.ts
├── transform.ts                   ← transformFile() via magic-string
├── transform.test.ts
├── fixtures.test.ts               ← snapshot-driven testharness
├── fixtures/
│   ├── bindings/
│   ├── calls/
│   ├── diagnostics/
│   ├── single-locale/
│   └── multi-locale/
└── framework/                     ← fragment-orienterad SFC-support
    ├── index.ts
    ├── adapter.ts                 ← FrameworkAdapter interface
    ├── vanilla.ts
    ├── vue.ts
    ├── svelte.ts
    └── astro.ts
```

I/O lever utanför parser-mappen i `packages/compiler/src/io/`:

```
io/
├── index.ts
└── walk-source-files.ts
```

## 8. Type contracts

Alla publika types samlade. Ingen ambiguity.

```ts
export type Framework = 'astro' | 'svelte' | 'vanilla' | 'vue';

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
  locales: readonly string[];
  framework?: Framework;        // default 'vanilla'
}

export interface ExtractFileResult {
  messages: ExtractedMessage[];
  callSites: CallSite[];        // re-used by transform step (no re-parse)
  diagnostics: Diagnostic[];
}

export interface ExtractedMessage {
  id: string;                   // stable hash (see §14)
  source: string;               // literal first arg
  placeholders: Placeholder[];  // parsed from source
  locations: Location[];        // every call-site producing this message
}

export interface Placeholder {
  name: string;
  kind: 'date' | 'number' | 'plural' | 'select' | 'simple' | 'time';
  variants?: Record<string, string>;
}

export interface Location {
  fileId: string;
  range: Range;
  callSiteContext: CallSiteContext;
  forcedLocale?: string;        // if call-site has static { locale: '...' }
}

export interface CallSiteContext {
  componentName?: string;       // 'Greeting', 'useFoo', etc
  enclosingFunction?: string;   // closest fn/method name
  enclosingHook?: string;       // closest 'use*' fn, if any
  enclosingJsx?: string;        // closest JSX element tag, if any
}

export interface YapyakBinding {
  kind: 'direct' | 'namespace' | 'wrapper';
  localName: string;
  declarationNode: ts.Node;
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
  diagnostics: Diagnostic[];
  params?: ParsedParams;        // second arg if source has placeholders
  forcedLocale?: string;        // from static options { locale: 'sv' }
  optionsExpression?: string;   // raw text of options arg if non-static
}

export interface ParsedParams {
  keys: string[];               // statically known
  kind: 'spread' | 'static';
  range: Range;
}

export interface TransformFileRequest {
  source: string;
  fileId: string;
  locales: readonly string[];
  translations: Record<string, Record<string, string>>;  // locale → id → text
  extracted: ExtractFileResult;
  framework?: Framework;
}

export interface TransformFileResult {
  code: string;
  map: SourceMap;               // magic-string output
  diagnostics: Diagnostic[];
}

export interface Diagnostic {
  severity: 'error' | 'warning';
  code: DiagnosticCode;
  message: string;
  fileId: string;
  range: Range;
  source: string;               // file source text, for downstream code-frame rendering
  hint?: string;
}

export type DiagnosticCode =
  | 'YPK001'  // dynamic source string
  | 'YPK002'  // missing placeholder param
  | 'YPK003'  // extra param
  | 'YPK005'  // spread params (can't verify)
  | 'YPK007'  // invalid plural (missing other)
  | 'YPK008'; // empty source string
```

## 9. Komponenter

### 9.1 `resolve-bindings.ts`

Bygger en **scope-trädad** binding-table per fil. Spårar alla identifierare som resolvar till `$t` eller wrapper därav.

**Tre binding-kinds:**

```ts
import { $t } from '@yapyak/core';            // { localName: '$t', kind: 'direct' }
import { $t as t } from '@yapyak/core';       // { localName: 't', kind: 'direct' }
import * as Y from '@yapyak/core';            // { localName: 'Y', kind: 'namespace' }
const t = $t;                                  // { localName: 't', kind: 'wrapper' }
```

Scope-modellen: en `Scope` per fil + per Block (function-body, if-block, etc). Lookup går scope-uppåt tills binding hittas. Nested wrappers shadowed korrekt.

### 9.2 `discover-calls.ts`

Traverserar AST med `forEachChild`. För varje `CallExpression`:

1. Resolva callee mot `BindingTable.find(name, node)`
2. Direkt-binding eller wrapper → registrera som `CallSite`
3. Namespace-binding (`Y.$t(...)`) → kontrollera property-access mot `$t`

### 9.3 `parse-arguments.ts`

Validerar argument-strukturen vid varje `CallSite`.

**Regel 1: First arg = string-literal.** YPK001 annars.

```ts
$t('Hello')                    // ✅
$t(`Hello`)                    // ✅ no-substitution template
$t(`Hi ${name}`)               // ❌ YPK001
$t(someVar)                    // ❌ YPK001
$t('Hi ' + name)               // ❌ YPK001
```

**Regel 2: Placeholders extraheras från source.** Plain `{name}`, ICU `{count, plural, ...}`, `{when, date, ...}`, etc.

**Regel 3: Params måste matcha placeholders.**

- Saknad key → YPK002
- Extra key → YPK003
- `{...spread}` → YPK005

**Regel 4: Options-objekt är dynamiskt.**

```ts
$t('Save', undefined, { locale: 'sv' });               // inline static — re-rendered
$t('Save', undefined, { locale: previewLocale.value }); // dynamic — preserved verbatim
$t('Save', undefined, svOptions);                      // reference — preserved verbatim
$t('Save', undefined, getOptions());                   // call result — preserved verbatim
```

För **inline static** literal: compiler läser `locale`-fältet, sätter `parsed.forcedLocale` (används av transform för att skippa single-locale-elision).

För **icke-static**: compiler bevarar uttrycks-texten i `parsed.optionsExpression`. Transform inlinar verbatim vid call-site.

**Disambiguering arg[1]:**

```ts
$t('Hi {name}', { name }, opts);  // source har placeholders → arg[1]=params, arg[2]=options
$t('Save', opts);                  // source utan placeholders → arg[1]=options
```

### 9.4 `call-site-context.ts`

Walka uppåt från ett `$t`-anrop. Bygg en `CallSiteContext` med:

- `componentName` — närmaste React-komponent (`function Foo`, `const Foo = () => ...`, `forwardRef`, `memo`-wrap, etc)
- `enclosingFunction` — närmaste funktion/method-namn
- `enclosingHook` — närmaste `use*`-funktion
- `enclosingJsx` — närmaste JSX-element-tag

Detta är auto-context som skickas till translator vid auto-translation. Användaren behöver inte annotera nåt — kontext kommer från AST.

### 9.5 `plural.ts`

ICU placeholder-parser. Klassificerar varje placeholder som `simple` / `plural` / `select` / `date` / `time` / `number`. Validerar plural för required `other`-branch (YPK007 annars). Brace-counting för nested templates.

### 9.6 `id.ts`

```ts
export function toMessageId(source: string): string {
  return createHash('sha256').update(source).digest('hex').slice(0, 12);
}
```

48 bits → ~16M unika ids före 1% kollisions-risk. Mer än nog.

Translation-files keyas på id (kort hash), inte source (lång sträng).

### 9.7 `diagnostic.ts`

```ts
export function createDiagnostic(input: {
  code: DiagnosticCode;
  severity: 'error' | 'warning';
  message: string;
  fileId: string;
  range: Range;
  source: string;
  hint?: string;
}): Diagnostic;
```

Diagnostic frame rendering sker i shell-lagret (Vite, CLI, LSP). Pure-core ger bara strukturen.

## 10. `extract.ts` orchestrator

```ts
extractFile(request) →
  1. createSourceFile (ScriptKind från fileId)
  2. resolveBindings → BindingTable
  3. discoverCalls → CallSite[]
  4. för varje CallSite:
     a. parseArguments → ParsedArguments + diagnostics
     b. parsePlaceholders → Placeholder[]
     c. resolveCallSiteContext → CallSiteContext
     d. toMessageId(source) → id
     e. merge i messagesById (dedupe på id, ackumulera locations)
  5. return { messages, callSites, diagnostics }
```

ID är `sha256(source)` — samma source överallt = samma id = samma translation-entry. Cross-file dedupe via id.

## 11. `transform.ts`

Använder `magic-string` för rewrite med bevarad source-map. Återanvänder offsets från `ExtractFileResult.callSites` — ingen re-parse.

### Transform-pipeline

```
1. Replace call-sites (från ExtractFileResult.callSites)
   a. $t(...) → elide (single-locale + simple) | _$pick(...) (multi-locale eller komplex)
2. Constant-fold (single-locale only)
   a. getLocale() → 'en' (literal)
   b. useLocale() → ['en', () => {}] (literal tuple)
   c. setLocale(...) calls → undefined (no-op expression)
3. Import-elision pass
   a. Scan @yapyak/* import declarations
   b. Räkna reference per specifier i intermediate code
   c. Strip unreferenced specifiers
   d. Add _$pick if needed
   e. Remove empty import statements
4. Emit code + source-map
```

### Options-emit-regler

| Källa | Emit |
|---|---|
| Inget options-arg | `_$pick(catalog, params)` |
| Inline `{ locale: 'sv' }` | `_$pick(catalog, params, { locale: 'sv' })` |
| Variable ref `opts` | `_$pick(catalog, params, opts)` |
| Computed expr `getOpts()` | `_$pick(catalog, params, getOpts())` |
| Reactive `ref.value` | `_$pick(catalog, params, ref.value)` |

**Inga options-mutations.** Inget context-stripping (context finns inte). Det användaren skrev → det runtime ser.

### Single-locale elision regler

| Pattern | Elision möjlig? |
|---|---|
| `$t('Hello')` | ✅ → `'Hello'` |
| `$t('Hi {name}', { name })` (simple placeholders) | ✅ → `` `Hi ${name}` `` |
| `$t('{count, plural, ...}', { count })` (komplex placeholder) | ❌ → `_$pick(...)` |
| `$t('Hello', undefined, { locale: 'sv' })` (forced locale, statisk) | ❌ → `_$pick(...)` (catalog behövs) |
| `$t('Hello', undefined, opts)` (dynamiska options) | ❌ → `_$pick(...)` |

Elision sker ENDAST när source har bara simple placeholders OCH inga options. Vi kan inte inlina när options-uttrycket kan ändra locale runtime.

## 12. Framework support — fragment-arkitektur

Vanilla TS/JS-pipelinen ovan parsar en hel fil som ett enda `SourceFile`. SFC-filer (`.vue`, `.svelte`, `.astro`) har FLERA JS-fragments på olika positioner i samma fil — `<script>`-block, template-interpolations, attribut-bindings.

För att stödja `$t()` **överallt** i SFC-filer (inte bara `<script>`) introducerar vi **fragment-orienterad pipeline**.

### 12.1 Kärnabstraktionen

```ts
export interface Fragment {
  code: string;                  // ren JS/TS kod
  originalOffset: number;        // byte-position i original-fil där code[0] ligger
  kind: 'script' | 'template-expression';
  lang: 'js' | 'ts';
}

export interface FrameworkAdapter {
  splitToFragments(source: string): Fragment[];
  importTargetRange(source: string): { start: number; end: number };
  ensureImportBlock(source: string): { code: string; offset: number };
}
```

### 12.2 Per-framework fragments

| Framework | Script-fragments | Template-fragments |
|---|---|---|
| **Vanilla** | hela filen som enda script-fragment | — |
| **Vue** | varje `<script>` + `<script setup>` | varje `{{...}}`-interpolation, alla `:foo="..."` / `v-bind:foo="..."` attribut-expressions, event handlers |
| **Svelte** | varje `<script>` | varje `{...}`-expression i markup, attribut-expressions |
| **Astro** | `---`-frontmatter | varje `{...}`-expression i markup, attribut-expressions |

### 12.3 Pipeline-flow

```
ExtractFileRequest
       │
       ▼
┌──────────────────────────┐
│ FrameworkAdapter         │ ← detekterad från fileId-extension
│   .splitToFragments()    │
└──────────┬───────────────┘
           │
           ▼
   Fragment[]
           │
           ▼ (per fragment)
┌──────────────────────────┐
│ resolveBindings          │
│ discoverCalls            │
│ parseArguments           │
│ resolveCallSiteContext   │
└──────────┬───────────────┘
           │
           ▼ remap ranges to original coords
           │
           ▼ (aggregate)
   ExtractFileResult
```

För transform: **EN `MagicString` över ORIGINAL-källan**. Varje callSite har originalkoordinater. magic-string applicerar alla edits. Källkarta automatisk och korrekt.

### 12.4 Position-remapping — invariant

```ts
function remapRange(range: Range, fragment: Fragment, originalSource: string): Range {
  const startOffset = range.start.offset + fragment.originalOffset;
  const endOffset = range.end.offset + fragment.originalOffset;
  return {
    start: offsetToPosition(originalSource, startOffset),
    end: offsetToPosition(originalSource, endOffset),
  };
}
```

**Invariant per callSite:**
```
originalSource.slice(callSite.range.start.offset, callSite.range.end.offset) === <text att ersätta>
```

Tester verifierar detta för varje fragment-baserad fixture.

### 12.5 Cross-fragment binding-resolution

Vue `<script setup>` exporterar implicit till `<template>`. Template-fragments måste se script-bindings.

**Modell:** Bygg bindings-tabell från ALLA `<script>`-blocks först. Template-fragments använder denna gemensamma tabell.

Implementation: `resolveBindings` körs en gång över concatenerade script-fragments, scope-trädet sparas. Template-fragments använder tabellen för lookup utan att lägga till egna bindings (template-scope är "read-only").

### 12.6 Import-elision i SFCs

Templates har inga egna imports. `_$pick` (om används) läggs till i lämpligt script-block:

- **Vue:** `<script setup>` om finns, annars `<script>`, annars skapa nytt `<script setup>`-block överst
- **Svelte:** `<script>` om finns, annars skapa nytt överst
- **Astro:** `---`-frontmatter om finns, annars skapa nytt överst

`FrameworkAdapter.ensureImportBlock(source)` returnerar position + ev. ny block-skeleton.

### 12.7 Dependencies per framework

| Framework | Peer-dep | Vad det ger | Optional? |
|---|---|---|---|
| **Vue** | `@vue/compiler-sfc` | Komplett SFC-parser inkl. template-AST | ✅ |
| **Svelte** | `svelte` (inkl. `svelte/compiler`) | Svelte AST med MustacheTag, attribute-expressions | ✅ |
| **Astro** | `@astrojs/compiler` | WASM-baserad AST | ✅ |

Alla three lazy-loadas via `createRequire`. Användare som inte använder ett framework laddar aldrig dess compiler.

### 12.8 Vad fungerar i alla tre frameworks

Källkod-mönster som **alla** stödjer:

```ts
// I script
$t('Hello')
$t('Hi {name}', { name })
$t('Save', undefined, { locale: previewLocale.value })

// I template text interpolation
{{ $t('Hello') }}              // Vue
{$t('Hello')}                   // Svelte / Astro

// I attribute expressions
<button :aria-label="$t('Cool')">x</button>    // Vue
<button aria-label={$t('Cool')}>x</button>     // Svelte / Astro

// I event handlers
@click="$t('Clicked')"                          // Vue
onclick={() => $t('Clicked')}                   // Svelte / Astro

// I conditionals
{#if active}{$t('Active')}{/if}                 // Svelte
{active && $t('Active')}                        // Astro / Vue
```

**Begränsning:** Statiska strängliterale-attribut utan expression-syntax stöds inte:

```vue
<button aria-label="$t('Cool')">x</button>      ❌ Vue treats as literal string
```

Detta är fundamentalt — frameworks parsar inte JS i statiska attribut. Workaround: använd expression-syntax (`:foo` / `{foo}`).

## 13. Diagnostic codes katalog

| Kod | Severity | Trigger | Hint |
|---|---|---|---|
| YPK001 | error | Dynamic source i `$t(...)` | "Use `{placeholder}` syntax + params object instead of string concatenation or template interpolation." |
| YPK002 | error | Missing placeholder-param | "Add `{name}` to the params object." |
| YPK003 | warning | Extra placeholder-param | "Remove unused `{name}` from params object." |
| YPK005 | warning | Spread params (`{...obj}`) | "Spread params cannot be statically verified. Pass keys explicitly to enable validation." |
| YPK007 | error | Invalid ICU plural shape | "Plural requires `other` branch. Optional: `zero`, `one`, `two`, `few`, `many`." |
| YPK008 | error | Tom source-string | "$t('') has no meaning. Pass a non-empty string literal." |

**6 koder.** Allt om factory/createT/context borta.

Användare kan disable enskilda koder via shell-config (Vite-plugin options eller `.yapyak.json`).

## 14. ID generation

**Stable hash per source.**

```ts
export function toMessageId(source: string): string {
  return createHash('sha256').update(source).digest('hex').slice(0, 12);
}
```

Egenskaper:

- **Deterministisk.** Samma source → samma id, alltid.
- **Cross-file dedupe.** Samma source i olika filer = samma id = en translation-entry.
- **Stabil mot rename.** Variabelnamn, komponentnamn, etc. påverkar inte id.
- **Kollision-resistent på praktisk skala.** 48 bits → ~16M unika ids.

Translation-files struktur:
```json
{
  "abc123def456": "Hej",
  "789xyz012abc": "Välkommen"
}
```

Kort, enkelt, snabbt att slå upp.

## 15. Plurals & ICU format

Source-syntax: standard ICU MessageFormat.

```ts
$t('{count, plural, one{# item} other{# items}}', { count });
$t('{gender, select, male{he} female{she} other{they}}', { gender });
$t('{when, date, medium}', { when });
$t('{cost, number, currency}', { cost });
```

### Validering

- `plural` kräver `other`-branch → YPK007 annars
- `select`-branches måste vara statiska strängar (variables → YPK001)
- Format-typer (`date`, `time`, `number`) kontrolleras inte djupare; runtime hanterar

### Runtime-strategi

| Pattern | Single-locale | Multi-locale |
|---|---|---|
| Bara `{name}` (simple) | Inline template literal | `_$pick(...)` |
| `{count, plural}` | `_$pick(...)` + 1-locale plural-fn (~200b) | `_$pick(...)` + full CLDR (~2kb) |
| `{when, date}` / `{cost, number}` | `_$pick(...)` + Intl wrapper | samma |

**Allt funkar.** Bara enkla placeholders får literal-template-elision. Plural/format kräver runtime även för en locale.

## 16. Caching

**Cache lever i shell-lagret, inte i parser-core.**

Vite-plugin/CLI ansvar:

```ts
interface FileCache {
  mtime: number;
  contentHash: string;
  extracted: ExtractFileResult;
  transformed?: TransformFileResult;
}
```

Persisteras till `node_modules/.cache/yapyak/files.json`. Kallstart på stort repo: ~50ms istället för ~2s.

Pure-core tar input och returnerar output — vet inte om cache existerar.

## 17. Dependencies

| Paket | Storlek | Roll | Status |
|---|---|---|---|
| `typescript` | peer | parser + AST | `>=5.0.0` peer |
| `magic-string` | 38kb | transform + source maps | dependency |
| `@vue/compiler-sfc` | optional peer | Vue SFC | bara om Vue-användare |
| `svelte` | optional peer | Svelte preprocess | bara om Svelte-användare |
| `@astrojs/compiler` | optional peer | Astro preprocess | bara om Astro-användare |

**Build-time only.** Ingenting från denna lista landar i användarens bundle.

## 18. Performance budget

| Operation | Regex (förr) | TS Compiler API | Babel |
|---|---|---|---|
| Parse 1 fil (10kb) | ~0.5ms | ~3ms | ~6ms |
| Full scan 500 filer | ~250ms | ~1.5s | ~3s |
| HMR enskild fil | ~1ms | ~3ms | ~6ms |
| Memory steady-state | låg | medel | hög |

**3x långsammare än regex, 2x snabbare än Babel.** För dev-loop osynligt (HMR <10ms). För full build = ~1s extra.

## 19. Test policy

**100% branch coverage** för parser/.

Test-modell: **fixture-driven snapshot tests.**

```
parser/fixtures/
├── bindings/                    # binding patterns
│   ├── direct-import.ts
│   ├── aliased-import.ts
│   ├── namespace-import.ts
│   ├── wrapper.ts
│   └── shadowed-wrapper.ts
├── calls/
│   ├── simple.ts
│   ├── placeholders.ts
│   ├── nested-jsx.tsx
│   ├── arrow-callback.ts
│   ├── dynamic-options.ts          # NEW
│   └── options-from-variable.ts    # NEW
├── diagnostics/
│   ├── ypk001-dynamic-source.ts
│   ├── ypk002-missing-param.ts
│   ├── ypk003-extra-param.ts
│   ├── ypk005-spread-params.ts
│   ├── ypk007-invalid-plural.ts
│   └── ypk008-empty-source.ts
├── single-locale/
│   ├── elision-literal.ts
│   ├── elision-template.ts
│   ├── elision-import.ts
│   └── constant-fold-uselocale.ts
└── multi-locale/
    └── full-pick.ts
```

Plus framework-specifika fixtures i `framework/fixtures/{vue,svelte,astro}/`.

## 20. Determinism + error recovery

### Determinism

`extractFile(input)` är **rent deterministisk**. Samma input → samma output, alltid. Inga `Date.now()`, `Math.random()`, `process.env`, eller iteration-ordning från `Set`/`Map` utan explicit sort.

### Error recovery

**Parser bailar inte vid syntax errors.** `ts.createSourceFile` producerar partial AST. Vi extraherar vad vi kan och returnerar syntax errors som diagnostics.

`$t` i kommentarer eller type-positions skipas via AST-kind-check.

## 21. Migration / PR-sekvens

PR 1–9 är landade (legacy regex-parser ersatt, vanilla pipeline fungerar). Återstår:

| PR | Innehåll | Status |
|---|---|---|
| 10 | API-cleanup — radera `$createT`/factory/context från type.ts, resolve-bindings, parse-arguments, extract, transform, fixtures, tester. Implementera options-arg-preservation för dynamic locale. | Pending |
| 11 | Fragment-arkitektur: refactor extract/transform till fragment-orienterade. Vanilla adapter. | Pending |
| 12 | Vue adapter (script + template + attributes) + tester | Pending |
| 13 | Svelte adapter (script + template + attributes) + tester | Pending |
| 14 | Astro adapter (frontmatter + template + attributes) + tester | Pending |
| 15 | Constant-folding av `useLocale`/`getLocale`/`setLocale` (för full single-locale-elision) | Pending |
| 16 | Caching (FileCache i Vite-plugin) | Pending |

## 22. Vad detta INTE löser

Ärlighetsplikt:

- **Cross-fil binding-tracking.** Wrappers exporterade från andra filer detekteras inte (per-fil parsing).
- **Type-checking av params mot källliteral.** TypeScript gör redan det via `ParamsForSource<T>`. Plugin behöver inte göra om det.
- **Runtime-spread:** `$t('Hi {name}', { ...obj })` — kan inte verifieras statiskt. YPK005 warning.
- **Statiska strängliterale-attribut i SFCs** (utan `:`/`{}` expression-syntax). Framework-fundamental.
- **Disambiguation av polysemy** ("Save" som submit-button vs file-save). Användaren ska skriva specifikare source-strings (`'Submit'`, `'Save file'`).

## 23. Framtida lås-ups

Allt detta kan byggas ovanpå AST-extractorn:

| Tier | Feature | Insats |
|---|---|---|
| 2 | VS Code LSP (hover + diagnostics + CodeLens) | ⭐⭐ |
| 2 | Type-safe catalog `.d.ts` generation | ⭐ |
| 2 | CLI `yapyak add <locale>` | ⭐ |
| 2 | CLI `yapyak doctor` (bundle-cost preview) | ⭐ |
| 3 | CLI `find` / `wrap` / `rename-param` | ⭐⭐ |
| 3 | ESLint plugin | ⭐ |
| 3 | Webpack-loader (Next.js Pages) | ⭐⭐ |
| 4 | `yapyak studio` web-UI | ⭐⭐⭐⭐ |
| 4 | AI auto-translate vid `yapyak add` | ⭐⭐ |

**Alla återanvänder samma core-extractor.** Det är hela poängen med pure-function-designen.

## 24. Beslut sammanfattade

- ✅ TypeScript Compiler API som parser (per-file, no createProgram)
- ✅ Pure-function core, ren från I/O
- ✅ Bor i `packages/compiler/src/parser/`
- ✅ magic-string för transform
- ✅ **Single API: `$t(source, params?, options?)`.** Ingen `$createT`, ingen context.
- ✅ **Options preserveras verbatim** när non-static. Dynamic locale (reactive) fungerar naturligt.
- ✅ **Single-locale-mode = compile-time elision + import-stripping = noll yapyak i bundle**
- ✅ Stable diagnostic codes (6 stycken)
- ✅ ID = sha256(source).slice(0,12) — cross-file dedupe
- ✅ Cache lever i shell-lagret, inte parser-core
- ✅ Fragment-orienterad pipeline för SFC-support (Vue/Svelte/Astro)
- ✅ `$t()` fungerar i `<script>`, `<template>`, attribute-bindings, event handlers
- ✅ Fixture-driven snapshot tests
- ✅ Naming-rules: `*Request`/`*Result` för function-scoped types; `discover*`/`resolve*`/`to*` från verb-vokabulären

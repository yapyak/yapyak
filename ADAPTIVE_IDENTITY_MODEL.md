# Adaptive Identity Model — Final Specification

> Synthesis of an extended architectural discussion exploring how yapyak should identify and store translations. This document supersedes earlier drafts and represents the watertight specification we are committing to.

## The Central Insight

Every i18n tool ever built has treated translations as **external data** with **manual identifiers** that developers maintain by hand. Some have softened this with auto-IDs, source-as-key, or context annotations — but the fundamental shape remains: *translation identity is a thing developers manage*.

The adaptive identity model inverts this:

> **The code is the identity.**

Source text, AST role, file scope, and project structure are not metadata *about* translations. They *are* the translation identity. The compiler reads them. The locale file reflects them. The AI uses them. No layer of human-managed mapping exists between them.

Every mechanism in this specification is a direct consequence of this principle, applied consistently. Once stated, the rest is inevitable.

---

## TL;DR

This document specifies the **adaptive identity model** for yapyak — a five-pillar architecture for translation identity that is, as far as we know, a novel combination of mechanisms in the open-source i18n landscape.

The model uses **source string as primary identity**, with **AST-derived context attached to every entry as structured data**. It supports **project-wide translation memory** from the locale files themselves (no separate cache), **cross-file refactor detection** that carries translations across moves without AI calls, **AI-as-arbiter** for ambiguous new call sites via candidates injected into the locale file itself (no provider-specific prompts), **orphan retention** so translations remain queryable even after their source disappears, and **provenance tracking** so every translation entry can be traced to how it arrived.

The model solves the five concrete failure modes of the previous `(fileId, source)` model: same-file homonyms, refactor churn, missing cross-file memory, silent semantic misses on first new use, and unnecessary AI calls. It does so while keeping the developer-facing API minimal (`t('Save')` plus the chainable `.notes()` annotation), the runtime unchanged (compiled `_pick({...})` per call site), and locale files self-contained as portable translation work items — readable by any AI, agent, or translator without external context.

The locale file shape and the *translator* interface are specified in companion documents: [LOCALE_FILE_FORMAT.md](./LOCALE_FILE_FORMAT.md) (v1.1) and [TRANSLATOR_INTERFACE.md](./TRANSLATOR_INTERFACE.md) (v1.0). This document focuses on the identity logic; those documents focus on storage and translation protocol respectively.

**Implementation estimate:** ~570 lines of production TypeScript across four phases, ~3–5 weeks with tests and documentation.

**Novelty claim:** The combination of (1) automatic AST-context derivation, (2) source as primary identity with same-source homonyms represented as parallel records, (3) project-wide locale-files-as-memory with no external cache, (4) format-as-protocol AI arbitration via candidates inlined in the locale file, and (5) refactor detection across file boundaries with orphan retention has not been done systematically in any mainstream open-source i18n tool we are aware of.

---

## 1. The Five Pillars

The architecture rests on five distinct mechanisms that work together but are conceptually separate:

### 1.1 Source-as-Key

**Identity is the source string.** A translation entry is identified primarily by the literal English (or default-locale) text that appears at the call site. This makes identity stable against the operations that happen most often during development: wrapper insertion, element-type change, attribute change, sibling reordering, layout restructuring.

### 1.2 AST-Derived Context Per Entry

**Every entry carries its structural context as compiler-owned data.** When the AST is parsed, yapyak derives the element type, role (children vs attribute), enclosing component, and call kind for each `t()` call. This context is stored alongside the source in the locale file's `context` field, regenerated on every save. Same-source homonyms ([Save] in a button vs in a heading) become **parallel records** with the same `source` and different `context`. Disambiguation is structural and visible — never hidden behind a stable ID or a manual key.

### 1.3 Project-Wide Translation Memory

**Locale files are the cache.** When a translation is needed, yapyak builds an in-memory map from all locale files: `source → [{value, context, file}]`. No external cache, no separate store. The repository is the source of truth, and the same JSON files that *translators* edit are what powers cross-file consistency.

### 1.4 Cross-File Refactor Detection

**Moves carry translations without AI.** When a source string disappears from one file and appears in another within a save (or set of saves), yapyak classifies it as a move and migrates the translation directly. No AI calls. No translation churn. Orphan entries are retained as project memory so moves across multiple saves still work.

### 1.5 AI-as-Arbiter

**The model decides semantic reuse.** When a new call site introduces a source string that already exists elsewhere — but in a different context — yapyak does not assume same source means same meaning. The translator is invoked with the new call site context and the existing translation as a candidate, with instructions to use the candidate only if the meaning matches. The model decides whether to inherit or re-translate.

These five pillars are independent enough to be implemented in stages but designed to function as a unit.

---

## 2. Identity & Storage

The on-disk representation is specified in full detail in [LOCALE_FILE_FORMAT.md](./LOCALE_FILE_FORMAT.md) (v1.1). This section explains the **identity model itself** — what uniquely identifies a translation, and how identity maps to the storage shape.

### 2.1 Identity Tuple

The identity of a translation is the tuple:

```
identity = (file, source, context)
```

Where:
- **`file`** is the source file path of the `t()` call site (e.g., `"src/checkout/CartReview.tsx"`)
- **`source`** is the literal English (or default-locale) text passed to `t()` (e.g., `"Open"`)
- **`context`** is the AST-derived structural context (element, role, component, kind)

Two `t()` calls with the same identity tuple represent the same logical message and share a single locale entry. Two `t()` calls that differ in any one of the three dimensions are distinct logical messages and live as parallel entries.

This is the model. Everything else in this document — the algorithm, the memory build, the refactor detection, the arbitration — is a consequence of operating on this identity tuple.

### 2.2 Storage Shape

Identity is materialized in the locale file as a **records-array per file**. Each record is one entry; each entry corresponds to one identity tuple. Same-source homonyms appear as parallel records with the same `source` and different `context`.

```jsonc
{
  "$schema": "https://yapyak.dev/locale/v1",
  "sourceLocale": "en",
  "targetLocale": "sv",
  "instructions": { /* ... */ },
  "glossary": [ /* ... */ ],
  "files": {
    "src/components/EmptyCart.tsx": [
      {
        "source": "Your cart is empty",
        "context": {
          "kind": "elementChild",
          "container": "h2",
          "enclosing": "EmptyCart",
          "ancestors": [],
          "position": 1
        },
        "target": "Din kundvagn är tom"
      },
      {
        "source": "Browse products",
        "context": {
          "kind": "elementChild",
          "container": "button",
          "enclosing": "EmptyCart",
          "ancestors": [],
          "position": 1
        },
        "target": "Bläddra bland produkter"
      }
    ]
  }
}
```

Each record is owned by multiple actors across zones (`source`, `context` compiler-owned; `notes`, `value`, `status` author/translator-owned). See LOCALE_FILE_FORMAT.md for the full zone breakdown and the full discriminated-union shape of `context`.

### 2.3 Same-Source Homonyms

When two `t()` calls in the same file share a source string but appear in different structural contexts, they materialize as two records with the same `source`:

```tsx
// src/store/StorePanel.tsx
<button>{t('Open')}</button>
<Badge>{t('Open')}</Badge>
```

```jsonc
"src/store/StorePanel.tsx": [
  {
    "source": "Open",
    "context": {
      "kind": "elementChild",
      "container": "button",
      "enclosing": "StorePanel",
      "ancestors": [],
      "position": 1
    },
    "target": "Öppna"
  },
  {
    "source": "Open",
    "context": {
      "kind": "elementChild",
      "container": "Badge",
      "enclosing": "StorePanel",
      "ancestors": [],
      "position": 1
    },
    "target": "Öppet"
  }
]
```

Identity disambiguation is **structural and visible**. A *translator* reading the file sees two parallel records, knows they are different uses of the same source (`container` differs), and can translate each appropriately. No nested sub-keys, no positional suffixes, no hidden disambiguation — just data.

### 2.4 Attribute Disambiguation

Same source in different attribute roles disambiguates the same way — but via `kind: "elementAttribute"` with the attribute name in `slot`:

```tsx
// src/forms/SearchForm.tsx
<input placeholder={t('Search')} aria-label={t('Search')} />
<button aria-label={t('Search')}><SearchIcon /></button>
```

```jsonc
"src/forms/SearchForm.tsx": [
  {
    "source": "Search",
    "context": { "kind": "elementAttribute", "container": "input", "slot": "placeholder", "enclosing": "SearchForm", "ancestors": [], "position": 1 },
    "target": "Sök"
  },
  {
    "source": "Search",
    "context": { "kind": "elementAttribute", "container": "input", "slot": "ariaLabel", "enclosing": "SearchForm", "ancestors": [], "position": 1 },
    "target": "Sök"
  },
  {
    "source": "Search",
    "context": { "kind": "elementAttribute", "container": "button", "slot": "ariaLabel", "enclosing": "SearchForm", "ancestors": [], "position": 1 },
    "target": "Sök"
  }
]
```

Three distinct records, three identities, three potentially distinct translations. `aria-label` becomes `slot: "ariaLabel"` (camelCased — see LOCALE_FILE_FORMAT.md naming conventions).

### 2.5 Parent-Component Disambiguation

When the same `<button>{t('Continue')}</button>` appears in two different parent components in the same file, parent-component context separates them via `ancestors`:

```tsx
// src/checkout/Checkout.tsx
<CartReview><button>{t('Continue')}</button></CartReview>
<PaymentReview><button>{t('Continue')}</button></PaymentReview>
```

```jsonc
"src/checkout/Checkout.tsx": [
  {
    "source": "Continue",
    "context": { "kind": "elementChild", "container": "button", "enclosing": "Checkout", "ancestors": ["CartReview"], "position": 1 },
    "target": "Fortsätt"
  },
  {
    "source": "Continue",
    "context": { "kind": "elementChild", "container": "button", "enclosing": "Checkout", "ancestors": ["PaymentReview"], "position": 1 },
    "target": "Bekräfta"
  }
]
```

`ancestors` is always present for markup kinds (empty array when there are no relevant enclosing components). The disambiguation strategy is documented in §3.3 below.

### 2.6 True Twins (Positional Disambiguation)

When two `t()` calls have identical `source`, `kind`, `container`, `enclosing`, AND `ancestors`, only `position` separates them:

```tsx
// src/dialogs/ConfirmDialog.tsx
<Dialog>
  <button>{t('OK')}</button>
  <button>{t('OK')}</button>
</Dialog>
```

```jsonc
"src/dialogs/ConfirmDialog.tsx": [
  {
    "source": "OK",
    "context": { "kind": "elementChild", "container": "button", "enclosing": "ConfirmDialog", "ancestors": [], "position": 1 },
    "target": "OK"
  },
  {
    "source": "OK",
    "context": { "kind": "elementChild", "container": "button", "enclosing": "ConfirmDialog", "ancestors": [], "position": 2 },
    "target": "OK"
  }
]
```

Position-based disambiguation is **the last resort** and triggers diagnostic **YPK009** (`Two t() calls have identical context — consider extracting a constant or distinguishing by element/attribute`). It exists for completeness, not as an encouraged pattern.

### 2.7 Adding a Homonym to an Existing Source

When a homonym is introduced for a source that previously had a single entry:

**Before** (single record):
```jsonc
"src/StorePanel.tsx": [
  {
    "source": "Open",
    "context": { "kind": "elementChild", "container": "button", "enclosing": "StorePanel", "ancestors": [], "position": 1 },
    "target": "Öppna"
  }
]
```

**Developer adds `<Badge>{t('Open')}</Badge>` to the same file.**

**After extraction**:
```jsonc
"src/StorePanel.tsx": [
  {
    "source": "Open",
    "context": { "kind": "elementChild", "container": "button", "enclosing": "StorePanel", "ancestors": [], "position": 1 },
    "target": "Öppna"
  },
  {
    "source": "Open",
    "context": { "kind": "elementChild", "container": "Badge", "enclosing": "StorePanel", "ancestors": [], "position": 1 },
    "target": ""
  }
]
```

The existing entry is untouched; a new record is appended for the new occurrence. No migration step, no representation change — adding a homonym is just appending a record.

### 2.8 Removing a Homonym

When a homonym is removed:

**Before:**
```jsonc
"src/StorePanel.tsx": [
  {
    "source": "Open",
    "context": { "kind": "elementChild", "container": "button", "enclosing": "StorePanel", "ancestors": [], "position": 1 },
    "target": "Öppna"
  },
  {
    "source": "Open",
    "context": { "kind": "elementChild", "container": "Badge", "enclosing": "StorePanel", "ancestors": [], "position": 1 },
    "target": "Öppet"
  }
]
```

**Developer removes `<Badge>{t('Open')}</Badge>`.**

**After extraction:**
```jsonc
"src/StorePanel.tsx": [
  {
    "source": "Open",
    "context": { "kind": "elementChild", "container": "button", "enclosing": "StorePanel", "ancestors": [], "position": 1 },
    "target": "Öppna"
  }
]
```

The removed record is moved to orphan retention (see §8). It does not vanish silently — it can be inspected via `yapyak status` and explicitly removed via `yapyak clean`.

### 2.9 Why Records-Array, Not Map

An obvious alternative is a map keyed by `source`, with homonyms represented as nested sub-keys. Earlier yapyak drafts used such an "adaptive object form". v1.1 replaces it with records-array for these reasons:

- **Uniform shape.** Every entry is a record. Consumers do not branch on "is this value a string or an object?" — the structure is the same for every entry, regardless of homonym status.
- **Self-contained per entry.** Each record carries its own `context`, `notes`, `status`, and `value`. Locale files become readable by AI agents without external context construction.
- **Same-source homonyms are first-class.** Parallel records are the natural shape; sub-keys were a workaround.
- **Author-owned data has a stable location.** With the four-zone model (`source` / `context` / `notes` / `status` / `value`), authored guidance lives in `notes` and is never overwritten by the compiler.

The cost is larger files (~3× the old form for typical projects) and source-as-key-lookup becoming array iteration. These costs are accepted and documented in LOCALE_FILE_FORMAT.md §Trade-Offs.

### 2.10 What Identity Is Not

To prevent backsliding into anti-patterns documented in §20 (Rejected Alternatives):

- **Identity is NOT a stable yapyak-generated ID.** No ULID, no hash, no opaque handle. The triple `(file, source, context)` is the identity.
- **Identity is NOT a manually-authored key.** Developers do not invent `'profile.save_button'` paths.
- **Identity is NOT preserved across source-text edits without yapyak's refactor detection.** When `source` changes, identity changes — and yapyak detects renames structurally (§7), not via a hidden ID.

These rejections are permanent. They are not future work.

---

## 3. The Adaptive Algorithm

### 3.1 Extraction & Role Computation

For each `t()` call, the compiler extracts:

```ts
interface ExtractedCall {
  source: string;              // the literal passed to t()
  position: { line: number; column: number };
  role: ContextRole;
}

interface ContextRole {
  element: string;             // 'button', 'Badge', 'h1', 'input'
  property: string;            // 'content' for children; attribute name otherwise
  enclosingComponent?: string; // immediate parent component name for escalation
}
```

The role is computed per framework processor:

- **TypeScript/TSX:** walk JSX tree, find nearest enclosing JSX element, identify whether the call is in `children` (becomes `content`) or in an attribute value (becomes the attribute name).
- **Vue templates:** use `@vue/compiler-sfc` to identify template expression positions, derive role from the enclosing element and binding type.
- **Svelte:** use `svelte/compiler` to walk markup, identify enclosing element and attribute.
- **Astro:** use `@astrojs/compiler` to handle frontmatter expressions and template positions.
- **Plain TypeScript (non-JSX):** derive role from enclosing context — object property name, function name, or variable name.

### 3.2 Collision Detection Within File

After extraction, group calls by source string:

```ts
function detectCollisions(calls: ExtractedCall[]): SourceGroups {
  const groups = new Map<string, ExtractedCall[]>();
  for (const call of calls) {
    const list = groups.get(call.source) ?? [];
    list.push(call);
    groups.set(call.source, list);
  }
  return groups;
}
```

A "collision" is any source string with more than one occurrence in the same file.

### 3.3 Disambiguation Granularity

When a source has multiple occurrences in the same file (a collision), yapyak must ensure each occurrence's emitted `context` is unique within the file. The context fields are added in tiers; yapyak adds the smallest set of fields that makes the records unique:

```ts
function computeContextGranularity(occurrences: ExtractedCall[]): ContextRole[] {
  const tiers: Array<(c: ExtractedCall) => ContextRole> = [
    // Tier 1: element + role
    c => ({ element: c.role.element, role: c.role.property }),
    // Tier 2: + immediate component
    c => ({ element: c.role.element, role: c.role.property, component: c.role.enclosingComponent }),
    // Tier 3: + ancestor chain (one level)
    c => ({
      element: c.role.element,
      role: c.role.property,
      component: c.role.enclosingComponent,
      ancestors: c.role.ancestors?.slice(-1) ?? [],
    }),
    // Tier 4: + full ancestor chain
    c => ({
      element: c.role.element,
      role: c.role.property,
      component: c.role.enclosingComponent,
      ancestors: c.role.ancestors ?? [],
    }),
  ];

  for (const tier of tiers) {
    const candidates = occurrences.map(tier);
    if (new Set(candidates.map(serialize)).size === occurrences.length) {
      return candidates;
    }
  }

  // Positional fallback: identical AST contexts → add position 1, 2, ...
  return occurrences.map((c, i) => ({
    element: c.role.element,
    role: c.role.property,
    component: c.role.enclosingComponent,
    ancestors: c.role.ancestors ?? [],
    position: i + 1,
  }));
}
```

The positional fallback is reached only when no structural signal distinguishes occurrences. It triggers diagnostic YPK009 (see §2.6).

### 3.4 Record Emission

The output of extraction is a list of records ready to write into the locale file's `files[fileId]` array:

```ts
function emitFileRecords(calls: ExtractedCall[]): LocaleRecord[] {
  const groups = detectCollisions(calls);
  const records: LocaleRecord[] = [];

  for (const [source, occurrences] of groups) {
    if (occurrences.length === 1) {
      // Single occurrence: emit with minimal context (no ancestors/position)
      records.push({
        source,
        context: {
          element: occurrences[0].role.element,
          role: occurrences[0].role.property,
          component: occurrences[0].role.enclosingComponent,
          kind: occurrences[0].role.kind,
        },
        status: 'missing',
        value: '',
      });
      continue;
    }

    // Multiple occurrences: compute disambiguating context per record
    const contexts = computeContextGranularity(occurrences);
    for (let i = 0; i < occurrences.length; i++) {
      records.push({
        source,
        context: { ...contexts[i], kind: occurrences[i].role.kind },
        status: 'missing',
        value: '',
      });
    }
  }

  return records;
}
```

Newly emitted records have `status: "missing"` and `value: ""`. They are then filled via translation memory lookup (§4), refactor detection (§5), or AI arbitration (§6).

---

## 4. Project-Wide Translation Memory

### 4.1 Memory Construction

At extraction time, yapyak reads all existing locale files and builds an in-memory map indexed by source string. Memory is populated only from records with non-empty `value` and `status: "translated"` (the established translations of the project):

```ts
interface MemoryEntry {
  value: string;
  context: ContextRole;
  fileId: string;
  notes?: NotesObject;
}

type ProjectMemory = Map<Locale, Map<SourceString, MemoryEntry[]>>;

function buildMemory(localeFiles: LocaleFileV1[]): ProjectMemory {
  const memory: ProjectMemory = new Map();

  for (const file of localeFiles) {
    const sourceMap = new Map<SourceString, MemoryEntry[]>();

    for (const [fileId, records] of Object.entries(file.files)) {
      for (const record of records) {
        // Skip entries that are not yet established translations
        if (record.value === '' || record.status === 'missing' || record.status === 'needs-arbitration') {
          continue;
        }

        const list = sourceMap.get(record.source) ?? [];
        list.push({
          value: record.value,
          context: record.context,
          fileId,
          notes: record.notes,
        });
        sourceMap.set(record.source, list);
      }
    }

    memory.set(file.locale, sourceMap);
  }

  return memory;
}
```

The memory is built once per save cycle and lives in RAM. No persistent index files. The locale files themselves are the source of truth. Orphans (`status: "orphaned"` or removed source) are excluded — they appear elsewhere in the orphan retention pass (§8).

### 4.2 Lookup Classifications

When yapyak needs to fill a missing record, lookup classifies the (source, context) pair into one of five outcomes:

```ts
type LookupResult =
  | { kind: 'exact-match'; value: string; fromFileId: string }
  | { kind: 'context-match'; value: string; fromFileId: string }
  | { kind: 'unique-candidate'; candidate: MemoryEntry }
  | { kind: 'multiple-candidates'; candidates: MemoryEntry[] }
  | { kind: 'new' };

function lookup(source: string, context: ContextRole, locale: Locale, memory: ProjectMemory): LookupResult {
  const entries = memory.get(locale)?.get(source) ?? [];

  if (entries.length === 0) return { kind: 'new' };

  // Exact-match: same source + identical context (element + role + component + ancestors)
  const exact = entries.find(e => contextEquals(e.context, context));
  if (exact) {
    return { kind: 'exact-match', value: exact.value, fromFileId: exact.fileId };
  }

  // Context-match: same source + same element + same role (looser than exact, but structurally close)
  const contextMatch = entries.find(
    e => e.context.element === context.element && e.context.role === context.role
  );
  if (contextMatch) {
    return { kind: 'context-match', value: contextMatch.value, fromFileId: contextMatch.fileId };
  }

  // Unique candidate: only one translation exists across all matches
  const uniqueValues = new Set(entries.map(e => e.value));
  if (uniqueValues.size === 1) {
    return { kind: 'unique-candidate', candidate: entries[0] };
  }

  // Multiple candidates: known homonyms across the project
  return { kind: 'multiple-candidates', candidates: entries };
}
```

**Outcome handling.** The five outcomes drive different behavior when filling the missing record:

| Outcome | Action |
|---|---|
| `new` | Leave `status: "missing"` and `value: ""`. The *translator* will translate fresh. |
| `exact-match` | Set `value` directly. `status: "translated"`. Provenance: `inherited` (no AI). |
| `context-match` | Set `value` directly. `status: "translated"`. Provenance: `inherited`. |
| `unique-candidate` | Inject `candidates` field, set `status: "needs-arbitration"`. The *translator* decides. |
| `multiple-candidates` | Inject all `candidates`, set `status: "needs-arbitration"`. The *translator* decides. |

Direct-carry outcomes (`exact-match`, `context-match`) avoid AI calls entirely. Arbitration outcomes require one *translator* call but provide full candidate information so the AI does not have to guess.

### 4.3 Memory-as-Cache

The cache effect of memory is significant. For each save:

1. yapyak parses all changed files
2. Computes new keys and roles
3. Builds memory from all existing locale files
4. For each empty stub in the new state, looks up the memory
5. Only invokes the AI for entries that genuinely need it

For a typical incremental save (1–5 new strings, project of 1000 entries):
- Memory build: ~10ms
- Lookup per new entry: O(1) hash lookup
- AI calls avoided: 80–95% of new entries (when translations already exist)

For a backfill (new locale across an existing project):
- Memory build: ~50ms for 10k entries
- Lookups: O(N) where N is missing entries
- AI calls only for genuinely new translations

The memory is a free cache — it requires no separate storage, no invalidation logic, no synchronization. The locale files in Git are the cache.

---

## 5. Refactor Detection

### 5.1 The Diff Window

Refactor detection operates on the "diff window" — the set of files that changed in the current save cycle. In Vite dev mode, this is typically a single file. In CI builds or batched commits, this can be many files.

```ts
interface DiffWindow {
  before: Map<FileId, ExtractedCall[]>;  // extraction state before this cycle
  after: Map<FileId, ExtractedCall[]>;   // extraction state after this cycle
}
```

### 5.2 Source Location Maps

For each source string, build a map of which files contained it before and after:

```ts
type SourceLocations = Map<SourceString, Set<FileId>>;

function buildSourceLocations(extraction: Map<FileId, ExtractedCall[]>): SourceLocations {
  const map = new Map<SourceString, Set<FileId>>();
  for (const [fileId, calls] of extraction) {
    for (const call of calls) {
      const set = map.get(call.source) ?? new Set();
      set.add(fileId);
      map.set(call.source, set);
    }
  }
  return map;
}
```

### 5.3 Move, Split, Merge Detection

```ts
type Refactor =
  | { kind: 'move'; source: string; from: FileId; to: FileId; role: ContextRole }
  | { kind: 'split'; source: string; from: FileId; to: FileId[]; roles: ContextRole[] }
  | { kind: 'merge'; source: string; from: FileId[]; to: FileId }
  | { kind: 'rename-at-position'; source: { old: string; new: string }; file: FileId; position: Position };

function detectRefactors(diff: DiffWindow): Refactor[] {
  const oldLocations = buildSourceLocations(diff.before);
  const newLocations = buildSourceLocations(diff.after);
  const refactors: Refactor[] = [];

  for (const [source, newFiles] of newLocations) {
    const oldFiles = oldLocations.get(source) ?? new Set();
    const removed = [...oldFiles].filter(f => !newFiles.has(f));
    const added = [...newFiles].filter(f => !oldFiles.has(f));

    if (removed.length === 1 && added.length === 1) {
      // Pure 1-to-1 move
      const toCall = findCall(diff.after, added[0], source);
      refactors.push({ kind: 'move', source, from: removed[0], to: added[0], role: toCall.role });
    } else if (removed.length === 1 && added.length > 1) {
      // Split: one file's source spread across multiple new locations
      const toCalls = added.map(f => findCall(diff.after, f, source));
      refactors.push({ kind: 'split', source, from: removed[0], to: added, roles: toCalls.map(c => c.role) });
    } else if (removed.length > 1 && added.length === 1) {
      // Merge: multiple files' source consolidated into one
      refactors.push({ kind: 'merge', source, from: removed, to: added[0] });
    }
    // N-to-M cases: treated as new entries (translation memory still applies)
  }

  // Position-based rename detection (handled separately, see Section 7)
  for (const [fileId, newCalls] of diff.after) {
    const oldCalls = diff.before.get(fileId) ?? [];
    for (const newCall of newCalls) {
      const oldCall = oldCalls.find(c =>
        c.position.line === newCall.position.line &&
        c.position.column === newCall.position.column &&
        c.source !== newCall.source
      );
      if (oldCall) {
        refactors.push({
          kind: 'rename-at-position',
          source: { old: oldCall.source, new: newCall.source },
          file: fileId,
          position: newCall.position,
        });
      }
    }
  }

  return refactors;
}
```

### 5.4 Refactor Resolution

Each refactor produces a translation-carry action that writes a `value` (and `status: "translated"`) into the new record:

```ts
interface CarryAction {
  fileId: string;
  source: string;
  context: ContextRole;
  value: string;
  provenance: 'moved' | 'split' | 'merged';
}

function applyRefactors(refactors: Refactor[], memory: ProjectMemory): CarryAction[] {
  const actions: CarryAction[] = [];

  for (const r of refactors) {
    if (r.kind === 'move') {
      const existing = lookupExact(r.source, r.role, memory);
      if (existing) {
        actions.push({
          fileId: r.to, source: r.source, context: r.role,
          value: existing.value, provenance: 'moved',
        });
      }
    } else if (r.kind === 'split') {
      // Same translation goes to each new location with its respective role
      const existing = lookupAny(r.source, memory);
      if (existing) {
        for (let i = 0; i < r.to.length; i++) {
          actions.push({
            fileId: r.to[i], source: r.source, context: r.roles[i],
            value: existing.value, provenance: 'split',
          });
        }
      }
    } else if (r.kind === 'merge') {
      // Pick translation from any of the source files (typically all should match)
      const existing = lookupFromAny(r.source, r.from, memory);
      if (existing) {
        actions.push({
          fileId: r.to, source: r.source, context: r.role,
          value: existing.value, provenance: 'merged',
        });
      }
    } else if (r.kind === 'rename-at-position') {
      // Position-based rename (see Section 7)
      handleRenameAtPosition(r, actions, memory);
    }
  }

  return actions;
}
```

These actions are applied to the v1.1 records-array: yapyak finds the new record (by `fileId`, `source`, `context`) and sets its `value` directly, bypassing the *translator*. No AI call. No `candidates`. Provenance is recorded in `.yapyak/provenance.json`.

### 5.5 Confidence Levels

Not every refactor signal is equally strong. Confidence levels guide how aggressively to act:

| Signal | Confidence | Action |
|---|---|---|
| Source disappeared from file A, appeared in file B, both in same save | High | Auto-move, no AI |
| Source moved + AST role is identical | High | Auto-move, no AI |
| Source moved + AST role similar (same element, different attribute) | Medium | Suggest move, may call AI to confirm |
| Source moved + completely different role | Low | Treat as new call site, AI-as-arbiter with candidate |
| Source-text changed at exact same position | High | Position-based rename |
| Source-text changed at same line/different column | Medium | Suggest rename, may require confirmation |

Currently the model uses high-confidence signals only. Medium-confidence detection is a future refinement (Open Questions section).

---

## 6. AI-as-Arbiter

### 6.1 The Format Is the Protocol

Earlier drafts of this section described AI-as-arbiter as a yapyak-constructed API call with candidate-passing wrapped in provider-specific prompt engineering. **v1.1 inverts this.** Arbitration is not a yapyak prompt-construction concern; it is a **shape of the locale file**.

When the compiler determines that arbitration is needed, it writes the necessary information into the locale file as data: the `candidates` field, the new `context`, and `status: "needs-arbitration"`. Any *translator* — including external AIs that yapyak does not control — sees the same JSON, performs the same arbitration, and writes the result back.

The arbiter is not in yapyak. The arbiter is whatever AI reads the file.

This change is consistent with the central insight of this specification: **the code is the identity, and the locale file is the work item**. Translation intelligence belongs in the AI that reads the file, not in the tool that produces it.

### 6.2 When Arbitration Is Triggered

The compiler emits `candidates` and `status: "needs-arbitration"` only in these cases:

1. **Unique-candidate** lookup where the new context's role differs from the existing entry's role (lookup returns `'unique-candidate'` and roles diverge)
2. **Multiple-candidates** lookup where the project has established homonyms and the new context could match any

For these cases the compiler does not pre-decide. It exposes the situation to the *translator* via the JSON file.

Arbitration is **not** triggered when:
- Exact match (same source + same role) exists in project — direct carry, `status: "translated"`
- Role-only match exists — direct carry, `status: "translated"`
- Refactor detection has identified a move — direct carry, `status: "translated"`
- Position-based rename detection has identified a source-edit — direct carry or fresh translation per `preserveTranslationsOnRename`
- No prior translations of the source exist — `status: "missing"`, no candidates field (the *translator* will translate fresh)

### 6.3 Candidate Injection

When arbitration is triggered, the compiler writes the entry as:

```jsonc
{
  "source": "Open",
  "context": {
    "kind": "elementChild",
    "container": "Badge",
    "enclosing": "HoursBadge",
    "ancestors": [],
    "position": 1
  },
  "candidates": [
    {
      "target": "Öppna",
      "fromContext": {
        "kind": "elementChild",
        "container": "button",
        "enclosing": "StoreButton",
        "ancestors": [],
        "position": 1
      },
      "fromFile": "src/store/StoreButton.tsx"
    }
  ],
  "target": ""
}
```

The candidate carries:
- The prior `target` (the translation under consideration)
- The `fromContext` that produced it (so the AI can compare structural meaning)
- The `fromFile` (for traceability)

The derived state is `needs-arbitration` (target empty + candidates present). The translator system prompt provides the default instruction; per-candidate prose is no longer stored in the file. The `candidates` field is documented in LOCALE_FILE_FORMAT.md under the entry record format. yapyak's compiler is the only writer of `candidates`. *Translators* read it and remove it after deciding.

### 6.4 What the *Translator* Does

A v1.1-conformant *translator* receives the locale file (or a subset of its entries) and processes each entry with `status: "needs-arbitration"` as follows:

1. Read `source`, `context`, and each `candidates[].value` + `candidates[].fromContext`.
2. Decide whether any candidate's meaning matches the new context.
3. If a candidate matches → write `value: candidate.value`, `status: "translated"`.
4. If no candidate matches → translate fresh based on `source` + `context` (with project `instructions` and `glossary` applied), write the new `value`, `status: "translated"`.
5. **Remove** the `candidates` field from the entry.

The *translator* does not need to understand yapyak's identity model, project memory algorithm, or refactor detection. It just reads JSON, makes one of two decisions per entry, and writes JSON back. The interface is documented in `TRANSLATOR_INTERFACE.md`.

### 6.5 Decision Categories Are Derived, Not Authored

Earlier drafts categorized the *translator*'s response as `confirmed`, `rejected`, or `selected`. v1.1 derives these from the resulting file:

| Outcome | How yapyak detects it |
|---|---|
| **Confirmed** | `value` equals one of the candidate values from before the call |
| **Selected** (multi-candidate) | Same as confirmed; the chosen candidate identifies which |
| **Rejected** | `value` is something other than any candidate value |

The categorization is computed by yapyak after the *translator* completes, recorded in `.yapyak/provenance.json` (gitignored), and surfaced in CLI output. It is not part of the locale file format — the locale file shows only the resulting `value` and `status`. Provenance is ephemeral; the locale file is durable.

### 6.6 Why This Matters

Without arbitration, a naive "unique source = carry across files" rule has a silent failure mode: the **first new semantic use** of an existing source string would inherit the wrong translation. For short UI text (`Open`, `Close`, `Save`, `Remove`, `Done`) this is exactly the case where homonyms emerge.

With format-as-protocol arbitration, the system makes a deliberate semantic decision through the *translator* of the user's choice — without yapyak having to know which provider, which prompt format, or which API. The cost is one AI call per new call site that shares a source with existing entries (a small fraction of total saves). The benefit is correctness, and the architectural cost is borne by the **format**, not the **tool**.

### 6.7 Why Move Arbitration Into the Format

Three concrete consequences flow from this design:

1. **Provider-agnostic.** Anthropic, OpenAI, Google, Mistral, local LLMs, and editor agents like Claude Code / Cursor all see the same `candidates` structure. yapyak does not ship provider-specific arbitration code.

2. **Inspectable.** Before the *translator* runs, the locale file shows exactly which arbitration decisions are pending. A developer can inspect them, override them by hand, or skip arbitration entirely for a particular entry.

3. **Replayable.** Arbitration is no longer a transient event inside an API call. It is a state in the locale file. If a *translator* fails or returns garbage, yapyak can re-run arbitration without losing the input.

These three properties — provider-agnostic, inspectable, replayable — are why arbitration belongs in the format and not in a prompt builder.

---

## 7. Source Text Evolution

### 7.1 Position-Detection (Same-Position Edits)

When a source string changes at the **exact same line and column**, yapyak's existing position-based rename detection handles it:

```tsx
// Before: line 12, column 24
<button>{t('Save')}</button>

// After: line 12, column 24
<button>{t('Save changes')}</button>
```

Detection: position is unchanged, source differs. Treated as a rename.

Behavior based on `preserveTranslationsOnRename`:
- `true` (manual workflow default): carry the translation from old source to new source
- `false` (AI workflow default): treat as new entry, AI re-translates with new source

### 7.2 Enhanced Same-Role Detection

For cross-file source edits, an enhanced detection considers the AST role:

```tsx
// Before: src/UserMenu.tsx line 5
<button onClick={signOut}>{t('Sign out')}</button>

// After: src/Sidebar.tsx (file change) line 12 (different position)
<button onClick={signOut}>{t('Log out')}</button>
```

Different file, different position, different source — but **same role** (`button.content`) and **same enclosing handler context** (`signOut`). This is signal of a likely move + edit.

The system can:
1. Detect the move (refactor detection)
2. Notice source text differs
3. Surface as a low-confidence migration candidate
4. Invoke AI-as-arbiter with old translation as candidate

This is an extension to be added in Phase 4 or later. Phase 1-3 handles position-detection only.

### 7.3 Source History Tracking

For each translation entry, an optional history field can track source evolution:

```json
{
  "src/profile/ProfileForm.tsx": {
    "Save changes": "Spara ändringar"
  }
}

// Internal manifest (or extended schema)
{
  "src/profile/ProfileForm.tsx": {
    "Save changes": {
      "sv": "Spara ändringar",
      "_history": ["Save", "Save changes"]
    }
  }
}
```

This is optional metadata. It does not affect identity. It enables tooling to surface "this translation has gone through these source revisions" for translator review. Future enhancement.

### 7.4 Source-Edit + Move Combinations

The genuine limit: when a `t()` call **moves to a new file AND has its source edited simultaneously**, the system cannot link the old and new with certainty.

```tsx
// Before: src/cart/Cart.tsx
<button>{t('Confirm')}</button>           // "Bekräfta"

// After: src/payment/Payment.tsx
<button>{t('Confirm payment')}</button>   // moved AND reworded
```

Detection:
- "Confirm" disappeared from Cart.tsx
- "Confirm payment" appeared in Payment.tsx (new source)
- Position differs (different file)
- Refactor detection finds no matching move (different source strings)

Behavior:
- "Confirm" becomes orphan
- "Confirm payment" is treated as new source
- Translation memory looks up "Confirm payment" — likely not found
- AI translates fresh

**Mitigation:** developer can preserve translation continuity by splitting the change into two commits:
1. Move the call (refactor carries the translation)
2. Edit the source (position-detection or `preserveTranslationsOnRename` handles it)

This limit is consistent with the principle that source-text edits trigger re-translation. It is not a regression.

---

## 8. Orphan Management

### 8.1 Retention Policy

When a `t()` call disappears from the codebase, its locale entry is **not automatically pruned**. It is retained in the locale file as project memory.

```json
{
  "src/old-component.tsx": {
    "Some message": "Något meddelande"
  }
}
```

If `src/old-component.tsx` no longer contains a `t('Some message')` call, the entry above remains. It is now an orphan.

### 8.2 Why Retain Orphans

Orphans serve four purposes:

1. **Translation memory for moves across saves.** If file A loses a source and file B gains it in a separate save (not the same atomic operation), the orphan in A's entry provides the candidate for B.

2. **Recovery from mistakes.** A developer who accidentally deletes a `t()` call and re-adds it later does not lose the translation work.

3. **Historical context for new contexts.** A `Plan` that was once translated as `Abonnemang` in a billing component is available as a (low-confidence) candidate if `Plan` reappears in a different context later. The AI sees it and can decide whether to reuse.

4. **PR-review awareness.** A reviewer sees that translations are not silently disappearing during refactors. The Git history of the locale file shows the full evolution.

### 8.3 Three Orphan Tiers

For lookup behavior, orphans are categorized:

| Tier | Definition | Behavior |
|---|---|---|
| Active | Source still appears in the codebase | Primary translation memory |
| Recent orphan | Source recently disappeared (within last N saves or last `yapyak clean`) | Eligible for refactor-detection in subsequent saves |
| Historical orphan | Source has been absent for many cycles | Surfaced to AI as historical candidate only — never auto-carried |

Initial implementation treats all orphans as "recent" until `yapyak clean` runs. Tier distinction is a future refinement.

### 8.4 `yapyak clean`

Explicit cleanup is a CLI command:

```bash
$ yapyak clean
Found 12 orphan entries across 5 files:
  src/legacy/OldButton.tsx:
    - "Click me" (no longer in source)
    - "Open" (no longer in source)
  src/checkout/OldCart.tsx:
    - ...
Remove these entries? [y/N]
```

With `--yes` flag for CI:
```bash
yapyak clean --yes
```

The command is **explicit**. Locale files are never modified by removal without developer intent. This makes orphan retention safe — developers do not need to worry about losing translation work to automated processes.

---

## 9. Provenance Tracking

### 9.1 Provenance Categories

Every translation entry has an implicit provenance — how it got its current value. Yapyak tracks this internally and surfaces it via CLI:

| Provenance | Meaning |
|---|---|
| `translated` | AI translated this entry from scratch (new source, no candidates) |
| `inherited` | Project memory found a unique existing translation, carried directly |
| `moved` | Refactor detection identified a cross-file move, translation carried |
| `confirmed` | AI-as-arbiter received a candidate and confirmed it for the new context |
| `arbitrated` | AI-as-arbiter received multiple candidates and selected one |
| `re-translated` | AI-as-arbiter rejected the candidate and translated fresh |
| `manual` | Developer or translator edited the entry directly |
| `pinned` | Entry is marked as do-not-modify (future feature) |

### 9.2 CLI Output

```bash
$ yapyak translate
Translating new entries in src/checkout/CheckoutActions.tsx
  Continue → "Fortsätt"  [moved from src/checkout/CheckoutPage.tsx]
  Cancel → "Avbryt"  [moved from src/checkout/CheckoutPage.tsx]

Translating new entries in src/store/HoursBadge.tsx
  Open → "Öppet"  [arbitrated; rejected candidate "Öppna" from src/files/OpenButton.tsx]

Translating new entries in src/dashboard/Welcome.tsx
  Welcome back → "Välkommen tillbaka"  [translated; Anthropic claude-sonnet]
  Last seen today → "Senast sedd idag"  [translated; Anthropic claude-sonnet]

Translating new entries in src/components/RefreshButton.tsx
  Refresh → "Uppdatera"  [inherited; 3 prior uses, 1 translation]

Summary:
  6 entries filled
  3 AI calls (2 translation, 1 arbitration)
  2 moves (no AI)
  1 inherited (no AI)
```

The developer can see at a glance:
- Which entries cost AI calls
- Which were free via memory or refactor detection
- When AI arbitration made a semantic decision

### 9.3 Why Provenance Matters

Provenance creates trust. When a translation appears in a PR diff, the reviewer wants to know:

- Was this translated by AI just now, or has it existed for months?
- Was it inherited from another file?
- Did AI decide to reuse or re-translate?

Without provenance, every translation looks the same. With provenance, the cost and confidence of each entry is visible.

Provenance is **not** stored in locale files (which stay clean and translator-friendly). It is computed at save time and emitted to:
- CLI output during `yapyak translate`, `yapyak status`
- Optional `.yapyak/provenance.json` (gitignored, regenerated each save) for tooling
- Future: editor extensions could surface provenance inline

---

## 10. Plain TypeScript Support

The model is not JSX-specific. Plain TypeScript code is supported via the same primitives — same records-array shape, same `context` zone, same identity rules.

### 10.1 Object Literals

```ts
// src/status/labels.ts
export const statusLabels = {
  open: t('Open'),
  closed: t('Closed'),
  cancelled: t('Cancelled'),
};
```

Each `t()` call gets `kind: "objectProperty"`. `container` is the object's variable binding name (`statusLabels`); `slot` is the property key.

```jsonc
"src/status/labels.ts": [
  {
    "source": "Open",
    "context": { "kind": "objectProperty", "container": "statusLabels", "slot": "open", "enclosing": "", "position": 1 },
    "target": "Öppet"
  },
  {
    "source": "Closed",
    "context": { "kind": "objectProperty", "container": "statusLabels", "slot": "closed", "enclosing": "", "position": 1 },
    "target": "Stängt"
  },
  {
    "source": "Cancelled",
    "context": { "kind": "objectProperty", "container": "statusLabels", "slot": "cancelled", "enclosing": "", "position": 1 },
    "target": "Avbrutet"
  }
]
```

No collisions (different sources). Each entry is a record with its own context.

### 10.2 Multi-Object Collision Handling

```ts
// src/labels/all.ts
export const buttonLabels = {
  open: t('Open'),
};
export const statusLabels = {
  open: t('Open'),
};
```

Same source `"Open"` in two distinct enclosing objects. Disambiguation comes via `context.container`:

```jsonc
"src/labels/all.ts": [
  {
    "source": "Open",
    "context": { "kind": "objectProperty", "container": "buttonLabels", "slot": "open", "enclosing": "", "position": 1 },
    "target": "Öppna"
  },
  {
    "source": "Open",
    "context": { "kind": "objectProperty", "container": "statusLabels", "slot": "open", "enclosing": "", "position": 1 },
    "target": "Öppet"
  }
]
```

Two parallel records, distinguished by `context.container`. The *translator* sees both contexts in the same file and can translate them appropriately.

### 10.3 Function Bodies (Throw Statements)

```ts
// src/payment/submit.ts
export async function submitPayment(payment) {
  if (!payment.card) {
    throw new Error(t('Card information is required'));
  }
  const result = await api.charge(payment);
  if (!result.ok) {
    throw new Error(t('Payment failed'));
  }
}
```

`context.kind` is `"throw"`. `container` is the constructor name (`Error`); `enclosing` is the function containing the throw:

```jsonc
"src/payment/submit.ts": [
  {
    "source": "Card information is required",
    "context": { "kind": "throw", "container": "Error", "enclosing": "submitPayment", "position": 1 },
    "target": "Kortinformation krävs"
  },
  {
    "source": "Payment failed",
    "context": { "kind": "throw", "container": "Error", "enclosing": "submitPayment", "position": 1 },
    "target": "Betalningen misslyckades"
  }
]
```

Different sources, no collisions, two parallel records with the same `container` (the error class) and `enclosing` (the function).

### 10.4 Module-Level Constants

```ts
// src/copy/messages.ts
export const SAVE_SUCCESS = t('Changes saved');
export const SAVE_FAILURE = t('Could not save changes');
```

`context.kind` is `"variable"`. `container` is the variable's own binding name:

```jsonc
"src/copy/messages.ts": [
  {
    "source": "Changes saved",
    "context": { "kind": "variable", "container": "SAVE_SUCCESS", "enclosing": "", "position": 1 },
    "target": "Ändringar sparade"
  },
  {
    "source": "Could not save changes",
    "context": { "kind": "variable", "container": "SAVE_FAILURE", "enclosing": "", "position": 1 },
    "target": "Kunde inte spara ändringar"
  }
]
```

### 10.5 Validation Messages (Same Source, Different Function)

```ts
export function validateEmail(email: string) {
  if (!email) return t('Required');
}

export function validateName(name: string) {
  if (!name) return t('Required');
}
```

Both calls have source `"Required"`, both at function-body level, in different functions. Disambiguation comes via `context.container` (the function whose return this is):

```jsonc
"src/validation/all.ts": [
  {
    "source": "Required",
    "context": { "kind": "return", "container": "validateEmail", "enclosing": "", "position": 1 },
    "target": "E-postadress krävs"
  },
  {
    "source": "Required",
    "context": { "kind": "return", "container": "validateName", "enclosing": "", "position": 1 },
    "target": "Namn krävs"
  }
]
```

Two parallel records, distinguished by `functionName`. The *translator* reads both records and emits target-locale-appropriate translations for each context.

This is the case where the semantic-selector model claimed superiority. The adaptive model handles it via function-name disambiguation as compiler-owned `context` — without manual annotation, without selectors, and without a manifest.

---

## 11. Per-Framework Specifics

### 11.1 TypeScript / TSX

Role extraction walks the JSX tree:

```ts
function extractRoleTSX(node: t.CallExpression, ast: t.File): ContextRole {
  const enclosingJSX = findEnclosingJSXElement(node, ast);
  if (enclosingJSX) {
    const attribute = findEnclosingAttribute(node, enclosingJSX);
    if (attribute) {
      return { element: enclosingJSX.name, property: attribute.name };
    }
    return { element: enclosingJSX.name, property: 'content' };
  }
  // Fall back to non-JSX context
  return extractRoleNonJSX(node, ast);
}

function extractRoleNonJSX(node: t.CallExpression, ast: t.File): ContextRole {
  const objectProperty = findEnclosingObjectProperty(node, ast);
  if (objectProperty) {
    return {
      element: findEnclosingObjectName(objectProperty) ?? 'object',
      property: objectProperty.key.name,
    };
  }
  const fn = findEnclosingFunction(node, ast);
  if (fn) {
    return { element: fn.name, property: 'body' };
  }
  const variable = findEnclosingVariableDeclaration(node, ast);
  if (variable) {
    return { element: 'module', property: variable.name };
  }
  return { element: 'unknown', property: 'unknown' };
}
```

### 11.2 Vue Templates

Role extraction uses `@vue/compiler-sfc` to identify template positions:

```ts
function extractRoleVue(node: TemplateNode, sfc: SFCDescriptor): ContextRole {
  const element = findEnclosingTemplateElement(node);
  if (isAttributeBinding(node)) {
    return { element: element.tag, property: node.attributeName };
  }
  return { element: element.tag, property: 'content' };
}
```

Component name as enclosing context comes from the SFC filename or `<script setup name="...">` attribute.

### 11.3 Svelte

Role extraction uses `svelte/compiler`:

```ts
function extractRoleSvelte(node: ExpressionNode, ast: SvelteAST): ContextRole {
  const element = findEnclosingMarkupElement(node);
  if (isInAttribute(node)) {
    return { element: element.name, property: getAttributeName(node) };
  }
  return { element: element.name, property: 'content' };
}
```

### 11.4 Astro

Astro mixes frontmatter (TypeScript) with markup (Astro template). Role extraction routes through the appropriate parser:

```ts
function extractRoleAstro(node: AstroNode, source: AstroSourceFile): ContextRole {
  if (isInFrontmatter(node)) {
    return extractRoleNonJSX(node, source.frontmatter);
  }
  return extractRoleAstroMarkup(node, source.template);
}
```

---

## 12. Performance Considerations

### 12.1 Memory Build Cost

The project memory is built once per save cycle. For a project of N translations:

- Time complexity: O(N)
- Space complexity: O(N)

For 10,000 translations across 100 files, build time is sub-50ms on modern hardware. This is well within the dev save loop budget.

### 12.2 Lookup Complexity

Per-entry lookup is O(1) hash lookup in the memory map. For a save introducing K new entries:

- Total lookup cost: O(K)
- K is typically 1–5 per save (interactive editing)
- K can be hundreds (CI backfill, new locale addition)

Lookup is never the bottleneck.

### 12.3 Refactor Detection Scaling

Cross-file refactor detection compares old and new extraction state. Time complexity:

- O(F × C) where F is files in the diff window and C is average calls per file
- For typical Vite save: F = 1, C = 10–50 → 10–50 operations
- For atomic commit: F = up to 100s, C = 10–50 → up to 5000 operations

Refactor detection adds at most 10–20ms on large diffs. Acceptable.

### 12.4 Incremental Cache

For very large projects, the project memory can be cached between save cycles:

```ts
class IncrementalMemory {
  private memory: ProjectMemory;
  private fileVersions: Map<FileId, number>;

  rebuild(localeFiles: LocaleFile[]) {
    // Only rebuild for locale files that changed since last cycle
  }
}
```

This is optimization, not core. Initial implementation does full rebuild each cycle.

---

## 13. Honest Limitations

The model does not solve every edge case. These are explicit, documented trade-offs.

### 13.1 Move + Source-Edit Simultaneously

When a `t()` call is both moved to a new file and reworded in the same save, refactor detection cannot link them. The translation does not carry.

**Mitigation:** developer splits the change into two commits.

### 13.2 True Twins (Same Source, Same Role, Same Parent)

When two `t()` calls have identical source string, identical AST role, and identical enclosing component, the only available disambiguator is positional (`#1`, `#2`). Reordering breaks this mapping.

```tsx
<Dialog>
  <button>{t('OK')}</button>
  <button>{t('OK')}</button>
</Dialog>
```

**Mitigation:** rare in practice. When it does occur, the case is detectable and the developer can introduce distinguishing attributes, different source strings, or wrap in distinguishing components.

### 13.3 Cross-Project Translation Memory

Locale files are per-project. Sharing translations across multiple projects in an organization is not handled by the core model.

**Solution (out of scope):** publish a shared glossary as an npm module and import it into each project's `yapyak.config.ts`. This pattern preserves the "you own the loop" property — no cloud service required.

### 13.4 Parent-Component-Rename in Disambiguators

When a homonym's disambiguator includes the enclosing parent component name (e.g., `Continue@CartReview.button`), renaming the parent component orphans the entry.

```diff
- "Continue@CartReview.button": "Fortsätt",
+ "Continue@Cart.button": ""
```

**Mitigation:** parent-component disambiguation is only used when element and element-property are insufficient. This case is rare. When it does happen, refactor detection (a future enhancement) could track parent-component renames.

### 13.5 Element-Type Semantic Shifts

When `<button>` is changed to `<a>` for semantic correctness, source-as-key carries the translation. In some cases, the translation should actually be re-evaluated (different element conveys different intent in some languages).

**Mitigation:** the model carries by default (correct in 70–90% of cases). For the 10–30% where re-evaluation is warranted, the developer can manually re-translate or use `yapyak translate --force` on specific entries. Future enhancement: a "stale-flag" mechanism could surface element-type changes for review without breaking identity.

---

## 14. What's Novel

The individual mechanisms in this model are not all new. Their combination, applied to compile-time i18n with AI translator integration, is — as far as we know — without precedent in the open-source landscape.

### 14.1 Known Patterns

- **Source × context for disambiguation:** gettext's `msgctxt` has done this since the 1990s. Lingui supports it. react-intl supports it via descriptors.
- **Translation memory:** all CAT tools (Crowdin, Phrase, Trados, MemoQ) maintain translation memories. They are typically external services or files.
- **Translation as a build step:** Lingui, Paraglide, and others compile translations into modules.

### 14.2 Novel Combinations

These are the elements we believe to be uncommon or novel:

1. **AST-derived context per entry, materialized as data.** Most tools that use context require developers to write it manually (gettext: `pgettext("button", "Open")`) or omit context entirely (Lingui macros, react-intl auto-IDs). Yapyak derives context from the AST automatically and stores it as structured data alongside the source — visible to humans, AIs, and tools without parsing source code.

2. **Records-array storage with parallel homonyms.** Same-source homonyms are represented as parallel records with the same `source` and different `context` — first-class entries, not nested sub-keys behind a single source. This makes the locale file uniform: every entry has the same shape regardless of whether homonyms exist.

3. **Locale files as queryable translation memory.** No separate index file, no external service. The same JSON that *translators* edit is what powers cross-file lookups. This is structurally simple but rarely done.

4. **Format-as-protocol AI arbitration.** Candidate translations are injected into the locale file itself as a `candidates` field, with `status: "needs-arbitration"`. Any AI — Anthropic, OpenAI, Gemini, local LLMs, coding agents like Claude Code or Cursor — reads the same JSON and performs arbitration without yapyak shipping provider-specific prompt code. The format carries the intelligence.

5. **Refactor detection across file boundaries with orphan retention.** Detecting cross-file moves at save time, and retaining orphans as queryable memory so non-atomic moves still work, is a combination we have not seen elsewhere.

### 14.3 The Claim

We do not claim "first of its kind" in an absolute sense — proving that would require omniscience about all proprietary in-house systems and obscure academic work. We claim: the combination of (1) source-as-key with AST-derived context per entry, (2) locale-files-as-memory, (3) format-as-protocol arbitration via inlined candidates, (4) cross-file refactor detection, and (5) orphan retention as a single integrated open-source i18n compiler architecture is, to our knowledge, unprecedented.

Even if some elements have been explored in isolation elsewhere, the integrated whole is what creates the developer experience: write `t('Save')` (or `t('Save').notes({...})` for occasional annotation), get refactor-stable translations, no manual keys, no hosted service, predictable AI usage, and locale files that *translators* and AI agents can read directly without provider-specific tooling.

### 14.4 Comparison to Existing Tools

| Capability | i18next | FormatJS | Lingui | Paraglide | yapyak |
|---|---|---|---|---|---|
| Source-as-key | ❌ | 🟡 descriptor | ✅ | ✅ | ✅ |
| Compile-time inline | ❌ | ❌ | 🟡 macros | ✅ | ✅ |
| Per-route bundle splitting | 🟡 manual | 🟡 manual | 🟡 | ✅ | ✅ |
| Same-file homonym handling | 🟡 via context | 🟡 via context | 🟡 via context | ❌ requires IDs | ✅ automatic |
| Cross-file translation memory | ❌ | ❌ | ❌ | ❌ | ✅ |
| Refactor detection | ❌ | ❌ | ❌ | ❌ | ✅ |
| Format-as-protocol AI arbitration | ❌ | ❌ | ❌ | ❌ | ✅ |
| Orphan retention | ❌ | ❌ | ❌ | ❌ | ✅ |
| Provenance tracking | ❌ | ❌ | ❌ | ❌ | ✅ |
| No external service required | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multi-framework | 🟡 | 🟡 React-focused | 🟡 React-focused | ✅ | ✅ |

The cluster of unique checkmarks across rows 4–9 is not accidental. Each of those capabilities follows directly from the central insight of source-as-identity plus AST-derived context plus locale-file-as-protocol. They cannot easily be retrofitted onto tools whose identity model is manual or runtime-catalog-based — those tools would need to change shape, not just add features.

This is what "novel combination" means in practice: a set of properties that come together only when the underlying identity model supports them.

### 14.5 What Emerges — Properties the User Experiences

These are not designed features. They are consequences of the five mechanisms operating together:

| Property | What the user sees |
|---|---|
| **Refactor stability for translations** | Wrap an element in a div, reorder siblings, move a component to a new file — the `value` field is preserved. The `context` field may update to reflect the new structure (this is visible in diff but does not require re-translation). |
| **Cross-file consistency** | Same English text everywhere → same translation by default, automatically |
| **Predictable AI cost** | Refactors cost zero AI calls. New strings cost one. Homonym arbitration costs one. No surprises |
| **AI-agent-native files** | Any AI — Claude Code, Cursor, the configured *translator* — opens the locale file and has everything it needs: source, context, glossary, tone, candidates. No external lookups. |
| **Self-documenting** | An AI coding agent reading the code months later understands the i18n without side-channel docs |
| **PR review clarity** | Provenance shown per entry: translated, inherited, moved, arbitrated. Reviewer knows what cost AI time. Context changes from refactor are visible in the diff. |
| **Restart resilience** | Translations survive `node_modules` deletion, branch switches, machine moves — they're in Git as plain JSON |
| **Self-verifying** | Source text and identity cannot drift apart. They are the same thing. The compiler regenerates `context`; authored `notes` are preserved verbatim. |

The developer never reads this specification. The developer writes `t('Save')` — or `t('Save').notes({ maxLength: 20 })` for the occasional annotation. Everything above happens silently.

---

## 15. Implementation Plan

### 15.1 Phase 1 — Locale File Format v1 + Translator Interface (1 week)

**Goal:** Read/write the v1.1 records-array locale file format. Define the thin *translator* interface.

Modules:
- `packages/compiler/src/catalog/locale/v1.ts` (new): read/write/validate v1 schema (records-array, four-zone entries)
- `packages/compiler/src/catalog/locale/migrate.ts` (new): one-shot migration tool from earlier draft formats to v1
- `packages/translator/src/type.ts` (new): minimal `Translator` interface (one method: `translate(file, options?) → file`)
- `packages/translator/src/select.ts` (new): selection helpers (by file, status, source) for partial translation
- `packages/translator/src/merge.ts` (new): merge translator-returned subset back into the full file

Tests: ~40 unit tests covering schema validation, NFC normalization, BCP 47 normalization, ICU/placeholder invariants, partial selection round-trips, migration from earlier-draft formats.

**Estimated: ~180 lines production, ~350 lines tests.**

### 15.2 Phase 2 — Translation Memory + Arbitration (1 week)

**Goal:** Project-wide memory from existing v1 locale files; arbitration via inlined candidates.

Modules:
- `packages/compiler/src/catalog/memory.ts` (new): build memory by reading v1 records (status filter, source→entries index), expose `lookup()`
- `packages/compiler/src/catalog/sync.ts` (modified): use lookup before emitting new records; inject `candidates` and set `status: "needs-arbitration"` when arbitration outcomes apply
- `packages/compiler/src/catalog/provenance.ts` (new): categorize *translator* response into `inherited` / `confirmed` / `selected` / `re-translated` and write to `.yapyak/provenance.json`

Tests: ~50 tests covering all five lookup outcomes, candidate-injection on `unique-candidate` and `multiple-candidates`, provenance categorization after *translator* return.

**Estimated: ~140 lines production, ~300 lines tests.**

### 15.3 Phase 3 — AST Roles + Records Emission (1 week)

**Goal:** Compute AST-derived context per `t()` call, detect same-file homonyms, emit records with disambiguating context.

Modules:
- `packages/compiler/src/parser/role.ts` (new): generic role computation (element, role, component, kind, ancestors)
- `packages/compiler/src/parser/processor/typescript.ts` (modified): TSX role extraction
- `packages/compiler/src/parser/processor/vue.ts` (modified): Vue template role extraction
- `packages/compiler/src/parser/processor/svelte.ts` (modified): Svelte markup role extraction
- `packages/compiler/src/parser/processor/astro.ts` (modified): Astro frontmatter + template role extraction
- `packages/compiler/src/parser/notes.ts` (new): extract `.notes()` chainable arguments and merge into record `notes` zone
- `packages/compiler/src/catalog/disambiguate.ts` (new): per-collision context-granularity escalation (element+role → +component → +ancestors → +position)
- `packages/compiler/src/catalog/emit.ts` (new): `emitFileRecords()` — convert extracted calls into v1 records

Tests: ~90 tests covering each framework's role extraction, all four granularity tiers, positional fallback (YPK009), `.notes()` argument extraction including const-spread, YPK210/YPK211/YPK212 diagnostics.

**Estimated: ~280 lines production, ~520 lines tests.**

### 15.4 Phase 4 — Refactor Detection + Orphan Retention + Clean Command (1 week)

**Goal:** Cross-file moves carry translations; orphans retained; explicit cleanup via CLI.

Modules:
- `packages/compiler/src/catalog/refactor.ts` (new): move/split/merge detection across the diff window
- `packages/compiler/src/catalog/orphans.ts` (new): retain removed records with `status: "orphaned"`; promote on subsequent re-extraction
- `packages/cli/src/command/clean.ts` (new): `yapyak clean` command (with `--yes` flag)
- `packages/cli/src/command/add.ts` (new): `yapyak add <locale>` initializes a new locale file from `yapyak.config.ts`
- `packages/cli/src/command/translate.ts` (extended): drive the configured *translator* and surface provenance in output
- `packages/vite/src/plugin.ts` (modified): integrate save-loop, refactor detection, HMR (`yapyak:locale-added`, `yapyak:locale-removed`)

Tests: ~60 tests covering 1-to-1 moves, splits, merges, orphan retention across multiple saves, `yapyak clean` behavior, `yapyak add` initialization.

**Estimated: ~140 lines production, ~320 lines tests.**

### 15.5 Phase 5 — Polish & Edge Cases (1–2 weeks)

**Goal:** Production-ready behavior across all supported frameworks and edge cases.

Activities:
- Real-world component testing across React, Vue, Svelte, Astro
- Performance benchmarks on 10k+ message projects
- Reference *translator* implementations (Claude, OpenAI, manual no-op)
- Edge case fixes (Svelte reactive blocks, Vue v-for context, Astro frontmatter expressions, etc.)
- Documentation: introduction.md, how-it-works.md, FAQ updates
- Example projects demonstrating each scenario (records-array, .notes(), arbitration, refactor migration)

**Estimated: ~80 lines production fixes, ~230 lines additional tests, significant manual testing.**

### 15.6 Total

| Phase | Production | Tests | Time |
|---|---|---|---|
| 1: Format + Translator interface | ~180 | ~350 | 1 week |
| 2: Memory + Arbitration | ~140 | ~300 | 1 week |
| 3: AST Roles + Records emission | ~280 | ~520 | 1 week |
| 4: Refactor + Orphans + CLI | ~140 | ~320 | 1 week |
| 5: Polish + reference translators | ~80 | ~230 | 1–2 weeks |
| **Total** | **~820** | **~1720** | **5–6 weeks** |

Plus ~1–2 weeks for documentation updates.

Estimates increased from the previous plan (~570 production lines, 4–5 weeks) to reflect the format-as-protocol architecture: the *translator* interface and v1 format reader/writer are now first-class modules rather than incidental support code. The total remains modest — under 1,000 lines of production TypeScript for the entire identity-and-storage layer.

---

## 16. Migration

### 16.1 From Earlier Yapyak Drafts (pre-v1.1) to v1.1

Earlier yapyak drafts used a flat per-file object map (`{ "src/file.tsx": { "Save": "Spara" } }`) with an "adaptive object form" for same-file homonyms (`{ "Open": { "button": "Öppna", "Badge": "Öppet" } }`). v1.1 replaces both with the records-array form documented throughout this specification and in [LOCALE_FILE_FORMAT.md](./LOCALE_FILE_FORMAT.md).

The migration is **one-shot, non-destructive, and tool-driven**:

```bash
$ yapyak migrate-locale-format
Migrating src/locales/sv.json from earlier-draft format to v1.1...
  127 entries converted
  3 same-source homonyms expanded to parallel records
  0 entries dropped
Backup written to src/locales/sv.json.backup
```

The tool reads the earlier format, derives `context` from the keyed sub-form (or single-occurrence inference), and writes the equivalent v1.1 records-array. All translation `value`s are preserved.

After migration, the earlier format is no longer read. Projects that committed to v1.1 should remove backups once they have verified the migration.

### 16.2 From Other i18n Libraries

Migration from i18next, FormatJS, Lingui, or Paraglide is **not automatic in v1.1**. yapyak provides converters for common shapes (flat key-value JSON, descriptor JSON, Paraglide message files) as part of the `yapyak migrate-from <tool>` family of commands, scheduled for a v1.1.x patch release.

For now, projects coming from other tools should:
1. Add yapyak to their build
2. Add `t()` calls in source code (replacing the previous i18n call style)
3. Run `yapyak extract` to materialize v1.1 records with `status: "missing"`
4. Copy `value`s from the old locale files to the new records (this is the only manual step)
5. Run `yapyak translate` or have a *translator* fill remaining missing values

### 16.3 Tooling for Inspection

`yapyak audit` reports potential issues without modifying anything:

```bash
$ yapyak audit
Same-file homonyms with translation drift:
  src/store/StorePanel.tsx:
    "Open" appears 2 times (button, Badge) with translations "Öppna" / "Öppet" — this is fine if intentional
  src/forms/SearchForm.tsx:
    "Search" appears 3 times across <input placeholder>, <input aria-label>, <button aria-label> with identical translation "Sök" — consider whether they should diverge

True-twins (positional fallback) entries:
  src/dialogs/ConfirmDialog.tsx:
    "OK" appears 2 times with identical context — YPK009 suggests refactoring to distinct sources or wrapping in distinguishing components
```

Audit is informational. It does not change anything.

---

## 17. Test Scenarios Catalog

The following scenarios must all be covered by the test suite. Each tests a specific aspect of the adaptive model.

### 17.1 Identity & Storage

- Records emission for single-occurrence source (minimal context: element + role + component)
- Parallel records for same-file homonyms (element-disambiguated)
- Parallel records for same-file homonyms (role-disambiguated, e.g., placeholder vs aria-label)
- Parallel records for same-file homonyms (component+ancestors-disambiguated)
- Positional fallback (`context.position`) for true twins; YPK009 diagnostic emitted
- Adding a homonym appends a record without changing the existing one
- Removing a homonym moves the record to orphan retention (does not silently delete)

### 17.2 Translation Memory

- Cross-file lookup returns `exact-match` when source + identical context exist
- Cross-file lookup returns `context-match` when source + element + role match (looser)
- Cross-file lookup returns `unique-candidate` when source has one translation across the project
- Cross-file lookup returns `multiple-candidates` for known cross-file homonyms
- New source returns `new`
- Records with empty `value` or `status: "missing"` / `"needs-arbitration"` are excluded from memory

### 17.3 Refactor Detection

- 1-to-1 move carries `value` to new file
- 1-to-N split distributes `value` to each new location
- N-to-1 merge consolidates `value`
- Move within same atomic save (no orphan needed)
- Move across multiple saves (via orphan retention)
- Move + source-edit simultaneously (treated as new entry; documented limitation §13.1)
- Position-based rename at same line/column
- Position-based rename across line changes (currently not supported; documented in §7)

### 17.4 Arbitration (Format-as-Protocol)

- New call site, no candidates → `status: "missing"`, *translator* translates fresh
- New call site, `exact-match` → direct carry, no AI invocation
- New call site, `context-match` → direct carry, no AI invocation
- New call site, `unique-candidate` → `candidates` field injected, `status: "needs-arbitration"`, *translator* decides
- New call site, `multiple-candidates` → all candidates injected, `status: "needs-arbitration"`, *translator* decides
- After *translator* returns: `candidates` field removed, `value` set, `status: "translated"` (or `"needs-review"` if *translator* flagged uncertainty)
- Provenance categorization writes to `.yapyak/provenance.json` (gitignored)

### 17.5 Orphan Management

- Orphan retained after `t()` removed
- Orphan provides translation memory for subsequent moves
- `yapyak clean` removes orphans when explicitly invoked
- Active and orphan entries co-exist in locale files

### 17.6 Plain TypeScript

- Object property literals (`statusLabels.open`)
- Function body role extraction
- Module-level constant role extraction
- Validation function homonym disambiguation
- Throw statement contexts

### 17.7 Per-Framework

- TSX: JSX element + attribute role extraction
- Vue: template + script setup role extraction
- Svelte: markup + script role extraction
- Astro: frontmatter + template role extraction

### 17.8 Edge Cases

- Source strings containing `@`, `::`, `.`, `:` characters
- Empty translations in locale files
- Files that import from each other (component composition)
- Locale files with extra unused fields (should not crash)
- Concurrent saves modifying the same file (Vite HMR scenarios)

---

## 18. Documentation Updates

### 18.1 `docs/content/guide/introduction.md`

**Section: "Keep meaning at the call site"** — update the paragraph about file moves to reflect the new behavior. The current text says yapyak does not transplant translations between files. The new text should explain that yapyak now uses project-wide memory and refactor detection to preserve translations across moves.

Proposed replacement:

> When a `t()` call moves to a different file, yapyak reads the rest of the project before calling the *translator*. If the source string is already translated unambiguously across the codebase, the new file inherits it — no re-translation, no churn. If different files translate the same source differently — a real homonym — the new file gets a fresh entry, and the *translator* picks the right one for the new context. Refactoring does not re-translate.

### 18.2 `docs/content/guide/how-it-works.md`

Add a new section after the existing "Preserve translations across ordinary edits":

> ### Translations follow the source, not the file path
>
> When yapyak fills a missing locale entry, it follows one of three paths:
>
> 1. **Refactor.** The source string disappeared from another file in the same save. yapyak carries the translation directly. No *translator* call.
> 2. **New call site with an existing translation.** yapyak injects the existing translation as a `candidates` field in the new entry and sets its status to `needs-arbitration`. The *translator* reads the file, sees the candidate alongside the new context, and decides whether to reuse it or translate fresh.
> 3. **Genuinely new source.** No prior translation exists in the project. The entry is left with `status: "missing"` and the *translator* translates fresh.
>
> Refactoring code does not re-translate text the project already knows. Adding a new call site for an existing short string — `Open`, `Close`, `Save`, `Done` — does not silently assume the first registered meaning. The *translator* sees both contexts in the locale file itself and decides.
>
> Orphaned entries — translations whose source string has disappeared from the codebase — are kept as project memory but never auto-applied. `yapyak clean` removes them explicitly.

Also update the locale file format section to show the v1.1 records-array shape (one record per `t()` call, with `source`, `context`, `notes`, `status`, `value` zones).

### 18.3 `docs/content/guide/faq.md`

Update existing entries:
- "How do I rename a message?" — mention the new behavior
- "Source strings as keys — does that hold up at scale?" — mention same-file homonym support

Add new entries:
- "What happens when I move a component to a new file?"
- "How does yapyak avoid re-translating the same string in different files?"
- "What is `yapyak clean`?"

### 18.4 CLI Documentation

Document the new `yapyak clean` command in `docs/content/guide/cli.md`.

Document the provenance output in `yapyak translate` and `yapyak status`.

---

## 19. Open Questions / Future Enhancements

These are intentionally out of scope for the initial implementation but represent meaningful future enhancements:

### 19.1 Stale-Flag on Context Change

When `<button>` changes to `<a>`, source-as-key carries the translation. A future enhancement could mark the entry as stale, surfacing it for review without breaking identity:

```json
{
  "Save": "Spara",
  "_stale": { "Save": { "lastSeenContext": "button", "currentContext": "a" } }
}
```

### 19.2 Persistent Source History

Optional `_history` field on entries that tracks source evolution over time. Useful for translator review and audit trails.

### 19.3 Confidence-Scored Refactor Detection

Medium-confidence refactor signals (similar context, similar position) trigger CLI confirmation rather than silent auto-action.

### 19.4 Cross-Project Glossary

Shared glossary as npm module with a yapyak-specific schema. Each project imports it into config. No cloud service, no vendor lock-in.

### 19.5 Translator-Side Memory Cache

For very large projects, persist project memory between save cycles to avoid full rebuild. Optimization, not core.

### 19.6 Element-Type Stale Marking

Detect element-type changes (button → a, p → span) and surface them as stale candidates for translator review. Optional layer on top of source-as-key identity.

---

## 20. Rejected Alternatives

These alternative designs were considered and explicitly rejected. They are documented here so future contributors understand why the adaptive model has its current shape — and why these patterns must not be reintroduced. Each entry states the alternative, why it was considered, and the specific reasons it fails the model's principles.

### 20.1 Explicit Context Annotation

```tsx
t('Open', { context: 'store-hours-status' })
```

A `context` option on the `t()` call, used to force distinct entries for the same source string regardless of AST structure. Initially considered as a "power-user escape hatch" for cases where two identical-looking calls need different translations.

**Why rejected:** It violates the model's core principle that identity is derived from code, not declared by the developer.

- It reintroduces manual key management. The context string is a key that must be invented, remembered, and kept consistent across the codebase.
- It creates a parallel namespace that is not visible from reading the surrounding code. Two `t('Open', { context: 'hours' })` calls look identical to two `t('Open')` calls until the second argument is read carefully.
- It breaks refactor stability. Moving the call requires moving the context string, and there is no static way to validate that the right context is in use.
- It contradicts the *"write `t('Save')`, get refactor-stable translations"* promise that defines the model.
- It re-opens the entire `i18next` failure mode the model exists to escape from.

The disciplined alternative — letting structural changes in code force structural changes in the locale file — is what makes the model self-verifying. If two `t()` calls must translate differently, *something visible in the code* must differ: source text, element type, parent component, attribute, or surrounding function. There is no hidden context.

This rejection is permanent. It is not a future enhancement, not an opt-in feature, not a power-user escape. It is an anti-feature for this model.

### 20.2 Manual Message IDs

```tsx
t('checkout.cart.save_button.label')
```

The `i18next` / `FormatJS` pattern. Identity is a developer-invented key; the English source is stored separately in the locale file.

**Why rejected:**

- Keys must be invented, maintained, and kept consistent across files and team members.
- Renaming a component requires renaming the keys, or accepting that keys diverge from code structure over time.
- Source text and identity are decoupled. Reading the code does not tell you what the UI says.
- Keys leak naming-scheme assumptions into the locale file structure.

Source-as-key removes all of these. The English text *is* the identity. Reading the code tells you exactly what the UI says.

### 20.3 Pure Hierarchy Keys

```json
{
  "checkout": {
    "cart": {
      "saveButton": { "label": "Spara" }
    }
  }
}
```

Fully nested locale files mirroring component hierarchy. Considered for visual organization.

**Why rejected:**

- Tree structure is invented by the developer and not derivable from code.
- Refactors require renaming through arbitrary depth.
- Unrelated changes appear at different tree depths, hurting diff readability.
- Two-level adaptive nesting (per file, then per role on collision) gives most of the visual benefit without the structural cost.

### 20.4 Persistent Tree Storage with Reconciliation

An earlier exploration: store translations in a persistent component-hierarchy tree per language, reconciled against the source code on every save. The compiler would track component nesting and store translations at hierarchy positions.

**Why rejected:**

- Reconciliation rules required for every refactor type (add, remove, move, rename, reorder).
- Tree structure must be re-synced on every save, adding both complexity and risk.
- Locale files become tightly coupled to component hierarchy. Refactors create large diffs even when translations are unchanged.
- Position changes silently break entries or require complex matching logic.

The adaptive model uses the locale files themselves as memory, with no separate tree. Source-as-key plus AST role makes identity stable without reconciliation.

### 20.5 Positional-as-Identity Arrays

```json
{
  "src/SaveButton.tsx": [
    { "source": "Save", "translation": "Spara", "line": 12 }
  ]
}
```

Storing entries as ordered arrays where **line position** is the disambiguating identity. Distinct from v1.1 records-array, which uses arrays as storage shape but identifies entries by `(source, context)` — position is only an emergency fallback (`context.position` with YPK009 diagnostic).

**Why position-as-identity was rejected:**

- Positions change with every edit unrelated to translation. A blank line above your `t()` call invalidates identity.
- Reordering siblings would silently re-map translations to wrong calls.
- Refactor detection becomes impossible — line numbers do not carry semantic meaning.

v1.1 uses the array as a **container**, not as the identity mechanism. The identity is the tuple `(file, source, context)` documented in §2.1.

### 20.6 Hosted Translation Service

A cloud service that stored project memory remotely, enabling cross-project translation sharing and pre-built memory across organizations.

**Why rejected:**

- Adds an external dependency to the build pipeline.
- Requires authentication, billing, and network access during development.
- Creates vendor lock-in.
- Removes the "translations are in Git" property that makes review and merge straightforward.
- Contradicts yapyak's *"you own the loop"* positioning.

The model uses locale files themselves as memory. Sharing across projects, when desired, is done via npm-distributed glossary modules — not a service.

### 20.7 Semantic Selectors + Manifest

An alternative where each `t()` call had an auto-generated semantic selector (e.g., `[role=button][label=Save]`) stored in a separate manifest file mapping selectors to translations.

**Why rejected:**

- Selectors are tied to implementation details (CSS-like, DOM-like, or AST-like syntax).
- Manifest is a separate file that must be regenerated and kept in sync with the locale files.
- Translators see selectors instead of source text in their tooling.
- Refactors that change implementation details break selectors.

The AST role in the adaptive model is a much simpler version of this idea — used only when needed, embedded directly in the locale file, with the source text as the primary handle.

### 20.8 Adaptive-Object-Form-on-Collision-Only

```json
{
  "Save": "Spara",
  "Open": {
    "button": "Öppna",
    "Badge": "Öppet"
  }
}
```

The original adaptive model: bare keys for unique sources, nested object form only when the same source collides within a file. This is what earlier drafts of this specification described.

**Why rejected for v1.1 (note: this is a historical rejection — earlier drafts of yapyak proposed this form, v1.1 replaces it with records-array):**

- Variable entry shape (`string | object`) requires every consumer (yapyak, *translators*, AI agents, CAT tools) to branch on shape.
- AI agents must read both the entry value AND infer the entry's structural context — context is implicit, not data.
- Authored data (notes, domain tags, status) has no clean place to live without polluting the disambiguation sub-keys.
- The format requires two-way migration logic (bare↔object) on every save when collisions are introduced or resolved.

v1.1 makes a different choice: **always emit a record with explicit `context`**, even for unique sources. Locale files are larger, but every entry has the same shape, AI agents have full context inline, and authored data has its own zone (`notes`). The trade-off is documented in LOCALE_FILE_FORMAT.md §Trade-Offs.

This is **not** a rejection of always-on disambiguation in v1.1 — that is what v1.1 does. It is a rejection of the specific bare-vs-object adaptive form, in favor of uniform records-array.

---

## 21. Conclusion

The adaptive identity model is the result of extended architectural exploration. The alternatives that were considered and rejected — explicit context annotation, stable per-entry IDs, manual message IDs, pure hierarchy keys, persistent tree storage with reconciliation, positional-as-identity arrays, hosted services, semantic selectors with manifests, always-on disambiguation — are documented in Section 20.

What remains is a model that:

- **Keeps the developer-facing API minimal.** `t('Save')` for the common case; `t('Save').notes({...})` for the occasional annotation. No keys to maintain.
- **Stores every entry uniformly.** Every locale record has the same four-zone shape (`source`, `context`, `notes`, `status`, `value`). No adaptive shape-shifting, no nested sub-keys.
- **Keeps the runtime small.** Compiled `_pick({...})` per call site, no change.
- **Keeps translations stable across refactors.** File moves, wrapper insertions, element changes, sibling reorders, source-text edits at same position — all preserve the translation `value`. Structural changes update the `context` field (visible in diff) without re-translation.
- **Keeps translation memory in the repo.** No external cache, no service, no vendor.
- **Pushes semantic decisions into the format.** Arbitration is a `candidates` field with `status: "needs-arbitration"` — any *translator* (Anthropic, OpenAI, Gemini, Claude Code, Cursor, manual) sees the same JSON and decides.
- **Keeps orphans queryable.** Translations remain available after their source disappears, until explicit cleanup via `yapyak clean`.
- **Keeps provenance visible.** Every entry's origin is traceable (translated / inherited / moved / arbitrated / re-translated).

The combination is novel as far as we know. The implementation is achievable in ~820 lines of production TypeScript across five phases (5–6 weeks). The v1.1 locale file format is a one-shot migration from earlier-draft formats; no manual edits required for the migration itself.

### 21.1 One-Sentence Summary

> yapyak's adaptive identity model lets developers write `t('Save')` and never think about i18n again — because the model derives translation identity from the code itself, lets locale files double as both translation memory and AI-readable work items, and pushes semantic arbitration into the JSON format rather than into provider-specific prompt code.

That is the model. Everything else in this specification is consequence.

### 21.2 The Compression Ratio

The model is ~820 lines of production code. The full specification of why it works is ~1,800 lines of documentation, with the companion locale-format and translator-interface specs adding another ~1,700 lines combined. The 4× ratio of explanation to implementation is the signature of design that has been carefully thought through — every line of code is justified by paragraphs of reasoning, every rejected alternative is documented, every limitation is honest.

For comparison: `i18next` is ~6,500 lines of production code. `react-intl` is ~25,000. yapyak's core identity-and-storage layer is **~13% the size of i18next** and **~3% the size of react-intl** — and does more than either, with mechanisms neither has.

That compression is what well-fitted design produces. Not because the implementation is clever, but because the central insight is right and the format does the heavy lifting.

---

This is the architecture yapyak is committing to.

# Adaptive Identity Model — Final Specification

> Synthesis of an extended architectural discussion exploring how yapyak should identify and store translations. This document supersedes earlier drafts and represents the watertight specification we are committing to.

## TL;DR

This document specifies the **adaptive identity model** for yapyak — a five-pillar architecture for translation identity that is, as far as we know, a novel combination of mechanisms in the open-source i18n landscape.

The model uses **source string as primary identity**, with **AST-derived context as a secondary disambiguator that appears in locale files only when source-string collisions exist within a file**. It supports **project-wide translation memory** from the locale files themselves (no separate cache), **cross-file refactor detection** that carries translations across moves without AI calls, **AI-as-arbiter** for ambiguous new call sites with candidate-passing prompts, **orphan retention** so translations remain queryable even after their source disappears, and **provenance tracking** so every translation entry can be traced to how it arrived.

The model solves the five concrete failure modes of the current `(fileId, source)` model: same-file homonyms, refactor churn, missing cross-file memory, silent semantic misses on first new use, and unnecessary AI calls. It does so while keeping the developer-facing API unchanged (`t('Save')` still works), the runtime unchanged (compiled `_pick({...})` per call site), and locale files clean and translator-friendly in the 95% case where source strings are unambiguous.

**Implementation estimate:** ~570 lines of production TypeScript across four phases, ~3-5 weeks with tests and documentation.

**Novelty claim:** The combination of (1) automatic AST-context derivation, (2) adaptive emission of context only on collision, (3) project-wide locale-files-as-memory with no external cache, (4) AI-as-arbiter with candidate-passing for semantic disambiguation, and (5) refactor detection across file boundaries with orphan retention has not been done systematically in any mainstream open-source i18n tool we are aware of.

---

## 1. The Five Pillars

The architecture rests on five distinct mechanisms that work together but are conceptually separate:

### 1.1 Source-as-Key

**Identity is the source string.** A translation entry is identified primarily by the literal English (or default-locale) text that appears at the call site. This makes identity stable against the operations that happen most often during development: wrapper insertion, element-type change, attribute change, sibling reordering, layout restructuring.

### 1.2 Adaptive AST Suffix

**Context disambiguates only when source alone is insufficient.** When two `t()` calls in the same file share a source string, yapyak emits an object-form entry where sub-keys are the AST-derived roles (element name, attribute name, parent component) that distinguish them. Single-occurrence source strings stay as bare keys. Locale files contain structural noise only where structure is the only differentiator.

### 1.3 Project-Wide Translation Memory

**Locale files are the cache.** When a translation is needed, yapyak builds an in-memory map from all locale files: `source → [{translation, context, fileId}]`. No external cache, no separate store. The repository is the source of truth, and the same JSON files that translators edit are what powers cross-file consistency.

### 1.4 Cross-File Refactor Detection

**Moves carry translations without AI.** When a source string disappears from one file and appears in another within a save (or set of saves), yapyak classifies it as a move and migrates the translation directly. No AI calls. No translation churn. Orphan entries are retained as project memory so moves across multiple saves still work.

### 1.5 AI-as-Arbiter

**The model decides semantic reuse.** When a new call site introduces a source string that already exists elsewhere — but in a different context — yapyak does not assume same source means same meaning. The translator is invoked with the new call site context and the existing translation as a candidate, with instructions to use the candidate only if the meaning matches. The model decides whether to inherit or re-translate.

These five pillars are independent enough to be implemented in stages but designed to function as a unit.

---

## 2. Identity & Storage

### 2.1 Schema

```ts
type LocaleFile = Record<FileId, FileEntries>;
type FileEntries = Record<SourceString, Translation | TranslationsByContext>;
type Translation = string;
type TranslationsByContext = Record<ContextKey, string>;

type FileId = string;          // e.g. "src/checkout/CartReview.tsx"
type SourceString = string;    // e.g. "Open", "Welcome back"
type ContextKey = string;      // e.g. "button", "input.placeholder", "CartReview.button"
```

- **Bare string value:** the source has a single occurrence in the file. No homonym.
- **Object value:** the source has multiple occurrences in the file with distinguishing AST roles. Sub-keys are the minimal disambiguators.

### 2.2 The 95% Case — Bare Keys

```json
{
  "src/components/EmptyCart.tsx": {
    "Your cart is empty": "Din kundvagn är tom",
    "Start shopping to add items": "Börja handla för att lägga till varor",
    "Browse products": "Bläddra bland produkter"
  }
}
```

No suffixes. No nesting. Locale files in the common case are pure source-string → translation maps. This matches translator expectations and standard tooling (Crowdin, Phrase, Lokalise all support flat JSON natively).

### 2.3 The 5% Case — Object Form

When two `t()` calls in the same file share a source string, the entry becomes an object:

**Element-based disambiguation:**

```tsx
// src/store/StorePanel.tsx
<button>{t('Open')}</button>
<Badge>{t('Open')}</Badge>
```

```json
{
  "src/store/StorePanel.tsx": {
    "Open": {
      "button": "Öppna",
      "Badge": "Öppet"
    }
  }
}
```

**Element + property disambiguation:**

```tsx
// src/forms/SearchForm.tsx
<input
  placeholder={t('Search')}
  aria-label={t('Search')}
/>
<button aria-label={t('Search')}>
  <SearchIcon />
</button>
```

```json
{
  "src/forms/SearchForm.tsx": {
    "Search": {
      "input.placeholder": "Sök",
      "input.aria-label": "Sök",
      "button.aria-label": "Sök"
    }
  }
}
```

**Parent-component disambiguation:**

```tsx
// src/checkout/Checkout.tsx
<CartReview>
  <button>{t('Continue')}</button>
</CartReview>
<PaymentReview>
  <button>{t('Continue')}</button>
</PaymentReview>
```

```json
{
  "src/checkout/Checkout.tsx": {
    "Continue": {
      "CartReview.button": "Fortsätt",
      "PaymentReview.button": "Bekräfta"
    }
  }
}
```

**Positional fallback (rare true twins):**

```tsx
// src/dialogs/ConfirmDialog.tsx
<Dialog>
  <button>{t('OK')}</button>
  <button>{t('OK')}</button>
</Dialog>
```

```json
{
  "src/dialogs/ConfirmDialog.tsx": {
    "OK": {
      "#1": "OK",
      "#2": "OK"
    }
  }
}
```

### 2.4 Why Object Form Instead of Delimiter

A naive design might use a delimiter in the key: `"Open@button"`, `"Open::Badge"`. We use object form instead because:

- **Source strings can contain any character.** `"you@example.com"`, `"Use :: for namespace"`, `"7-Zip"` are all legitimate sources. A delimiter conflicts.
- **Object form mirrors gettext semantics.** A source string with multiple contexts (msgctxt in PO files) maps naturally to a nested object.
- **Tooling parses it cleanly.** All standard JSON tooling, all CAT tools that support JSON, all translation services that read structured data handle nested objects without escaping.
- **The shape itself signals "this source has homonyms."** Reading the locale file, the presence of an object value flags semantic ambiguity that needed structural disambiguation.

### 2.5 Schema Migration: Bare → Object

When a homonym is introduced for a previously-bare source:

**Before:**
```json
{ "src/StorePanel.tsx": { "Open": "Öppna" } }
```

**Developer adds `<Badge>{t('Open')}</Badge>` to the same file.**

**Migration during sync:**
1. Detect collision in the new extraction
2. Migrate the existing entry from string to object using the existing call's AST role as the sub-key
3. Add the new occurrence with its own sub-key

**After:**
```json
{
  "src/StorePanel.tsx": {
    "Open": {
      "button": "Öppna",
      "Badge": ""
    }
  }
}
```

The previously-implicit role is now explicit. The new occurrence becomes an empty stub for the translator (or AI-as-arbiter) to fill.

### 2.6 Schema Migration: Object → Bare

When a homonym is resolved by removing one occurrence:

**Before:**
```json
{
  "src/StorePanel.tsx": {
    "Open": {
      "button": "Öppna",
      "Badge": "Öppet"
    }
  }
}
```

**Developer removes `<Badge>{t('Open')}</Badge>`.**

**Migration during sync:**
1. Detect that only one occurrence remains
2. Migrate back to bare-string form using the remaining occurrence's translation
3. The removed occurrence's translation is retained as orphan (separate handling)

**After:**
```json
{
  "src/StorePanel.tsx": {
    "Open": "Öppna"
  }
}
```

Locale files stay minimal at all times — disambiguating only when structure forces it, reverting when structure no longer requires it.

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

### 3.3 Minimal Disambiguator Selection

For each collision, find the shortest unique disambiguator. Tiers are tried in order; the first tier that produces unique values for all occurrences wins:

```ts
function findMinimalDisambiguator(occurrences: ExtractedCall[]): string[] {
  const tiers: Array<(c: ExtractedCall) => string> = [
    c => c.role.element,
    c => `${c.role.element}.${c.role.property}`,
    c => c.role.enclosingComponent
      ? `${c.role.enclosingComponent}.${c.role.element}`
      : c.role.element,
    c => c.role.enclosingComponent
      ? `${c.role.enclosingComponent}.${c.role.element}.${c.role.property}`
      : `${c.role.element}.${c.role.property}`,
  ];

  for (const tier of tiers) {
    const keys = occurrences.map(tier);
    if (new Set(keys).size === occurrences.length) {
      return keys;
    }
  }

  // Positional fallback for true twins
  return occurrences.map((_, i) => `#${i + 1}`);
}
```

This greedy minimization produces the shortest meaningful disambiguator. The positional fallback is reached only when no structural signal distinguishes occurrences — a genuinely rare case in real codebases.

### 3.4 Object-Form Emission

The output of extraction-with-disambiguation is a per-file map ready for locale file emission:

```ts
function emitFileEntries(calls: ExtractedCall[]): FileEntries {
  const groups = detectCollisions(calls);
  const entries: FileEntries = {};

  for (const [source, occurrences] of groups) {
    if (occurrences.length === 1) {
      entries[source] = ''; // bare entry, empty stub
      continue;
    }
    const disambiguators = findMinimalDisambiguator(occurrences);
    const obj: Record<string, string> = {};
    for (let i = 0; i < occurrences.length; i++) {
      obj[disambiguators[i]] = '';
    }
    entries[source] = obj;
  }

  return entries;
}
```

Empty stubs are then filled via translation memory lookup, refactor detection, or AI invocation (next sections).

---

## 4. Project-Wide Translation Memory

### 4.1 Memory Construction

At extraction time, yapyak reads all existing locale files and builds an in-memory map:

```ts
interface MemoryEntry {
  translation: string;
  context: ContextRole | null;  // null for bare-key entries
  fileId: FileId;
}

type ProjectMemory = Map<Locale, Map<SourceString, MemoryEntry[]>>;

function buildMemory(localeFiles: LocaleFile[]): ProjectMemory {
  const memory: ProjectMemory = new Map();

  for (const { locale, data } of localeFiles) {
    const sourceMap = new Map<SourceString, MemoryEntry[]>();

    for (const [fileId, fileEntries] of Object.entries(data)) {
      for (const [source, value] of Object.entries(fileEntries)) {
        if (typeof value === 'string') {
          if (value === '') continue;
          push(sourceMap, source, {
            translation: value,
            context: null,
            fileId,
          });
        } else {
          for (const [contextStr, translation] of Object.entries(value)) {
            if (translation === '') continue;
            push(sourceMap, source, {
              translation,
              context: parseContextKey(contextStr),
              fileId,
            });
          }
        }
      }
    }

    memory.set(locale, sourceMap);
  }

  return memory;
}
```

The memory is built once per save cycle and lives in RAM. No persistent index files. The locale files themselves are the source of truth.

### 4.2 Lookup Classifications

When yapyak needs to fill a new locale entry, lookup classifies the source/role pair into one of five categories:

```ts
type LookupResult =
  | { kind: 'exact-match'; translation: string }       // same source AND same context exists
  | { kind: 'role-only-match'; translation: string }   // same source, same role (different file)
  | { kind: 'unique-candidate'; candidate: string }    // same source, only one translation across project
  | { kind: 'multiple-candidates'; candidates: Array<{ translation: string; context: ContextRole | null }> }
  | { kind: 'new' };                                    // source not seen before

function lookup(source: string, role: ContextRole, locale: Locale, memory: ProjectMemory): LookupResult {
  const entries = memory.get(locale)?.get(source) ?? [];

  if (entries.length === 0) return { kind: 'new' };

  // Exact context match (same role, regardless of file)
  const exact = entries.find(e => e.context && roleEquals(e.context, role));
  if (exact) return { kind: 'exact-match', translation: exact.translation };

  // Bare entry (no context) with matching translation
  if (entries.length === 1 && entries[0].context === null) {
    return { kind: 'role-only-match', translation: entries[0].translation };
  }

  // Single unique translation across all entries
  const unique = new Set(entries.map(e => e.translation));
  if (unique.size === 1) {
    return { kind: 'unique-candidate', candidate: [...unique][0] };
  }

  // Multiple translations exist (known homonym across project)
  return {
    kind: 'multiple-candidates',
    candidates: entries.map(e => ({ translation: e.translation, context: e.context })),
  };
}
```

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

Each refactor produces a translation action:

```ts
function applyRefactors(refactors: Refactor[], memory: ProjectMemory): Map<EntryKey, string> {
  const actions = new Map<EntryKey, string>();

  for (const r of refactors) {
    if (r.kind === 'move') {
      const existing = lookupExact(r.source, r.role, memory);
      if (existing) actions.set({ fileId: r.to, key: r.source, context: r.role }, existing);
    } else if (r.kind === 'split') {
      // Same translation goes to each new location with its respective role
      const existing = lookupAny(r.source, memory);
      if (existing) {
        for (let i = 0; i < r.to.length; i++) {
          actions.set({ fileId: r.to[i], key: r.source, context: r.roles[i] }, existing);
        }
      }
    } else if (r.kind === 'merge') {
      // Pick translation from any of the source files (typically all should match)
      const existing = lookupFromAny(r.source, r.from, memory);
      if (existing) actions.set({ fileId: r.to, key: r.source }, existing);
    } else if (r.kind === 'rename-at-position') {
      // Position-based rename (see Section 7)
      handleRenameAtPosition(r, actions, memory);
    }
  }

  return actions;
}
```

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

### 6.1 When AI Is Invoked

AI translation is invoked **only** in these cases:

1. **New source string** with no project memory (lookup returns `'new'`)
2. **Unique-candidate** lookup where the new context's role differs from the existing entry's role (lookup returns `'unique-candidate'` and roles diverge)
3. **Multiple-candidates** lookup where the project has established homonyms and the new context could match any

AI is **not** invoked when:
- Exact match (same source + same role) exists in project — direct carry
- Role-only match exists — direct carry
- Refactor detection has identified a move — direct carry
- Position-based rename detection has identified a source-edit — direct carry (or re-translate based on `preserveTranslationsOnRename`)

### 6.2 Candidate-Passing Prompt Extension

The translator prompt is extended with candidate-handling instructions when candidates exist:

```ts
interface TranslateRequest {
  source: string;
  context?: ContextRole;
  candidates?: Array<{ translation: string; context?: ContextRole }>;
  instruction?: 'use-or-reject' | 'pick-or-create';
}
```

System prompt addition:

```
Preserve all {placeholder} tokens and ICU patterns exactly as written.

When a candidate translation is provided, evaluate whether its meaning matches
the new call site's context. If it does, return the candidate unchanged.
If the context indicates a different meaning, translate fresh based on the
new context.

When multiple candidate translations are provided (the source has known homonyms
in this project), select the candidate whose existing context best matches the
new call site's context. If none match, translate fresh.
```

This pushes the semantic decision to the model with all relevant information. The model — which already has the context, the source, and the existing translations — is in the best position to decide.

### 6.3 Decision Categories

The model's response is categorized as:

- **Confirmed:** model returned the candidate unchanged → existing translation reused
- **Rejected:** model returned a new translation → fresh translation
- **Selected:** (multiple candidates) model picked one of the existing → that one used

All three are logged in provenance.

### 6.4 Why This Matters

Without AI-as-arbiter, a naive "unique source = carry across files" rule has a silent failure mode: the **first new semantic use** of an existing source string would inherit the wrong translation. For short UI text (`Open`, `Close`, `Save`, `Remove`, `Done`) this is exactly the case where homonyms emerge.

With AI-as-arbiter, the system makes a deliberate semantic decision instead of a structural assumption. The cost is one AI call per new call site that shares a source with existing entries (a small fraction of total saves). The benefit is correctness.

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

The model is not JSX-specific. Plain TypeScript code is supported via the same primitives.

### 10.1 Object Literals

```ts
// src/status/labels.ts
export const statusLabels = {
  open: t('Open'),
  closed: t('Closed'),
  cancelled: t('Cancelled'),
};
```

Each `t()` call's role is derived from the surrounding object property:

```ts
// Extracted roles:
// { element: 'statusLabels', property: 'open',      ... }
// { element: 'statusLabels', property: 'closed',    ... }
// { element: 'statusLabels', property: 'cancelled', ... }
```

No collisions (different sources). Locale file:

```json
{
  "src/status/labels.ts": {
    "Open": "Öppet",
    "Closed": "Stängt",
    "Cancelled": "Avbrutet"
  }
}
```

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

Collision detected. AST disambiguation uses parent object name:

```json
{
  "src/labels/all.ts": {
    "Open": {
      "buttonLabels": "Öppna",
      "statusLabels": "Öppet"
    }
  }
}
```

### 10.3 Function Bodies

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

Role derivation falls back to enclosing function name:

```json
{
  "src/payment/submit.ts": {
    "Card information is required": "Kortinformation krävs",
    "Payment failed": "Betalningen misslyckades"
  }
}
```

Different sources, no collisions, bare keys.

### 10.4 Module-Level Constants

```ts
// src/copy/messages.ts
export const SAVE_SUCCESS = t('Changes saved');
export const SAVE_FAILURE = t('Could not save changes');
```

Role: variable name.

```json
{
  "src/copy/messages.ts": {
    "Changes saved": "Ändringar sparade",
    "Could not save changes": "Kunde inte spara ändringar"
  }
}
```

### 10.5 Validation Messages (Edge Case)

```ts
export function validateEmail(email: string) {
  if (!email) return t('Required');
}

export function validateName(name: string) {
  if (!name) return t('Required');
}
```

Both calls have source `"Required"`, both at the function-body level, in different functions. Role derivation can use the enclosing function name:

```json
{
  "src/validation/all.ts": {
    "Required": {
      "validateEmail": "E-postadress krävs",
      "validateName": "Namn krävs"
    }
  }
}
```

The function name becomes the disambiguator. Two different validation contexts get two different translations.

This is the case where the semantic-selector model claimed superiority. The adaptive model handles it via function-name disambiguation. The translation in Swedish naturally differs because the AI sees the enclosing function context as part of the role.

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

1. **Adaptive emission of disambiguation context.** Every other i18n tool we know of either always includes context (gettext with msgctxt, every entry has it or doesn't) or never includes context (Lingui macros, react-intl auto-IDs). The adaptive approach — bare keys when source is unique, object form when it isn't, with automatic migration in both directions — is unusual.

2. **AST-derived context for disambiguation.** Most tools that use context require developers to write it manually (gettext: `pgettext("button", "Open")`). Auto-derivation from AST role is uncommon.

3. **Locale files as queryable translation memory.** No separate index file, no external service. The same JSON that translators edit is what powers cross-file lookups. This is structurally simple but rarely done.

4. **AI-as-arbiter with candidate-passing.** The translator prompt extension that includes existing translations as evaluable candidates, with explicit instructions to confirm-or-reject based on new context, is a novel use of AI in translation workflows.

5. **Refactor detection across file boundaries with orphan retention.** Detecting cross-file moves at save time, and retaining orphans as queryable memory so non-atomic moves still work, is a combination we have not seen elsewhere.

### 14.3 The Claim

We do not claim "first of its kind" in an absolute sense — proving that would require omniscience about all proprietary in-house systems and obscure academic work. We claim: the combination of (1) source-as-key with adaptive AST disambiguation, (2) locale-files-as-memory, (3) candidate-passing AI arbitration, (4) cross-file refactor detection, and (5) orphan retention as a single integrated open-source i18n compiler architecture is, to our knowledge, unprecedented.

Even if some elements have been explored in isolation elsewhere, the integrated whole is what creates the developer experience: write `t('Save')`, get refactor-stable translations, no manual keys, no hosted service, predictable AI usage, and locale files that translators can read directly.

---

## 15. Implementation Plan

### 15.1 Phase 1 — Translation Memory + AI-as-Arbiter (1 week)

**Goal:** Cross-file translation reuse without changing locale file format.

Modules:
- `packages/compiler/src/catalog/memory.ts` (new): build memory from locale files, expose `lookup()`
- `packages/compiler/src/catalog/sync.ts` (modified): use lookup before invoking translator
- `packages/translator/src/type.ts` (extended): add `candidates` field to `TranslateRequest`
- `packages/translator/src/prompt.ts` (extended): add candidate-handling instructions to system prompt

Tests: ~30 unit tests covering all five lookup classifications, candidate prompt construction, AI response handling.

**Estimated: ~150 lines production, ~300 lines tests.**

### 15.2 Phase 2 — AST Roles + Collision Detection (1 week)

**Goal:** Compute AST roles per call, detect same-file homonyms, emit object-form locale entries.

Modules:
- `packages/compiler/src/parser/role.ts` (new): generic role computation
- `packages/compiler/src/parser/processor/typescript.ts` (modified): TSX role extraction
- `packages/compiler/src/parser/processor/vue.ts` (modified): Vue template role extraction
- `packages/compiler/src/parser/processor/svelte.ts` (modified): Svelte markup role extraction
- `packages/compiler/src/parser/processor/astro.ts` (modified): Astro frontmatter + template role extraction
- `packages/compiler/src/catalog/keys.ts` (new): minimal disambiguator algorithm
- `packages/compiler/src/catalog/locale/file.ts` (modified): read/write object-form entries

Tests: ~80 tests covering each framework's role extraction, all four disambiguator tiers, positional fallback, bare↔object migration in both directions.

**Estimated: ~250 lines production, ~500 lines tests.**

### 15.3 Phase 3 — Refactor Detection + Orphan Retention + Clean Command (1 week)

**Goal:** Cross-file moves carry translations; orphans retained; explicit cleanup via CLI.

Modules:
- `packages/compiler/src/catalog/refactor.ts` (new): move/split/merge detection
- `packages/compiler/src/catalog/sync.ts` (modified): orphan retention (no auto-prune)
- `packages/cli/src/command/clean.ts` (new): `yapyak clean` command
- `packages/cli/src/command/translate.ts` (extended): provenance in CLI output
- `packages/vite/src/plugin.ts` (modified): integrate refactor detection into save loop

Tests: ~50 tests covering 1-to-1 moves, splits, merges, orphan retention across saves, clean command behavior with and without confirmation.

**Estimated: ~120 lines production, ~300 lines tests.**

### 15.4 Phase 4 — Polish & Edge Cases (1–2 weeks)

**Goal:** Production-ready behavior across all supported frameworks and edge cases.

Activities:
- Real-world component testing across React, Vue, Svelte, Astro
- Performance benchmarks on 10k+ message projects
- Migration tool for existing locale files (no destructive changes; just schema validation)
- Edge case fixes (Svelte reactive blocks, Vue v-for context, Astro frontmatter expressions, etc.)
- Documentation: introduction.md, how-it-works.md, FAQ updates
- Example projects demonstrating each scenario

**Estimated: ~50 lines production fixes, ~200 lines additional tests, significant manual testing.**

### 15.5 Total

| Phase | Production | Tests | Time |
|---|---|---|---|
| 1: Memory + Arbiter | ~150 | ~300 | 1 week |
| 2: Roles + Collisions | ~250 | ~500 | 1 week |
| 3: Refactor + Orphans | ~120 | ~300 | 1 week |
| 4: Polish | ~50 | ~200 | 1–2 weeks |
| **Total** | **~570** | **~1300** | **4–5 weeks** |

Plus ~1–2 weeks for documentation updates.

---

## 16. Migration

### 16.1 Backward Compatibility

The new schema is a strict superset of the old. Existing locale files in the format `{ "src/file.tsx": { "Save": "Spara" } }` are valid in the new format and require no migration.

When a homonym is first introduced for a source that has a bare-key entry, the migration runs automatically during sync (see Section 2.5). The existing translation moves to the appropriate sub-key based on the previously-extracted call's AST role.

### 16.2 No Manual Intervention Required

Projects upgrading to the adaptive model do not need to:
- Edit existing locale files
- Re-run translation
- Reorganize their source code

The model adopts itself.

### 16.3 Tooling for Inspection

A new CLI command can audit a project for potential homonyms:

```bash
$ yapyak audit
Potential same-file homonyms (translation may be ambiguous):
  src/store/StorePanel.tsx:
    "Open" appears 2 times — used by both <button> and <Badge>
  src/forms/SearchForm.tsx:
    "Search" appears 3 times — same input element, different attributes

Recommendation: these entries may benefit from object-form entries.
Run `yapyak translate` to migrate them automatically.
```

This is informational. It does not change anything.

---

## 17. Test Scenarios Catalog

The following scenarios must all be covered by the test suite. Each tests a specific aspect of the adaptive model.

### 17.1 Identity & Storage

- Bare key emission for single-occurrence source
- Object-form emission for same-file homonyms (element-disambiguated)
- Object-form emission for same-file homonyms (property-disambiguated)
- Object-form emission for same-file homonyms (parent-disambiguated)
- Positional fallback for true twins
- Bare → object migration when homonym is introduced
- Object → bare migration when homonym is resolved

### 17.2 Translation Memory

- Cross-file lookup returns unique translation for repeated source
- Cross-file lookup returns multiple translations when project has homonyms
- New source returns `'new'`
- Role-based exact match takes priority over general match
- Empty translations are excluded from memory

### 17.3 Refactor Detection

- 1-to-1 move carries translation
- 1-to-N split distributes translation
- N-to-1 merge consolidates translation
- Move within same atomic save
- Move across multiple saves (via orphan retention)
- Move + source-edit simultaneously (treated as new)
- Position-based rename at same line/column
- Position-based rename across line changes (currently not supported)

### 17.4 AI-as-Arbiter

- New call site, no candidates → fresh translation
- New call site, one candidate, matching role → direct carry (no AI)
- New call site, one candidate, different role → AI confirms or rejects
- New call site, multiple candidates → AI selects or invents

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
> 2. **New call site with an existing translation.** yapyak sends the source, the new call site's context, and the existing translation as a candidate to the *translator*. The *translator* uses the candidate when the meaning matches and re-translates otherwise.
> 3. **Genuinely new source.** No prior translation exists in the project. yapyak sends the source and call-site context as a fresh translation request.
>
> Refactoring code does not re-translate text the project already knows. Adding a new call site for an existing short string — `Open`, `Close`, `Save`, `Done` — does not silently assume the first registered meaning. The *translator* sees both contexts and decides.
>
> Orphaned entries — translations whose source string has disappeared from the codebase — are kept as project memory but never auto-applied. `yapyak clean` removes them explicitly.

Also update the locale file format section to show object-form entries.

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

### 20.5 Positional Arrays

```json
{
  "src/SaveButton.tsx": [
    { "source": "Save", "translation": "Spara", "line": 12 }
  ]
}
```

Storing entries as ordered arrays with positions.

**Why rejected:**

- Positions change with every edit unrelated to translation.
- Reordering siblings breaks entries.
- JSON arrays do not support direct key lookup.
- Translator tools and CAT services expect key-value maps.

Maps with source-as-key are the correct shape.

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

### 20.8 Always-On AST Disambiguation

Always emitting object-form entries, even when source strings are unique within their file:

```json
{
  "Save": { "button": "Spara" }
}
```

Considered for uniformity. Every entry would have a role sub-key whether or not it was needed for disambiguation.

**Why rejected:**

- Locale files become noisier without semantic benefit in the 95% case.
- Translators lose the simple "source → translation" mental model.
- Refactors that change role (e.g., button → a) appear in diffs unnecessarily.
- The model's adaptiveness — bare when possible, structured when necessary — is what makes it elegant.

The chosen design emits object form only when collision exists. This is the entire reason "adaptive" is in the name.

---

## 21. Conclusion

The adaptive identity model is the result of extended architectural exploration. The alternatives that were considered and rejected — explicit context annotation, manual message IDs, pure hierarchy keys, persistent tree storage with reconciliation, positional arrays, hosted services, semantic selectors with manifests, always-on disambiguation — are documented in Section 20.

What remains is a model that:

- **Keeps the developer-facing API trivial.** `t('Save')` works. No keys to maintain.
- **Keeps locale files clean.** Bare strings for 95% of entries, object form only when structure requires it.
- **Keeps the runtime small.** Compiled `_pick({...})` per call site, no change.
- **Keeps translations stable across refactors.** File moves, wrapper insertions, element changes, sibling reorders, source-text edits at same position — all preserve translations.
- **Keeps translation memory in the repo.** No external cache, no service, no vendor.
- **Keeps semantic decisions explicit.** AI-as-arbiter decides reuse vs. fresh when context shifts.
- **Keeps orphans queryable.** Translations remain available after their source disappears, until explicit cleanup.
- **Keeps provenance visible.** Every entry's origin is traceable.

The combination is novel as far as we know. The implementation is achievable in ~570 lines of production TypeScript across four phases. The model is backward compatible with existing locale files and requires no manual migration.

This is the architecture yapyak is committing to.

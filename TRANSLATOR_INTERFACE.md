# yapyak Translator Interface — Specification

> Version 1.0 — Minimal protocol for translator implementations.
>
> A *translator* in yapyak is anything that reads a locale file (or a subset of its entries) and returns the same file with empty translations filled in. This document specifies the interface so that any AI, service, or human-driven tool can implement it.

## Purpose

yapyak's compiler produces a self-contained locale file (see [LOCALE_FILE_FORMAT.md](./LOCALE_FILE_FORMAT.md)). A *translator* turns missing translations into filled ones.

The translator interface is deliberately small. yapyak does not ship arbitration logic, prompt engineering, or provider-specific glue. All of that lives in the locale file format itself — see [ADAPTIVE_IDENTITY_MODEL.md §6](./ADAPTIVE_IDENTITY_MODEL.md). A translator is a thin adapter between yapyak's file and a translation backend.

This is the **format-as-protocol** model: the JSON file is the protocol; translators are just runners.

---

## The Central Principle

> **A translator takes a locale file, returns the same locale file with missing translations filled.**

Same shape in, same shape out. The translator does not need to understand the identity model, the AST, the compiler, or yapyak's CLI. It needs to:

1. Read JSON conforming to the locale file v1 schema
2. Find entries whose `target` is empty (state: `missing` or `needs-arbitration` depending on whether `candidates` is present)
3. Fill the `target` field using the provided `instructions`, `glossary`, `context`, `hint`, and `candidates`
4. Set `needsReview: true` when uncertain (writing the rationale into `hint`)
5. Remove the `candidates` field after deciding
6. Return the modified JSON

Everything the translator needs to produce a high-quality translation is already in the file. No external lookups required.

---

## Interface

The minimal TypeScript interface a translator must implement:

```ts
interface Translator {
  /**
   * Translate entries in the locale file whose `target` is empty.
   * Returns the same file shape with `target` filled and `candidates` removed.
   *
   * The translator MUST:
   *   - Preserve all entries not selected for translation verbatim
   *   - Preserve `source`, `context`, `hint`, `maxLength`, and entry-level custom fields
   *   - Remove `candidates` from entries it processes (decision lives in `target`)
   *   - Set `needsReview: true` when uncertain (and write rationale into `hint`)
   *   - Not modify top-level `instructions`, `glossary`, `sourceLocale`, or `targetLocale`
   *
   * The translator MAY:
   *   - Skip entries with non-empty `target` (already translated)
   *   - Skip entries not matching the selection
   *   - Validate ICU well-formedness and placeholder preservation before returning
   */
  translate(
    file: LocaleFile,
    options?: TranslateOptions
  ): Promise<LocaleFile>;
}

interface TranslateOptions {
  /**
   * Limit translation to a subset of entries. The translator returns the
   * full file shape, but only modifies matching entries.
   *
   * If omitted, the translator processes all entries with empty target.
   */
  select?: {
    files?: string[];                              // limit to these file paths
    state?: Array<"missing" | "needs-arbitration" | "needs-review">;  // derived state filter
    sources?: string[];                            // limit to these source strings
  };

  /** Abort signal for cancellation (e.g., user pressed Ctrl-C in CLI). */
  signal?: AbortSignal;

  /** Progress callback called per processed entry. */
  onProgress?: (event: ProgressEvent) => void;
}

interface ProgressEvent {
  done: number;
  total: number;
  current: { file: string; source: string };
}
```

That is the entire interface. ~20 lines.

---

## What a *Translator* Does Per Entry

For each entry the translator decides to process:

### Entry needing translation (derived state: `missing`)

```jsonc
{
  "source": "Save changes",
  "context": {
    "kind": "elementChild",
    "container": "button",
    "enclosing": "SettingsForm",
    "ancestors": [],
    "position": 1
  },
  "hint": "Form submit button — use a confident verb",
  "maxLength": 20,
  "target": ""
}
```

The translator generates a target-locale translation using:
- `source` — what to translate
- `context` — structural role at the call site (discriminated union, see [LOCALE_FILE_FORMAT.md](./LOCALE_FILE_FORMAT.md#the-context-field))
- `hint` — author-supplied free-text guidance
- `maxLength` — optional UI length constraint
- Top-level `instructions` — project tone and translation rules
- Top-level `glossary` — required term renderings

Then writes:

```jsonc
{
  "source": "Save changes",
  "context": {
    "kind": "elementChild",
    "container": "button",
    "enclosing": "SettingsForm",
    "ancestors": [],
    "position": 1
  },
  "hint": "Form submit button — use a confident verb",
  "maxLength": 20,
  "target": "Spara ändringar"
}
```

### Entry needing arbitration (derived state: `needs-arbitration`)

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

Derived as `needs-arbitration` because `target` is empty AND `candidates` is present. The translator evaluates each candidate against the new `context`. Two outcomes:

**Candidate matches the new context** → reuse it:

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
  "target": "Öppna"
}
```

**No candidate matches** → translate fresh:

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
  "target": "Öppet"
}
```

In both outcomes the `candidates` field is **removed** from the resulting entry — see [LOCALE_FILE_FORMAT.md §candidates](./LOCALE_FILE_FORMAT.md#candidates).

### Entry the translator is unsure about

When the translator cannot decide with confidence (ambiguous source, missing context, conflicting candidates), it writes a best-guess `target`, sets `needsReview: true`, and writes the rationale into `hint`:

```jsonc
{
  "source": "Apply",
  "context": {
    "kind": "elementChild",
    "container": "button",
    "enclosing": "FiltersPanel",
    "ancestors": [],
    "position": 1
  },
  "hint": "Apply could be 'Använd', 'Tillämpa', 'Ansök', or 'Lägg till' depending on whether this is a filter, a setting, a job action, or a styling action. I chose 'Använd' for filter context — please verify.",
  "needsReview": true,
  "target": "Använd"
}
```

Derived state is `needs-review`. The draft `target` is the translator's best guess; the `hint` explains why a human is needed.

A human reviewer finds these via `yapyak review` CLI or by filtering on `"needsReview": true`. After review:
- If correct: remove `needsReview` (or set to false). Derived state becomes `translated`.
- If wrong: edit `target`, remove `needsReview`. Derived state becomes `translated`.

---

## Reference Implementations

### Minimal Claude (Anthropic) translator

The entire implementation:

```ts
import Anthropic from "@anthropic-ai/sdk";

export function claude(apiKey: string): Translator {
  const client = new Anthropic({ apiKey });

  return {
    async translate(file, options) {
      const selection = selectEntries(file, options?.select);
      if (selection.length === 0) return file;

      const response = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 16000,
        system: TRANSLATOR_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: JSON.stringify({ file, selection }, null, 2),
          },
        ],
      });

      const translatedFile = parseTranslatorResponse(
        response.content[0].type === "text" ? response.content[0].text : ""
      );
      return mergeTranslatedFile(file, translatedFile, selection);
    },
  };
}

const TRANSLATOR_SYSTEM_PROMPT = `You are a translator that receives a yapyak locale file (v1 schema).

For each entry in the provided selection:
  - Read the file's top-level "instructions" and "glossary" — they apply to every entry.
  - Read each entry's "source", "context", and "hint" (if present).
  - If the entry has a "candidates" field, decide whether any candidate's "target"
    matches the new "context". If yes, reuse that target verbatim. If no, translate fresh.
  - If the entry's "target" is empty (and there are no candidates), translate the "source"
    to the target locale specified by the file's "targetLocale" field.
  - Preserve ICU argument names and types between source and target. Plural/select branches
    may differ per target-locale CLDR rules.
  - Preserve all {placeholder} tokens.
  - Apply the glossary terms consistently. Brand names in the glossary with target === source
    must be left as-is in the translation.
  - Write the result into the entry's "target" field.
  - Remove the "candidates" field from entries you process (the decision lives in "target").
  - If you are uncertain about a translation, write your best guess into "target", set
    "needsReview": true, and put a brief explanation of the uncertainty into "hint".
  - Do not modify entries outside the selection. Do not modify "source", "context",
    "instructions", "glossary", "sourceLocale", or "targetLocale".

Read the entry's "context" as a discriminated union (keyed by "kind"). Use the
"kind" + "container" + "slot" (if present) fields to understand the AST role:
  - "kind": "elementChild" + "container": "button" → button label text, typically imperative
  - "kind": "elementChild" + "container": "h1"/"h2"/"h3" → heading text, declarative
  - "kind": "elementChild" + "container": "p" → paragraph text
  - "kind": "elementAttribute" + "slot": "placeholder" → short hint text in a form field
  - "kind": "elementAttribute" + "slot": "ariaLabel" → accessibility label
  - "kind": "throw" + "container": "<ErrorClass>" → error message, clear and actionable
  - "kind": "callArgument" + "container": "error"/"warn" → toast or log message
  - "kind": "callArgument" + "container": "success"/"info" → toast notification
  - Custom component names → check "hint" for semantic guidance; if context is genuinely
    ambiguous, set "needsReview": true with explanation.

Return the complete file as JSON, conforming exactly to the v1 schema.`;
```

The translator is **~40 lines of code, including imports and the system prompt**. The intelligence is in the JSON file and the system prompt — both are inspectable, both are version-controlled.

### Minimal OpenAI translator

The same shape, different SDK:

```ts
import OpenAI from "openai";

export function openai(apiKey: string): Translator {
  const client = new OpenAI({ apiKey });

  return {
    async translate(file, options) {
      const selection = selectEntries(file, options?.select);
      if (selection.length === 0) return file;

      const response = await client.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: TRANSLATOR_SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({ file, selection }, null, 2),
          },
        ],
      });

      const translatedFile = JSON.parse(
        response.choices[0].message.content ?? "{}"
      );
      return mergeTranslatedFile(file, translatedFile, selection);
    },
  };
}
```

Provider swap is one file. The system prompt is shared. The locale file format is identical.

### Manual translator (no AI)

For projects without AI translation, the manual translator is a no-op:

```ts
export const manual: Translator = {
  async translate(file) {
    return file;
  },
};
```

yapyak runs the extraction loop, materializes entries with `status: "missing"`, and the human (or external CAT tool) fills `value` directly in the locale file.

### Coding-agent translator

Claude Code, Cursor, or any LLM-driven editor IS a translator in this model. When a developer asks "translate the missing strings in `src/locales/sv.json`", the agent:

1. Opens the file
2. Reads `instructions`, `glossary`, and each entry's `source`/`context`/`notes`/`candidates`
3. Fills `value` and updates `status` for each entry
4. Removes `candidates` after deciding
5. Saves

No yapyak adapter is needed. The locale file IS the contract. The agent operates directly on it.

---

## Selection Semantics

The optional `select` parameter lets callers limit which entries are processed:

```ts
// Translate only missing entries (default)
await translator.translate(file);

// Translate only entries in specific files
await translator.translate(file, {
  select: { files: ["src/checkout/CheckoutForm.tsx"] }
});

// Translate only entries needing arbitration
await translator.translate(file, {
  select: { status: ["needs-arbitration"] }
});

// Translate only specific source strings (e.g., re-translate after glossary change)
await translator.translate(file, {
  select: { sources: ["Save", "Cancel", "Continue"] }
});
```

If multiple filters are given, they combine as **AND** (intersection). If `select` is omitted entirely, the translator processes every entry with `status` in `["missing", "needs-arbitration"]`.

The translator always returns the **full file**, regardless of selection. Entries outside the selection are returned verbatim.

---

## Validation Expected From a *Translator*

A conformant translator SHOULD validate the following before returning:

1. **ICU argument preservation.** Every argument name (`{count}`, `{name}`) in `source` must appear in `value` with the same type marker (`plural`, `select`, etc.).
2. **Placeholder preservation.** Every `{placeholder}` token in `source` must appear in `value`.
3. **ICU well-formedness.** `value` must parse as valid ICU MessageFormat if `source` does.
4. **Unicode NFC.** `value` should be NFC-normalized before writing.

A translator that returns malformed entries is still considered conformant — yapyak's `yapyak validate` will catch the issues and surface them via diagnostics. But translators that validate proactively give a better developer experience.

---

## What yapyak Does Around the *Translator*

The translator is **not** the whole translation pipeline. yapyak orchestrates around it:

1. **Before calling the translator.**
   - yapyak runs extraction from source code, materializes new entries with `status: "missing"`.
   - yapyak runs project memory lookup, injects `candidates` and sets `status: "needs-arbitration"` where appropriate.
   - yapyak passes the file to the translator.

2. **After the translator returns.**
   - yapyak validates the returned file against the v1 schema.
   - yapyak validates ICU/placeholder invariants.
   - yapyak categorizes the translator's decisions (confirmed / selected / rejected) into `.yapyak/provenance.json`.
   - yapyak writes the validated file to disk.
   - yapyak triggers HMR via Vite WebSocket events.

The translator is responsible only for the inner step. The orchestration is yapyak's job and is identical regardless of which translator is in use.

---

## Configuration

A project selects a translator in `yapyak.config.ts`:

```ts
import { defineConfig } from "yapyak";
import { claude } from "yapyak/translators/claude";

export default defineConfig({
  locales: ["en", "sv", "de"],
  sourceLocale: "en",
  translator: claude(process.env.ANTHROPIC_API_KEY),

  // Translator selection can be conditional:
  // translator: process.env.CI ? manual : claude(...)
});
```

If no `translator` is configured, yapyak still runs extraction and materializes entries with `status: "missing"`. Translation is then performed manually (by editing the locale file directly) or by an external coding agent. The format-as-protocol design means no provider is privileged.

---

## Why This Interface Is This Small

Three properties drove the design:

1. **Provider-agnostic.** A new translator implementation is a thin adapter — usually one file, often under 50 lines. yapyak does not ship knowledge about any particular provider.

2. **Inspectable.** The input and output are the same JSON file. A developer can run the translator manually, inspect the diff, and re-run if needed. Nothing happens in a hidden API call that cannot be replayed.

3. **Compatible with external agents.** Because the contract is "read JSON, write JSON," any AI coding agent — Claude Code, Cursor, Aider, future successors — is a valid translator without writing a yapyak adapter. The locale file is the protocol.

These properties only hold if the interface stays small. Adding provider hooks, prompt-construction APIs, or arbitration-specific methods would compromise all three. The interface is small **on purpose**.

---

## Versioning

This interface version follows the locale file format version. v1.0 of the translator interface accompanies v1 of the locale file format. Breaking changes to one will typically require breaking changes to the other; they are versioned together.

Minor additions to the interface (new options, new selection filters) are backward-compatible: translators that ignore the new options remain conformant. yapyak passes options through but does not require translators to honor them.

---

## Conformance Test

A reference test suite is published at `https://yapyak.dev/translators/conformance/v1`. A translator is considered v1-conformant if it:

1. Returns the full file shape with all non-selected entries verbatim
2. Removes `candidates` from entries it processes
3. Sets `status` correctly per the rules in §6 of this document
4. Preserves ICU arguments and placeholders
5. Returns valid Unicode NFC

Conformance is not gated by yapyak — any translator can ship and projects can choose what to trust. The conformance suite is a tool for translator implementations, not a barrier.

---

## Conclusion

The translator interface is the smallest piece of yapyak's architecture. It is small because the locale file format carries the intelligence. Translators are runners; the format is the protocol.

This is the architecture yapyak commits to for v1.0.

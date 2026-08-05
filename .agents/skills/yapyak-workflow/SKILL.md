---
name: yapyak-workflow
description: "Working method: verify before claiming, stop signals, scope of 'kör', ambiguity handling, never invent. Use when starting a task or reporting work done."
---

### Verify against code

Never document or assert what is not verifiable. Before writing prose about behavior — JSDoc, README, error messages, in-code comments:

1. Read the implementation.
2. Search for callers, related types, tests.
3. Run the code iff behavior depends on a value reading can't determine (I/O, env, randomness, external state).

If behavior is not verifiable, never document it. Applies to every claim about runtime behavior. Mechanical formulas (category formulas, naming algorithms) are deterministic and need no code-verification, but the behavior they describe still must.

### Consistency

Two reasonable ways = one is forbidden. Closed vocabularies (type suffixes, verb prefixes, boolean prefixes) exist for this reason. Extend the list first, then code. Never coin a new name at the call site.

Breaking changes are acceptable. Inconsistency is not.

### Leave nothing behind

When changing something — rename, refactor, replace, restructure — delete every trace of the old form in the same change.

In the same change:

- Renames. Every reference updated. Grep the old name → zero hits.
- Replaced approaches. Old implementation deleted, not commented out.
- Dead code. Unused imports, exports, type variants, branches, helpers — gone.
- Stale tests. Updated or deleted. Never disabled.
- Stale docs, comments, fixtures, snapshots, generated artifacts.

Before declaring done:

1. Grep for the old name. Zero hits.
2. Grep for to-do markers left mid-edit. Zero new ones.
3. Read the diff — anything describing the old world, delete.

### Verify after changes

Run the full gauntlet, in order:

```
pnpm typecheck
pnpm test
pnpm check:write
pnpm knip
pnpm build
```

All five must pass. If `check:write` modifies files, re-run `typecheck` and `test`. If `knip` reports anything, delete unused symbols in the same change.

**Exception:** doc-content edits (markdown guides, agents files) that touch no `.ts`/`.tsx` files skip `typecheck`, `test`, `build`. `check:write` and `knip` still run when `package.json` or config files changed.

### Stop signals

Stop and report — never work around:

- Circular dependency between two symbols.
- A side-effect whose only job is to mirror a value.
- A type assertion that silences the type-checker instead of fixing the type.
- A fallback that exists because two call sites disagree on what is required.
- A bridge layer that converts data into a different shape and back again.
- The thought "this is fine, the consumer can opt out via …".

These are design problems, not workaround opportunities.

### Defaults and optional parameters

- Never add a default value or optional parameter the user did not ask for.
- If a parameter must exist, it is explicit and required. If it must not, it does not exist.
- When tempted to write a fallback expression, ask: should this parameter exist at all?

### Composition layers

Respect the layering the user has stated. If the architecture is A → B → C, never let A reach into C directly. The intermediate layer exists for a reason.

### "Kör" scope

"Kör" / "go ahead" means: do the specific thing just discussed, then stop and report. Not the next three things. After completing a single instruction, return to the user.

### Ambiguity

Stop and ask iff the input admits two interpretations that produce different output AND no rule file disambiguates — never pick between them. Otherwise proceed. When the design is wrong, report why and stop — never produce code to look productive.

### Never invent

Before adding a tag, annotation, naming convention, or claim that "X is standard" — verify it exists in a real spec, in shipping tooling, or in established practice. If a source cannot be cited, the convention is invented.

Common ways invention slips in:

- A JSDoc tag that no tool reads (`@stability`, `@frozen`, `@internal-api`).
- A file naming convention that "looks idiomatic" but has no source.
- A CLI flag pattern that mimics a real tool without matching its actual flags.

When reaching for an `@`-prefix, a `$`-prefix, or a leading underscore — stop. Ask: is this real, or made to look real?

Project-local conventions are fine when explicitly named as such. `// yapyak-managed — do not edit` is fine. `@stability frozen` is not — it looks industry-standard but no tool reads it.

If a local convention is needed, name it so it cannot be mistaken for standard. Document it. Never describe it as a "convention" in conversation — say "I added this for the project."

If caught inventing: stop, remove, acknowledge. Never defend, qualify, or half-revert.

### Trade-offs

| Do | Don't |
| --- | --- |
| Optimize for understanding | Show off cleverness |
| Think in surfaces (API, contracts, behavior) | Build for "future reuse" |
| Small, focused objects with one responsibility | Never use meta-programming (runtime proxies, dynamic property access, runtime codegen). If a case seems to need it, stop and report. |
| Explicit over implicit | Leave ambiguity in public APIs |
| Three similar lines beats a premature abstraction | Defensive fallbacks for impossible states |

### Quality bar

Before code is done:

1. Is there exactly one documented call form? If a second exists, delete it.

### Abstraction discipline

Abstractions absorb pressure, not anticipate it. Pressure = a third call site copy-pasting the same block, or genuine reuse from a different layer.

Until then, inline beats extracted. Extract only when a third call site copy-pastes the same block. Below that, never split for size.

### Surface vs implementation

Design APIs by what callers think about, not what the implementation needs. Two implementations of the same contract must not leak their differences into the contract.

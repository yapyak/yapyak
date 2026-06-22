## General

### Verify against code

Never document what cannot be confirmed. Before writing any prose about behavior — JSDoc, YARD, README, error messages, blog posts, in-code comments:

1. Read the implementation.
2. Search for callers, related types, and tests when the behavior is non-obvious.
3. Run the code if uncertain.

If the behavior is not verifiable, do not document it. This is the only rule whose violation makes everything else moot.

The rule applies to every claim about runtime behavior: what a function returns, when a callback fires, which errors throw, whether a cache persists, what a flag enables. Mechanical formulas (category formulas, naming patterns, role tables) are deterministic and need no code-verification — but the behavior they describe still must.

### Consistency

Consistency beats local optimization. If there are two reasonable ways to do something, one is forbidden. Closed vocabularies (type suffixes, verb prefixes, boolean prefixes, private-method prefixes) exist for this reason — extend the list first, then code. Never coin a new name at the call site.

Names describe what, not how. Execution details (how something is fetched, when it runs, which transport it uses) leak implementation into the API when they appear as name suffixes. If two implementations must be distinguished, separate them at the module level.

Breaking changes are acceptable. Inconsistency is not.

### Leave nothing behind

When you change something — rename, refactor, replace, restructure — delete every trace of the old form in the same change. No transitional aliases.

In the same change:

- Renames. Every reference updated. Grep the old name → zero hits. No re-export aliases, no deprecation shims unless a published API mid-release forces it.
- Replaced approaches. Old implementation deleted, not commented out. No feature-flag branches preserved "just in case".
- Dead code. Unused imports, exports, type variants, branches, helpers — gone.
- Stale tests. Updated or deleted alongside the behavior change. Never disabled.
- Stale docs and comments. Anything describing the old behavior — gone.
- Stale fixtures, snapshots, generated artifacts. Regenerated or deleted.

Before declaring done:

1. Grep for the old name. Zero hits.
2. Grep for to-do markers left mid-edit. Zero new ones.
3. Read the diff — anything describing the old world, delete.

Partial migrations are exceptional. If genuinely required (published API mid-release), name the in-flight state explicitly in a top-level note with planned removal version.

### Verify after changes

After any substantive code change (source-file edits, refactor, API change, JSDoc batch update), run the full verification gauntlet before declaring done. Mechanical, in order:

```
pnpm typecheck      # catches type errors across all packages
pnpm test           # catches regressions
pnpm check:write    # biome: format + auto-fix lint (writes changes)
pnpm knip           # catches unused exports / dead deps
pnpm build          # catches build-time errors
```

All five must pass. If `check:write` modifies files, re-run `typecheck` and `test`. If `knip` reports anything, delete the unused symbols in the same change (see Leave nothing behind).

**Skip-conditions** — none of these are valid reasons to skip a step:
- "Tests passed before my change" — they may fail after.
- "Knip didn't complain about this file last time" — exports drift.
- "I'll run check at the end" — running mid-batch catches issues earlier.

**Exception** — purely doc-content edits (markdown guides, agents files) that touch no `.ts`/`.tsx` files skip `typecheck`, `test`, `build` since none apply. `check:write` and `knip` still run if any `package.json` or config file changed.

### Trade-offs

| Do | Don't |
| --- | --- |
| Write code that is read more often than written | Show off cleverness |
| Optimize for understanding, not brevity | Build for "future reuse" |
| Think in surfaces (API, contracts, behavior), not implementation | Create abstractions before pressure exists |
| Small, focused objects with one responsibility | Use meta-programming without extreme justification |
| Explicit over implicit — no magic, no monkey patching | Leave ambiguity in public APIs |
| Three similar lines beats a premature abstraction | Defensive guesswork — fallbacks for impossible states |

### Quality bar

Before code is done:

1. Can I understand this in 6 months?
2. Is there exactly one way to use this?
3. Is this idiomatic for the language/framework?
4. Could this be simpler without introducing variation?

If the answer is "yes, but…" — rewrite.

### Abstraction discipline

Abstractions absorb pressure, not anticipate it. Pressure = a third call site copy-pasting the same block, or genuine reuse from a different layer.

Until then, inline beats extracted. A 200-line function with one tightly-coupled flow is fine. A 30-line file split across 5 modules is overengineered.

### Surface vs implementation

Design APIs by what callers must think about, not what the implementation needs. Two implementations of the same contract must not leak their differences into the contract. If they must be distinguished, separate them at the module level.

### Visibility

Every exported symbol in a library or shared module falls into one of three visibility levels:

| Level | Reachable by | How to decide |
|---|---|---|
| **Public** | Users of the package/gem | Will external users call this? |
| **Semi-public** | Other modules within the package | Will other internal modules call this? |
| **Private** | Same class/file only | Only used here? |

Language-specific markers and enforcement live in `<language>/library/base.md`.

#### Default to NOT exposing

Adding a public export later is non-breaking; removing one is breaking. Err on the side of internal.

#### The "would a realistic user type this name?" test

Before promoting a symbol to public, ask: would a realistic user ever type this name in their own code? If you can't construct a concrete usage example, keep it internal — even when reachable from a public symbol's *implementation*.

User-typed names fall into three categories. A symbol is legitimately public if it serves at least one:

| Category | What it means | Example |
|---|---|---|
| **Consumption** | User invokes it | `Contract.define`, `createClient` |
| **Annotation** | User references the name as a type / `is_a?` check | `const opts: CreateClientOptions`, `raise ConfigurationError` |
| **Extension** | User subclasses or implements against it | `class MyContract < Apiwork::Contract::Base` |

If a symbol serves none of these, it's internal.

#### README API Reference sync

If the package's `README.md` has an `## API Reference` (or equivalent) section, treat it as part of the public surface. When a public symbol is added, removed, or renamed, update the README in the same commit. Never let docs drift from the published exports.

### Naming

Language-specific extensions live in `<language>/naming.md`.

#### No abbreviations

Use the full domain word. Forbidden: `cfg`, `opts`, `ctx`, `arg`, `req`, `res`, `tmp`, single letters (`e`, `i`, `j`, `k`), filler placeholders (`data`, `info`, `item`, `thing`, `foo`, `bar`).

Two-letter idioms are allowed only when the language blesses them. Documented per language.

#### Descriptive vs context-aware

Names carry the minimum context to disambiguate. Inside a context that provides part of the meaning, drop it. Outside, add it back.

Test: read the name at the call site without surrounding code. Self-explanatory? Then it's right.

#### Variable names describe what the value IS

A variable's name describes its identity, not the method that produced it. Add a qualifier only when distinguishing between similar values in the same scope.

Loop and callback parameters never use single letters. The parameter names what the value is.

#### Public vs internal naming

- Public API: short, conceptual.
- Internal: descriptive, disambiguated.

Never type-suffix the public surface. If a public type's name would be `*Definition` or `*Config`, that's the internal name. The public name is the bare concept.

#### Adjective-noun order

Multi-word names go adjective-then-noun, never noun-then-adjective.

#### Don't repeat context across argument names

A method's argument names don't repeat what the method, class, or scope already states.

#### Names eliminate the need for comments

If a method body needs an **inline** comment to be understood, the name is wrong. Rename or extract a well-named helper. Public-API documentation comments (YARD, JSDoc) are out of scope — see § Comments.

#### Closed vocabularies

When a project defines a closed list of prefixes/suffixes, extend the list first, then code. Never coin a new name at the call site. If a new prefix is genuinely needed, propose the addition.

### Comments

No comments in code. Exceptions:

- Functional comments — directives the tooling reads (linter suppressions, magic comments, compiler hints).
- Documentation comments on public API in library code.

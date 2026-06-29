## Style

How every file in `agents/` is written. Each line is a RULE — an imperative the agent runs or is checked against — or it is deleted. Narration (description of the system for a human reader) changes no behavior. Cut it.

### The nine tests

Apply to every line. Each yields keep, rewrite, or delete.

| # | Test | Trigger | Action |
|---|---|---|---|
| T1 | Behavior | Would the agent do the wrong thing without this line? No | DELETE |
| T2 | Imperative | Line is `X is a Y` / `The site…`, not verb-first, table, list, or code | REWRITE as a command |
| T3 | One rule | Line joins two rules, or carries a which/so-that/because clause that does not change the action | SPLIT, or cut the clause |
| T4 | Show | Explanation is longer than the rule | REPLACE with a ✓/✗ code pair |
| T5 | Prohibition | `Never X` with no positive direction | APPEND `→ do Y instead` |
| T6 | Format | Closed set, decision, transform, or mapping written as prose | LIST, TABLE, or ALGORITHM block |
| T7 | No plumbing | Line describes the rule system itself (loading, scope, "adds to the shared rules", "lives in central `agents/`") | DELETE |
| T8 | No preamble | Sentence under a header restates the header | DELETE |
| T9 | Index | Pointer line is a sentence | REWRITE as `path — topic, topic` |

### Five set invariants

The nine tests govern prose **inside** a file. These five govern the **set** of files.

| # | Invariant | Mechanical test |
|---|---|---|
| I1 | Trigger cohesion | Every rule in a file fires on one "when you…". Two unrelated triggers → split. |
| I2 | Merge | Two files become one **iff** their triggers mutually imply — you always load A exactly when you load B. |
| I3 | Content single-source | Each rule is defined in exactly one file; every other mention cross-references it, never restates. |
| I4 | Scope single-source | A file's tier (when it loads) is encoded once — in the `AGENTS.md` that selects it — never in its path. ⇒ flat bank, no tier sub-folders. |
| I5 | Derivable name | filename = the trigger's subject noun, kebab-case, singular, no prefix. A shared prefix (`css-*`) is an I2 violation in disguise. |

### Minimal ≠ incomplete

Two orthogonal axes:

- **Minimal** — T1–T9 cut prose.
- **Complete** — every decision in the topic has exactly one deterministic answer.

Test completeness by enumerating the decisions, never by explaining them. `naming.md` covers every filename decision in ~60 lines with zero narration — minimal and complete at once.

### One rationale line, earned

T4 permits at most one WHY line, and only when the rule is non-obvious and the reason changes how it is applied. Default: none.

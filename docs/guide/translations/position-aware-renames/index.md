# Position-aware renames

Source-as-keys has one classic trap: change `t('Save')` to `t('Save changes')` and you've effectively renamed the key. Most implementations treat that as a delete-and-add — the old entry vanishes, the new one appears empty, and the locale flashes back to English while the new translation lands.

yapyak handles it as a rename instead.

## The mechanism

When a file changes, the plugin compares the **positions** of every `t()` call against the previous extraction. If a string disappeared at line 23, column 12, *and* a new string appeared at the exact same position, that's a rename.

```diff
- t('Save')
+ t('Save changes')
```

```
[yapyak] ↻ "Save" → "Save changes" (rename detected)
[yapyak] es: re-translating…
```

The locale key swaps in place. The old translation value stays attached to the new key as a placeholder while the AI re-translates the new English in the background. When the fresh translation arrives, HMR swaps it in. No window where the entry is missing, no flash of fallback English.

## Why position-based, not similarity-based

Position is **exact**. "Save" and "Cave" have 75% Levenshtein similarity but they're different messages. Edit-distance heuristics produce false positives that silently corrupt translations.

Position match is unambiguous: same place in the source file, you renamed it. Period.

## What counts as a rename

A rename is detected when **all four** conditions hold:

1. A string disappeared at `(line, column)` between saves
2. A new string appeared at the same `(line, column)` in the new save
3. The disappeared string isn't elsewhere in the new file
4. The appeared string isn't elsewhere in the old file

If the disappeared string exists at a different position in the new file → that's a delete + add (the string moved or duplicated).

If multiple positions changed in one save → each change is evaluated independently; renames that match are migrated, the rest are treated as delete/add.

## Cross-locale migration

When a rename is detected, **every** locale file gets the same key swap atomically.

```diff
// locales/es.json
- "Save": "Guardar"
+ "Save changes": "Guardar"

// locales/fr.json
- "Save": "Enregistrer"
+ "Save changes": "Enregistrer"
```

Then auto-translate runs and updates each locale to match the new English:

```diff
- "Save changes": "Guardar"
+ "Save changes": "Guardar cambios"
```

The old translation acts as a placeholder for the one-second window between save and HMR. The user never sees an English flash.

## What about hand-edited translations?

A rename re-translates. If you've hand-tweaked the Spanish for a specific string and want it to survive renames *and* edits, put it in [`glossary`](/guide/translators/anthropic#glossary-example). Glossary entries are forced and AI is instructed to use them verbatim.

That's the one mechanism for locking a translation in yapyak. There's intentionally no per-call-site override flag — every option you add is a mental tax on every user. AI owns the locale files; glossary is the one explicit exception. That's the whole contract.

## Edge cases

**Multiple `t()` calls renamed in one save.** Each rename is matched independently by position.

**Same position, same string, just whitespace edits.** Not a rename. The source string is unchanged.

**File renamed (e.g., `foo.tsx` → `bar.tsx`).** Path-keyed migration, not position-keyed. yapyak's locale files are keyed by file path, so renaming a file moves the entire translation block for that file.

**Multiple strings collapse to one position.** If you delete a `t()` call and another `t()` happens to land at that exact position, it's treated as a rename. False-positive risk, but extremely rare — it requires a delete and an unrelated reformat to coincide on the same line.

## What this enables

- **Refactor copy aggressively.** Change "Save" to "Save changes" to "Save and exit" without losing momentum.
- **A/B copy testing.** Try variants; existing translations follow.
- **Editor-driven workflow.** Treat `t()` literals as regular code — rename them like you rename variables.
- **No locale-file babysitting.** You don't have to update keys in five JSON files when copy changes.

This is the feature you don't notice until you don't have it. Then you notice it screaming.

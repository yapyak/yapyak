# Position-aware renames

Source-as-keys has one classic trap: change `t('Save')` to `t('Save changes')` and you've effectively renamed the key. Naive implementations lose every existing translation — yours, your team's, the AI's careful tone-matched output — and the next pass has to redo the work.

yapyak doesn't.

## The mechanism

When a file changes, the plugin compares the **positions** of every `t()` call against the previous extraction. If a string disappeared at line 23, column 12, *and* a new string appeared at the exact same position, that's not a delete-and-add. That's a rename.

```diff
- t('Save')
+ t('Save changes')
```

```
[yapyak] ↻ "Save" → "Save changes" (rename detected)
[yapyak] es: re-translating…
```

For each detected rename, locale files get the key swapped in place. Existing translations stay as placeholders until the new English re-translates a beat later. No lost work, no orphaned entries.

## Why position-based, not similarity-based

Position is **exact**. "Save" and "Cave" have a 75% Levenshtein similarity but they're different messages. Edit-distance heuristics produce false positives that silently corrupt translations.

Position match is unambiguous: same place in the source file, you renamed it. Period. False positives don't happen because the position is reset by any structural change to the file.

## What counts as a rename

A rename is detected when **all four** conditions hold:

1. A string disappeared at `(line, column)` between saves
2. A new string appeared at the same `(line, column)` in the new save
3. The disappeared string isn't elsewhere in the new file
4. The appeared string isn't elsewhere in the old file

If the same position contained a string before *and* after but the string itself changed → that's a rename.

If the disappeared string also exists at a different position in the new file → that's a delete + add (the string moved or duplicated).

If multiple positions changed in one save (refactor, multi-line edit) → each change is evaluated independently; renames that match are migrated, the rest are treated as delete/add.

## Cross-locale migration

When a rename is detected, **every** locale file gets the same key swap atomically. There's no per-locale staleness — Spanish, French, German, Japanese all migrate together.

```diff
// locales/es.json
- "Save": "Guardar"
+ "Save changes": "Guardar"

// locales/fr.json
- "Save": "Enregistrer"
+ "Save changes": "Enregistrer"
```

Then auto-translate runs and updates each locale's translation to match the new English:

```diff
- "Save changes": "Guardar"
+ "Save changes": "Guardar cambios"
```

Until the new translation lands (a beat later), the old translation stays as a placeholder. Users see "Guardar" briefly, then "Guardar cambios" via HMR. No flash of English, no missing string.

## Edge cases

**Multiple `t()` calls renamed in one save.** Each rename is matched independently by position. If you rename two strings on different lines in the same save, both migrate.

**Same position, same string, just whitespace edits.** Not a rename. The plugin sees the source string is unchanged.

**File renamed (e.g., `foo.tsx` → `bar.tsx`).** This is *path-keyed* migration, not position-keyed. yapyak's locale files are keyed by file path, so renaming a file moves the entire file's translation block. (See [Translations](/guide/translations/) for per-file scoping.)

**Multiple strings collapse to one position.** If you delete a `t()` call and another `t()` happens to land at that exact position, it's treated as a rename. False positive risk, but extremely rare in practice — it requires the delete and the unrelated reformat to coincide on the same line.

**You manually edit the locale JSON.** Manual edits are preserved through renames — the plugin only touches the *key*, not the *value*. Your hand-tweaked Spanish translation stays attached to the new English string until auto-translate decides to refresh it.

## Disabling

You can't disable position-aware renames. If you don't want the migration, edit the JSON manually after the rename — but the cost of the migration is zero translations that didn't deserve to be preserved.

## What this enables

- **Refactor copy aggressively.** Change "Save" to "Save changes" to "Save and exit" without thinking about translation cost.
- **A/B copy testing.** Try variants. Existing translations follow.
- **Editor-driven workflow.** Treat `t()` literals as regular code — rename them like you rename variables.
- **No locale-file babysitting.** You don't have to manually update keys in five JSON files when copy changes.

This is the feature you don't notice until you don't have it. Then you notice it screaming.

---
title: Renames
order: 7
---

When you edit the source string in a `t()` call, yapyak treats it as a rename if both the old and the new string occupy the same position in the same file.

## Detection

Detection is position-based. yapyak compares the AST of the file before and after the change. A removed string at line:column N matched to an added string at the same line:column is recorded as a rename — old source becomes the new source.

Detection is scoped to a single file. Move the call to another file and the rename is not detected: yapyak sees a delete in the original file and an add in the new one.

Comparison is character-exact. Capitalization, punctuation, whitespace, and placeholder changes all count as different strings.

## Strategy

When yapyak detects a rename, it either moves the existing translation to the new key or clears it for re-translation. The choice is `preserveTranslationsOnRename` in your config:

```ts [yapyak.config.ts]
defineConfig({
  preserveTranslationsOnRename: true,
})
```

| Value | Effect |
|---|---|
| `true` | The existing translation moves to the new key. Useful for small edits where meaning is unchanged. |
| `false` | The translation is cleared. A configured *translator* fills it again on save. |

The default depends on your setup: `true` when no translator is configured, `false` when one is. The reason: a project without a translator relies on existing translations, so clearing them on rename would lose work; a project with a translator can safely re-translate.

## Fallback

When a rename is not detected — moved between files, several edits at once, or the position shifted — the translation is moved to local storage in `.yapyak/`. If the same source string appears again, yapyak restores the translation from there.

This recovery is exact-match. yapyak does not guess that similar text has the same meaning.

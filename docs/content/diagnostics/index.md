---
title: Diagnostics
---

yapyak's compiler runs every save and surfaces any problem it finds as a `YAP-` diagnostic — a compile-time warning or error you'll see in your editor and in your terminal. This is the reference: every code, what it means, and how to fix it.

## How diagnostics show up

Three places:

- **Your editor.** TypeScript surfaces them inline through the language service, with the YAP code, the message, and a hint.
- **Your terminal.** Vite logs each diagnostic during dev. The CLI ([`yapyak check`](/guide/cli/check)) prints them with full file/line context.
- **CI output.** The `yapyak check` step fails with a non-zero exit code if any diagnostic with `severity: error` fires.

Each diagnostic has a code, a one-line message, and (for most) a hint suggesting the fix. Codes are stable across versions — once `YAP0017` means "context not literal", that's what it will keep meaning.

## Linking from error messages

Every diagnostic message includes a `See` URL pointing to its docs entry. The URL format is `https://yapyak.dev/reference/yapyak/diagnostics/<code>` — `YAP0017` lives at `https://yapyak.dev/reference/yapyak/diagnostics/YAP0017`, and so on. Click through (or hover in your editor) for the in-context explanation.

---
title: Diagnostics
---

yapyak's compiler runs every save and surfaces any problem it finds as a `YAP-` diagnostic, a compile-time warning or error you'll see in your editor and in your terminal. This is the reference: every code, what it means, and how to fix it.

## How diagnostics show up

Three places:

- **Your editor.** TypeScript surfaces them inline through the language service, with the YAP code, the message, and a hint.
- **Your terminal.** Vite logs each diagnostic during dev. The CLI ([`yapyak check`](/reference/cli/check)) prints them with full file/line context.
- **CI output.** The `yapyak check` step fails with a non-zero exit code if any diagnostic with `severity: error` fires.

Each diagnostic has a code, a one-line message, and (for most) a hint suggesting the fix. Codes are stable across versions: once `YAP0017` means "context not literal", that's what it will keep meaning.

## Linking from error messages

Every diagnostic message includes a `See` URL pointing to its docs entry. The URL format is `https://yapyak.dev/reference/diagnostics/<code>`. For example, `YAP0017` lives at `https://yapyak.dev/reference/diagnostics/YAP0017`. Click through (or hover in your editor) for the in-context explanation.

## Codes by category

### Parser: source argument shape

Things the compiler caught while looking at the `t()` call itself.

- [`YAP0001`](/reference/diagnostics/YAP0001): No source
- [`YAP0002`](/reference/diagnostics/YAP0002): Dynamic template literal
- [`YAP0003`](/reference/diagnostics/YAP0003): Empty source
- [`YAP0004`](/reference/diagnostics/YAP0004): Missing parameter
- [`YAP0005`](/reference/diagnostics/YAP0005): Extra parameter
- [`YAP0006`](/reference/diagnostics/YAP0006): Dynamic parameters

### Placeholder: ICU validation

Things the compiler caught inside an ICU placeholder (`{name}`, `{count, plural, ...}`, etc.).

- [`YAP0007`](/reference/diagnostics/YAP0007): Malformed ICU
- [`YAP0008`](/reference/diagnostics/YAP0008): Missing `other` branch
- [`YAP0009`](/reference/diagnostics/YAP0009): Unsupported feature
- [`YAP0010`](/reference/diagnostics/YAP0010): Kind mismatch
- [`YAP0011`](/reference/diagnostics/YAP0011): Missing in translation
- [`YAP0012`](/reference/diagnostics/YAP0012): Missing in source
- [`YAP0038`](/reference/diagnostics/YAP0038): Missing branch in target
- [`YAP0045`](/reference/diagnostics/YAP0045): Branch unknown
- [`YAP0046`](/reference/diagnostics/YAP0046): Keyword unknown

### Catalog: locale file integrity

Things the compiler caught reading or writing your locale files.

- [`YAP0013`](/reference/diagnostics/YAP0013): Invalid shape
- [`YAP0014`](/reference/diagnostics/YAP0014): Unsafe path
- [`YAP0015`](/reference/diagnostics/YAP0015): Not NFC normalized
- [`YAP0016`](/reference/diagnostics/YAP0016): Invalid JSON
- [`YAP0031`](/reference/diagnostics/YAP0031): Corrupt locale file
- [`YAP0032`](/reference/diagnostics/YAP0032): Corrupt orphan cache
- [`YAP0039`](/reference/diagnostics/YAP0039): Migration fails

### Context: `t.as()` and `t.in()`

- [`YAP0017`](/reference/diagnostics/YAP0017): Context not literal
- [`YAP0018`](/reference/diagnostics/YAP0018): Mixed usage
- [`YAP0019`](/reference/diagnostics/YAP0019): Unused context
- [`YAP0020`](/reference/diagnostics/YAP0020): Captured chain

### Rich text: tag markup

- [`YAP0041`](/reference/diagnostics/YAP0041): Rich-text tag unclosed
- [`YAP0042`](/reference/diagnostics/YAP0042): Rich-text tag mismatched
- [`YAP0043`](/reference/diagnostics/YAP0043): Rich-text tag unopened
- [`YAP0044`](/reference/diagnostics/YAP0044): Rich-text tag name missing

### Runtime: wiring

Things yapyak noticed while running, usually pointing at a setup issue.

- [`YAP0021`](/reference/diagnostics/YAP0021): Runtime not initialized
- [`YAP0022`](/reference/diagnostics/YAP0022): Server-side leak risk
- [`YAP0027`](/reference/diagnostics/YAP0027): Locale listener throws
- [`YAP0030`](/reference/diagnostics/YAP0030): Forced locale invalid
- [`YAP0040`](/reference/diagnostics/YAP0040): Tracker throws

### Persistence

Things related to [persistence strategies](/guide/switching/persistence).

- [`YAP0023`](/reference/diagnostics/YAP0023): Cookie writer missing
- [`YAP0024`](/reference/diagnostics/YAP0024): Local-storage SSR skipped
- [`YAP0025`](/reference/diagnostics/YAP0025): Local-storage write fails
- [`YAP0026`](/reference/diagnostics/YAP0026): URL persistence skipped
- [`YAP0028`](/reference/diagnostics/YAP0028): Locale-set ignored
- [`YAP0029`](/reference/diagnostics/YAP0029): SSR leak risk on `setLocale()`

### Translator

- [`YAP0033`](/reference/diagnostics/YAP0033): Chunk fails
- [`YAP0034`](/reference/diagnostics/YAP0034): Entry shape invalid

### Formatting

- [`YAP0035`](/reference/diagnostics/YAP0035): Unsupported currency
- [`YAP0036`](/reference/diagnostics/YAP0036): Unsupported unit
- [`YAP0037`](/reference/diagnostics/YAP0037): Unsupported time zone

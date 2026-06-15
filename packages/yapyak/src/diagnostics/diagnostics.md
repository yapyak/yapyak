# YAP diagnostic catalog

Authoritative human-readable index of every yapyak diagnostic.
Each entry: `YAP<NNNN>` (`SYMBOLIC_NAME`) followed by a one-sentence description.

Sections group entries by subsystem for readability. Numeric identifiers are sequential and respect allocation order, not section boundaries.

See `agents/typescript/diagnostics.md` for the authoring rules.

## Parser (compile-time)

- `YAP0001` (`PARSER_NO_SOURCE`) — `t()` or `t.as()` called without a source string.
- `YAP0002` (`PARSER_TEMPLATE_LITERAL`) — Source argument is a dynamic template literal.
- `YAP0003` (`PARSER_EMPTY_SOURCE`) — Source string is empty.
- `YAP0004` (`PARSER_MISSING_PARAM`) — Placeholder in source has no matching key in params.
- `YAP0005` (`PARSER_EXTRA_PARAM`) — Params has a key with no matching placeholder in source.
- `YAP0006` (`PARSER_DYNAMIC_PARAMS`) — Params object is dynamic or spread, cannot be statically verified.

## Placeholder parity (compile-time)

- `YAP0007` (`PLACEHOLDER_MALFORMED`) — Placeholder is syntactically malformed.
- `YAP0008` (`PLACEHOLDER_MISSING_OTHER`) — Plural/select/selectordinal placeholder is missing the required `other` branch.
- `YAP0009` (`PLACEHOLDER_UNSUPPORTED`) — Placeholder uses an unsupported ICU feature.
- `YAP0010` (`PLACEHOLDER_KIND_MISMATCH`) — Placeholder kind in target differs from source.
- `YAP0011` (`PLACEHOLDER_MISSING_IN_TARGET`) — Source placeholder is missing from the translation.
- `YAP0012` (`PLACEHOLDER_MISSING_IN_SOURCE`) — Translation placeholder is missing from the source.

## Catalog validation (compile-time)

- `YAP0013` (`CATALOG_INVALID_SHAPE`) — Locale-file entries are not a valid object shape.
- `YAP0014` (`CATALOG_UNSAFE_PATH`) — Locale-file path key is unsafe.
- `YAP0015` (`CATALOG_NOT_NFC`) — Locale-file string is not Unicode NFC.
- `YAP0016` (`CATALOG_INVALID_JSON`) — Locale file is not valid JSON.

## Context / `t.as()` (compile-time)

- `YAP0017` (`CONTEXT_NOT_LITERAL`) — `t.as()` context argument is not a static string literal.
- `YAP0018` (`CONTEXT_MIXED_USAGE`) — Source is used with both `t()` and `t.as()`.
- `YAP0019` (`CONTEXT_UNUSED`) — `t.as()` has no other context to disambiguate from.
- `YAP0020` (`CONTEXT_DYNAMIC_CALL`) — `t.in()` or `t.as()` chained dynamically instead of inline.

## Runtime: initialization and SSR

- `YAP0021` (`RUNTIME_NOT_INITIALIZED`) — Yapyak runtime is not initialized.
- `YAP0022` (`RUNTIME_SSR_LEAK_RISK`) — Read fell back to the shared module-global locale on the server.

## Persistence

- `YAP0023` (`PERSISTENCE_COOKIE_WRITER_MISSING`) — Cookie persistence has no response-writer bound.
- `YAP0024` (`PERSISTENCE_LOCAL_STORAGE_SSR_SKIPPED`) — `local-storage` persistence skipped on the server.
- `YAP0025` (`PERSISTENCE_LOCAL_STORAGE_WRITE_FAILED`) — `local-storage` write threw.
- `YAP0026` (`PERSISTENCE_URL_SKIPPED`) — `url` persistence ignored a setLocale call.

## Runtime: locale state

- `YAP0027` (`LOCALE_LISTENER_THREW`) — Locale subscriber threw during notification.
- `YAP0028` (`LOCALE_SET_IGNORED`) — setLocale call ignored: value not in configured locales.
- `YAP0029` (`LOCALE_SET_SSR_LEAK_RISK`) — setLocale on the server with `none` persistence leaks between requests.
- `YAP0030` (`LOCALE_FORCED_INVALID`) — Forced locale is not a valid BCP 47 tag.

## Catalog: runtime read

- `YAP0031` (`CATALOG_LOCALE_FILE_CORRUPT`) — Locale file failed to read or parse.
- `YAP0032` (`CATALOG_ORPHAN_CACHE_CORRUPT`) — Orphan cache file failed to read or parse.

## Translator runtime

- `YAP0033` (`TRANSLATE_CHUNK_FAILED`) — A batch chunk failed to translate.
- `YAP0034` (`TRANSLATE_ENTRY_SHAPE_INVALID`) — Translator returned an entry with the wrong shape.

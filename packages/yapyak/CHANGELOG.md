# yapyak

## 0.0.10

### Patch Changes

- [`7b7d19b`](https://github.com/yapyak/yapyak/commit/7b7d19b488e9e83ad251be03946568864c48933a) Thanks [@qwuide](https://github.com/qwuide)! - Export a `TextDirection` type naming the `'ltr' | 'rtl'` union that `getTextDirection()` returns. Annotating a variable or parameter that holds a text direction meant retyping the bare union; the return type now carries the name instead.

- [`ebcf3f0`](https://github.com/yapyak/yapyak/commit/ebcf3f0e04264fd00520bac2275fc285d101f353) Thanks [@qwuide](https://github.com/qwuide)! - Rename `preserveTranslationsOnRename` to `preserveTranslationsOnSourceEdit`. The option governs a single case: a source string edited in place, where the existing translation either follows the new string or the string is treated as new. File moves and deleted-then-restored strings are covered by the orphan cache no matter what the option says, so the old name promised more than the option delivered — "rename" reads as a file rename, the one case it never touched. The default is unchanged: `true` without a translator, `false` with one. Setting `preserveTranslationsOnRename` is a type error now; rename the key. Migration steps are in BREAKING.md.

- [`b7852de`](https://github.com/yapyak/yapyak/commit/b7852deef88c33949d9165e1e8466ec4d6aa401a) Thanks [@qwuide](https://github.com/qwuide)! - Send the enclosing attribute name as call-site context. A `t()` call whose value sits in an attribute — `aria-label={t('Pause')}`, `placeholder={t('Search')}` — sent nothing that said so, and the model translated the string as visible copy even though attribute text follows other conventions. At context `'minimal'` and `'rich'` the request now carries `attribute` with the attribute name as written; the field is absent when the call sits in element content. Framework processors supply the name through the new optional `enclosingAttribute` fragment field.

- [`93053a1`](https://github.com/yapyak/yapyak/commit/93053a1c0d039a2906593ab7b4c4e86d65b6bfa5) Thanks [@qwuide](https://github.com/qwuide)! - Move `examples` from `defineConfig` to the translator. Everything that shapes what a translator receives — `context`, `voice`, `glossary` — is a translator option, while the example count sat in `defineConfig` and the config layer reached into `translator.context` to pick its default. `examples` is now an option on the shipped translators and on `createTranslator`: `anthropic({ apiKey, examples: 5 })`. The default is unchanged: `5`, or `0` when the translator's `context` is `'none'`. Setting `examples` in `defineConfig` is a type error now; move the value into the translator's options. Migration steps are in BREAKING.md.

- [`287e33e`](https://github.com/yapyak/yapyak/commit/287e33ed8f526beda2d0c195a0d80d911fea4e54) Thanks [@qwuide](https://github.com/qwuide)! - Rename `syncHtmlLang` to `syncHtmlAttributes` and sync `<html dir>` alongside `<html lang>`. The option kept the language attribute current but left the direction alone, so a right-to-left locale rendered in the wrong direction unless the app set `dir` itself. Enabled, it now writes both attributes on init and on every switch, deriving the direction from the locale's script via likely subtags: `rtl` for Arabic, Hebrew, Thaana and the other right-to-left scripts, `ltr` otherwise. The derivation ships as a new public `getTextDirection(locale)` for rendering the attributes server-side, and the SvelteKit handle now replaces a `%yapyak.dir%` placeholder next to `%yapyak.lang%`. Setting `syncHtmlLang` is a type error now; rename the key. Migration steps are in BREAKING.md.

## 0.0.9

### Patch Changes

- [`0b8aa25`](https://github.com/yapyak/yapyak/commit/0b8aa25dff2a894c96cc1041f40f4e2bb3b798b3) Thanks [@qwuide](https://github.com/qwuide)! - Keep colouring an ICU message after a misspelled argument kind. `tokenizeTemplate` marked nothing after an argument kind it did not know, so an editor lost the colour of the branches, `#` and styles of a message the moment `plural`, `number` or another kind was misspelled. The word in the kind position is marked as the keyword and the branches and styles after it are marked as before; the diagnostic still reports the unknown kind.

## 0.0.8

### Patch Changes

- [`d3ad210`](https://github.com/yapyak/yapyak/commit/d3ad210a72f5068fa52b83654f7725b92f12bf54) Thanks [@qwuide](https://github.com/qwuide)! - Ignore a file in the locales directory whose name is not a valid locale code. Any `.json` file there became a locale on its name alone, so a stray or misspelled file counted as a language: it appeared in coverage, `yapyak check` measured it, and `yapyak translate` filled it with real translations. Only a file named after a valid BCP 47 tag is a locale now, and the rest are left alone. The dev server already warned about such a file and skipped it, so this brings the CLI in line with the plugin. `yapyak add` still rejects an invalid code up front and names the closest one.

- [`9e397d1`](https://github.com/yapyak/yapyak/commit/9e397d17aa18fcbc0791169e7bb4f4082c6e5aa9) Thanks [@qwuide](https://github.com/qwuide)! - Report a translation problem once per file instead of once per call site. `yapyak check` revalidated the same translation for every `t()` call that used the source string, so one misspelled placeholder in a locale file surfaced as two identical errors when the string appeared twice in the same source file. Each source file's translation entry is now checked once. A string used from several files still reports separately for each, because the locale file keys its translations by source file.

- [`620e004`](https://github.com/yapyak/yapyak/commit/620e004a6830525d8f2f7e3a2647a590f0335edd) Thanks [@qwuide](https://github.com/qwuide)! - Report a placeholder name that ICU does not allow as YAP0052. The parser accepted any text between the braces, so `t('Hi {first name}')` extracted a placeholder named `first name` and demanded a params key of that name, while the type level refused it and typed `t()` as taking a single argument. No spelling satisfied both, and the only thing you saw was `Expected 1 arguments, but got 2` with no mention of the placeholder. Such a name now fails the dev server, `yapyak check`, and the build with YAP0052 on the file that holds the call. The params checks stay quiet until the name is valid, the way they already do for a source string that does not parse.

- [`590291f`](https://github.com/yapyak/yapyak/commit/590291f5ce9b50357c5181f5702f0d1007a9123f) Thanks [@qwuide](https://github.com/qwuide)! - Report a translation nothing uses as YAP0053. A locale file kept every entry it was ever given, so a translation left behind by an edited or deleted `t()` call sat there with nothing to say it was dead weight. `yapyak check` now warns on such an entry and points at the line it is written on. The warning does not fail the check, because a leftover entry breaks nothing, and it is skipped for any source file the compiler could not read, so a file with a syntax error never makes its translations look unused.

- [`9d0f071`](https://github.com/yapyak/yapyak/commit/9d0f071e733379dd9fd285f4660cd52ccba089b4) Thanks [@qwuide](https://github.com/qwuide)! - Write the progress of a translation run to `.yapyak/progress.json`, so editors can show it. The dev server, `yapyak translate`, `yapyak retranslate` and `yapyak add` all record when the run started, how many translations it will write, how many are written so far, and every one that failed, then mark the run finished. `readTranslationProgress` and `isTranslationRunning` from `yapyak/compiler/internal` read the file back; a run whose process has exited no longer counts as running.

- [`7afe3de`](https://github.com/yapyak/yapyak/commit/7afe3de8d7355450928f3c513f04b6f1877d7135) Thanks [@qwuide](https://github.com/qwuide)! - Skip the plural-category check for a locale the machine has no plural data for. `Intl.PluralRules` falls back to the machine's default locale for a language it does not know, so a valid but unknown locale code was checked against that locale's categories: YAP0045 could reject a `few` branch that is right for the language, and the verdict changed from machine to machine. Such a locale now passes YAP0045 and the translation gate, and the translator is told to keep the branches of the source.

- [`acc8102`](https://github.com/yapyak/yapyak/commit/acc81020525122cdf97087956b9e428967166bcf) Thanks [@qwuide](https://github.com/qwuide)! - Tell the translator which plural categories each target locale has, and reject a translation that uses one it does not. The prompt asked the model to keep every ICU pattern identical in every locale, so a `selectordinal` with `one two few other` came back with the same four branches for Swedish, whose ordinals only have `one` and `other`, and the locale file then failed `yapyak check` with YAP0045. The prompt now states the rules exactly — keep placeholder names, argument types, `#`, `select` keys and exact matches; use only the target locale's CLDR categories, adding the ones it has and dropping the ones it lacks — and lists the cardinal and ordinal categories per target locale from `Intl.PluralRules`. `autoTranslate` checks the answer against the same categories: a branch the locale lacks is recorded as an error and the stub stays empty, the same way a dropped placeholder is handled today.

- [`975476e`](https://github.com/yapyak/yapyak/commit/975476e4af8e50df9c55331de9675332bae06073) Thanks [@qwuide](https://github.com/qwuide)! - Export `tokenizeTemplate` from `yapyak/compiler/internal`, so editors can colour an ICU message. It splits a source string into the placeholder name, the argument kind, each branch key, `#`, rich-text tag names, and the punctuation between them, to any depth of nesting.

- [`1a9051e`](https://github.com/yapyak/yapyak/commit/1a9051e9d959b77427845499c34ad741a8f6fe17) Thanks [@qwuide](https://github.com/qwuide)! - Point a translation diagnostic at the entry it is about. The checks that compare a translation against its source string named the locale file but carried the range of the `t()` call in the source file, so the position travelled with a diagnostic that belonged to a different file. `validateIcuPairs` now takes the locale file's text and resolves the exact span of the offending translation, which lets an editor underline the broken entry where it is written.

- [`6fae207`](https://github.com/yapyak/yapyak/commit/6fae207d80007c18872a9a69dda6f1ee66da9892) Thanks [@qwuide](https://github.com/qwuide)! - Report a currency code the platform cannot format as YAP0054 instead of failing the build. `{amount, number, currency BTC}` was an error, and the hint it carried told you to check your ICU syntax, which was never the problem. The code is now a warning of its own, the currency reaches the runtime, and the runtime does what it always could: format the number for the locale, append the code, and report YAP0035 once. Codes the standard does not carry, such as those used for crypto, now build. A typo like `EURO` still reports, so read the code before dismissing the warning.

- [`868621d`](https://github.com/yapyak/yapyak/commit/868621d0671f6fa43a74727b25a080de21148d2d) Thanks [@qwuide](https://github.com/qwuide)! - Keep colouring an ICU message after an unclosed `{`. `tokenizeTemplate` marked nothing from an unclosed brace to the end of the message, so an editor lost every colour in the message the moment a brace was typed and got it back only once the brace was closed. The placeholder name, the argument kind, the branch keys and `#` are marked up to the end of the message now; only the missing closing brace goes unmarked, and the diagnostic still reports it.

## 0.0.7

### Patch Changes

- [`28e2993`](https://github.com/yapyak/yapyak/commit/28e2993e0f59cdf7ed5484081c3e02e1cf5bcbd8) Thanks [@qwuide](https://github.com/qwuide)! - Report a misspelled placeholder in a translation as one diagnostic instead of two. A placeholder that matches nothing in the source but closely resembles one now reports YAP0051 with the rename, where it previously reported YAP0011 for the source placeholder with no counterpart and YAP0012 for the translation placeholder with no counterpart. Both of those still report on their own when the names resemble nothing.

- [`1f0fe13`](https://github.com/yapyak/yapyak/commit/1f0fe130ac5c64646145cf4a8388959fe29640f5) Thanks [@qwuide](https://github.com/qwuide)! - Stop reporting params problems when the source string is malformed. An unclosed brace left the placeholder set unknown, and every params key was reported as extra, so the fix in the hint was to delete a correct parameter instead of closing the brace. The malformed source is now the only diagnostic for that call, and params are validated again as soon as the string parses.

- [`e00d698`](https://github.com/yapyak/yapyak/commit/e00d698ff0c565e685e76a98f8d7433fa8fd36ab) Thanks [@qwuide](https://github.com/qwuide)! - Report a misspelled params key as one diagnostic instead of two. A key that matches no placeholder but closely resembles one now reports YAP0049 with the rename, where it previously reported YAP0004 for the placeholder without a value and YAP0005 for the key without a placeholder. The candidate is picked with the rule TypeScript uses for its own spelling suggestions, so both tools name the same key.

- [`89660e1`](https://github.com/yapyak/yapyak/commit/89660e16d182ca681b437fc29cb8ed56467c60a1) Thanks [@qwuide](https://github.com/qwuide)! - Report a translation that does not parse. A locale file value with broken ICU syntax used to be read as a value with no placeholders, so every placeholder in the source was reported as missing from a translation that in fact holds them, and a value that was only braces was accepted without a word. Such a value now reports YAP0050 and the placeholder checks are skipped for that entry. A source string that does not parse skips those checks too, instead of reporting the translation as having placeholders the source lacks.

## 0.0.6

### Patch Changes

- [`ddcdba5`](https://github.com/yapyak/yapyak/commit/ddcdba5e2b9f2a0c85840bb9c4be74125fbdb57d) Thanks [@qwuide](https://github.com/qwuide)! - Read locale files from disk at render time in dev-time SSR via the new `yapyak/dev` subpath. Server-rendered pages now pick up locale file edits on the next request instead of serving stale translations until the dev server restarts.

## 0.0.5

## 0.0.4

## 0.0.3

### Patch Changes

- [`66f1457`](https://github.com/yapyak/yapyak/commit/66f1457345bf62392906e51fe687e488bde430dc) Thanks [@qwuide](https://github.com/qwuide)! - `offsetToOriginalPosition` and `rangeFromOffsets` take string indices, not byte offsets. Their documentation said byte offsets.

- [`4807ab7`](https://github.com/yapyak/yapyak/commit/4807ab79dcd38c2cf764755afc137b0138a9bda7) Thanks [@qwuide](https://github.com/qwuide)! - Invalid fragment segments from a processor fail at intake with the processor's id and the file. A structural mismatch crashed mid-transform with an internal offset error or magic-string's own message.

- [`72c4ff1`](https://github.com/yapyak/yapyak/commit/72c4ff14cdb15b3351a2c01e58bec3880827725e) Thanks [@qwuide](https://github.com/qwuide)! - A `t()` call that shares its attribute or interpolation with other code is replaced in place instead of eliding the whole container. At a single locale `<div :title="t('Hello') + x">` dropped `+ x`, and two calls in one interpolation kept only the last.

- [`d5a21c5`](https://github.com/yapyak/yapyak/commit/d5a21c58a09ed35ce1223595493324a68d1042bb) Thanks [@qwuide](https://github.com/qwuide)! - `Position.offset` is a 0-based string index; `line` and `column` are 1-based. Its documentation said byte offset (1-based).

- [`1d78383`](https://github.com/yapyak/yapyak/commit/1d78383f04db53b0604f55c609c939eb2e28ea62) Thanks [@qwuide](https://github.com/qwuide)! - A processor reports its parser's errors through `ParseSourceResult.diagnostics`. The compiler surfaces each one as a `YAP0048` diagnostic with the parser's message and location, so a file the parser cannot read fails the build instead of silently losing its `t()` calls.

- [`246ea2b`](https://github.com/yapyak/yapyak/commit/246ea2b465f405d133be8cfe60ae8545d502eea6) Thanks [@qwuide](https://github.com/qwuide)! - The processor's `parseFragments` hook is renamed to `parseSource`. The old name read as if fragments were the input; every other `parse*` function in yapyak names the thing being parsed. A custom processor renames the hook, and the `ParseSourceFn` type replaces `ParseFragmentsFn`.

- [`b82db6c`](https://github.com/yapyak/yapyak/commit/b82db6c1eeb8ccda662251a85d29b0831100e36b) Thanks [@qwuide](https://github.com/qwuide)! - `parseSource` returns `{ fragments }` instead of a fragment array. A custom processor wraps its fragment array in the result object: `parseSource: (source) => ({ fragments })`. The `ParseSourceResult` type is exported from `yapyak/processor`.

- [`9756b8e`](https://github.com/yapyak/yapyak/commit/9756b8e7ccdd1173a78d4fc393a5015a53cd1122) Thanks [@qwuide](https://github.com/qwuide)! - `Fragment.language` accepts `tsx`, so a processor can hand the compiler script code that mixes TypeScript syntax with JSX elements.

- [`db2f4ef`](https://github.com/yapyak/yapyak/commit/db2f4ef4306a0b307e243e41154e521375b86db9) Thanks [@qwuide](https://github.com/qwuide)! - `Fragment` carries `segments` instead of `originalOffset`. A segment maps one run of fragment code back to the source file it was taken from, so a processor can emit code that is not a verbatim slice of the file.

  A custom processor replaces `originalOffset: start` with `segments: segmentsFromOffset(code, start)`. The `segmentsFromOffset` function and the `FragmentSegment` type are exported from `yapyak/processor`.

- [`70a100d`](https://github.com/yapyak/yapyak/commit/70a100dec3ffdd7f585b470f432a548af1183549) Thanks [@qwuide](https://github.com/qwuide)! - Import removal counts call-shaped uses of the local name across the whole emitted file, not only the fragment-covered text. A `t()` call in text no fragment covered lost the `yapyak` import it still needed, so the built component crashed at runtime; the import now stays in place.

- [`954fd7b`](https://github.com/yapyak/yapyak/commit/954fd7b7e88840c3f8ef3fd90d88cfcf122f12dd) Thanks [@qwuide](https://github.com/qwuide)! - Import removal counts call-shaped uses in the source text no fragment covers, one region at a time. Overlapping fragments were subtracted twice from a whole-file count, so a call outside every fragment could still lose the `yapyak` import it needed.

- [`961c582`](https://github.com/yapyak/yapyak/commit/961c582c8a6c35f7966876dcfe415cb8493e3f8b) Thanks [@qwuide](https://github.com/qwuide)! - Every text the compiler splices into the built file is read from the source file through the fragment mapping, not from the fragment's own syntax tree. A processor whose fragment code is not a verbatim copy of the source file no longer leaks that code into the output.

## 0.0.2

### Patch Changes

- [`b762202`](https://github.com/yapyak/yapyak/commit/b7622024db3a938ceeeacf2c8c91168c9669aa63) Thanks [@qwuide](https://github.com/qwuide)! - `yapyak add` prints the run command for the package manager that invoked it, instead of always printing `pnpm dev`.

- [`d82fcdb`](https://github.com/yapyak/yapyak/commit/d82fcdbb9013d2c0227fa6c828c953e1ff7111b4) Thanks [@qwuide](https://github.com/qwuide)! - Vite no longer pre-bundles yapyak's runtime modules. The first `vite dev` request stops reloading the page, and React apps stop logging `Invalid hook call` on the first render.

## 0.0.1

### Patch Changes

- [`8823a59`](https://github.com/yapyak/yapyak/commit/8823a59372ae43dcf39578c5177f2d806723cba3) Thanks [@qwuide](https://github.com/qwuide)! - Initial release.

# yapyak

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

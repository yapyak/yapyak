# @yapyak/vite

## 0.0.8

### Patch Changes

- Updated dependencies [[`d3ad210`](https://github.com/yapyak/yapyak/commit/d3ad210a72f5068fa52b83654f7725b92f12bf54), [`9e397d1`](https://github.com/yapyak/yapyak/commit/9e397d17aa18fcbc0791169e7bb4f4082c6e5aa9), [`620e004`](https://github.com/yapyak/yapyak/commit/620e004a6830525d8f2f7e3a2647a590f0335edd), [`590291f`](https://github.com/yapyak/yapyak/commit/590291f5ce9b50357c5181f5702f0d1007a9123f), [`9d0f071`](https://github.com/yapyak/yapyak/commit/9d0f071e733379dd9fd285f4660cd52ccba089b4), [`7afe3de`](https://github.com/yapyak/yapyak/commit/7afe3de8d7355450928f3c513f04b6f1877d7135), [`acc8102`](https://github.com/yapyak/yapyak/commit/acc81020525122cdf97087956b9e428967166bcf), [`975476e`](https://github.com/yapyak/yapyak/commit/975476e4af8e50df9c55331de9675332bae06073), [`1a9051e`](https://github.com/yapyak/yapyak/commit/1a9051e9d959b77427845499c34ad741a8f6fe17), [`6fae207`](https://github.com/yapyak/yapyak/commit/6fae207d80007c18872a9a69dda6f1ee66da9892), [`868621d`](https://github.com/yapyak/yapyak/commit/868621d0671f6fa43a74727b25a080de21148d2d)]:
  - yapyak@0.0.8

## 0.0.7

### Patch Changes

- [`837fe2c`](https://github.com/yapyak/yapyak/commit/837fe2c2cd82741693564fbadb02a92f8ca3dc14) Thanks [@qwuide](https://github.com/qwuide)! - Leave a source file that does not parse to the framework plugin. yapyak transforms raw files before the framework compiler runs, so a syntax error in a `.svelte` or `.astro` file failed the yapyak transform first and the file never reached the plugin that reports such errors well. The dev overlay named yapyak for a mistake in your own file, without the code frame the framework would have shown, and it did so on every keystroke that left the file briefly invalid. The parse failure is now skipped in the bundler and the file passes through untouched. `yapyak check` still reports it, since there no other tool reads the file.

- [`fc2ce49`](https://github.com/yapyak/yapyak/commit/fc2ce49547c4dd8749cac494c933008f6b19f14f) Thanks [@qwuide](https://github.com/qwuide)! - Keep the messages of a source file that stops parsing. Saving a file with a syntax error read as a file holding no messages, so its translations were moved out of the locale files into the orphan cache and back again on the next working save. The dev server now leaves such a file alone until it parses, and the locale files stay untouched while you fix the syntax.

- Updated dependencies [[`28e2993`](https://github.com/yapyak/yapyak/commit/28e2993e0f59cdf7ed5484081c3e02e1cf5bcbd8), [`1f0fe13`](https://github.com/yapyak/yapyak/commit/1f0fe130ac5c64646145cf4a8388959fe29640f5), [`e00d698`](https://github.com/yapyak/yapyak/commit/e00d698ff0c565e685e76a98f8d7433fa8fd36ab), [`89660e1`](https://github.com/yapyak/yapyak/commit/89660e16d182ca681b437fc29cb8ed56467c60a1)]:
  - yapyak@0.0.7

## 0.0.6

### Patch Changes

- [`3019f62`](https://github.com/yapyak/yapyak/commit/3019f627b66265c100454f9e7c86439e903fbf81) Thanks [@qwuide](https://github.com/qwuide)! - Invalidate every module graph — including the client — when a locale file changes, instead of force-reloading server environments. Reloaded pages no longer hydrate with stale cached translations, and Astro's dev server no longer breaks on locale file saves.

- [`ddcdba5`](https://github.com/yapyak/yapyak/commit/ddcdba5e2b9f2a0c85840bb9c4be74125fbdb57d) Thanks [@qwuide](https://github.com/qwuide)! - Read locale files from disk at render time in dev-time SSR via the new `yapyak/dev` subpath. Server-rendered pages now pick up locale file edits on the next request instead of serving stale translations until the dev server restarts.

- Updated dependencies [[`ddcdba5`](https://github.com/yapyak/yapyak/commit/ddcdba5e2b9f2a0c85840bb9c4be74125fbdb57d)]:
  - yapyak@0.0.6

## 0.0.5

### Patch Changes

- [`0a642a7`](https://github.com/yapyak/yapyak/commit/0a642a79fda9329607e8589dfd122280cda1198f) Thanks [@qwuide](https://github.com/qwuide)! - Fix server-rendered pages keeping the source string after a translation arrives.

  The dev server refreshed its own catalog and patched the browser, but left the server environments holding the module they had evaluated before the translation landed. Server-rendered apps kept the untranslated string until the dev server restarted.

- Updated dependencies []:
  - yapyak@0.0.5

## 0.0.4

### Patch Changes

- Updated dependencies []:
  - yapyak@0.0.4

## 0.0.3

### Patch Changes

- Updated dependencies [[`66f1457`](https://github.com/yapyak/yapyak/commit/66f1457345bf62392906e51fe687e488bde430dc), [`4807ab7`](https://github.com/yapyak/yapyak/commit/4807ab79dcd38c2cf764755afc137b0138a9bda7), [`72c4ff1`](https://github.com/yapyak/yapyak/commit/72c4ff14cdb15b3351a2c01e58bec3880827725e), [`d5a21c5`](https://github.com/yapyak/yapyak/commit/d5a21c58a09ed35ce1223595493324a68d1042bb), [`1d78383`](https://github.com/yapyak/yapyak/commit/1d78383f04db53b0604f55c609c939eb2e28ea62), [`246ea2b`](https://github.com/yapyak/yapyak/commit/246ea2b465f405d133be8cfe60ae8545d502eea6), [`b82db6c`](https://github.com/yapyak/yapyak/commit/b82db6c1eeb8ccda662251a85d29b0831100e36b), [`9756b8e`](https://github.com/yapyak/yapyak/commit/9756b8e7ccdd1173a78d4fc393a5015a53cd1122), [`db2f4ef`](https://github.com/yapyak/yapyak/commit/db2f4ef4306a0b307e243e41154e521375b86db9), [`70a100d`](https://github.com/yapyak/yapyak/commit/70a100dec3ffdd7f585b470f432a548af1183549), [`954fd7b`](https://github.com/yapyak/yapyak/commit/954fd7b7e88840c3f8ef3fd90d88cfcf122f12dd), [`961c582`](https://github.com/yapyak/yapyak/commit/961c582c8a6c35f7966876dcfe415cb8493e3f8b)]:
  - yapyak@0.0.3

## 0.0.2

### Patch Changes

- [`d82fcdb`](https://github.com/yapyak/yapyak/commit/d82fcdbb9013d2c0227fa6c828c953e1ff7111b4) Thanks [@qwuide](https://github.com/qwuide)! - Vite no longer pre-bundles yapyak's runtime modules. The first `vite dev` request stops reloading the page, and React apps stop logging `Invalid hook call` on the first render.

- Updated dependencies [[`b762202`](https://github.com/yapyak/yapyak/commit/b7622024db3a938ceeeacf2c8c91168c9669aa63), [`d82fcdb`](https://github.com/yapyak/yapyak/commit/d82fcdbb9013d2c0227fa6c828c953e1ff7111b4)]:
  - yapyak@0.0.2

## 0.0.1

### Patch Changes

- [`8823a59`](https://github.com/yapyak/yapyak/commit/8823a59372ae43dcf39578c5177f2d806723cba3) Thanks [@qwuide](https://github.com/qwuide)! - Initial release.

- Updated dependencies [[`8823a59`](https://github.com/yapyak/yapyak/commit/8823a59372ae43dcf39578c5177f2d806723cba3)]:
  - yapyak@0.0.1

# @yapyak/astro

## 0.0.3

### Patch Changes

- [`d42bc12`](https://github.com/yapyak/yapyak/commit/d42bc12cee6044730c9e5f9664698c7e3d111a3e) Thanks [@qwuide](https://github.com/qwuide)! - Frontmatter detection follows the Astro compiler instead of a regex. A byte order mark or whitespace around the opening fence made the processor treat the whole file as script, so every `t()` call in it was left in the built page.

- [`029d509`](https://github.com/yapyak/yapyak/commit/029d509505f45123f854232026ec4e119927bb85) Thanks [@qwuide](https://github.com/qwuide)! - A `t()` call that follows an element in the same expression is extracted and rewritten. `<p>{flag ? <b>{t('Hello')}</b> : t('Cancel')}</p>` dropped the second call, left it in the built page, and removed the `yapyak` import it still needed.

- [`e307aa5`](https://github.com/yapyak/yapyak/commit/e307aa59659a1de5bdc186a652d997e33fe7d790) Thanks [@qwuide](https://github.com/qwuide)! - A `t()` call inside a frontmatter JSX element is extracted and rewritten. Frontmatter parsed as plain TypeScript, so `const banner = <p>{t('Hello')}</p>;` read as a type assertion and the call was silently skipped.

- [`8172d12`](https://github.com/yapyak/yapyak/commit/8172d12e58961c50bd51ff31262535d74cc0de53) Thanks [@qwuide](https://github.com/qwuide)! - The Astro compiler's parse errors surface as `YAP0048` diagnostics in files with frontmatter. A file the compiler could not fully parse dropped `t()` calls and removed imports with no signal; the same file now fails the build with the compiler's message and location. A file without frontmatter keeps the whole-file script fallback, where no `t()` call can be lost.

- [`4715fc9`](https://github.com/yapyak/yapyak/commit/4715fc9f5c4081c63ff9205ffddb7f0c80d500ab) Thanks [@qwuide](https://github.com/qwuide)! - The `yapyak()` Astro integration takes options. `fixedLocale` is reachable from `astro.config.ts`, so an Astro build can target a single locale.

- [`0ac6c34`](https://github.com/yapyak/yapyak/commit/0ac6c348ee5c34be98be495d1f5347151f0410ce) Thanks [@qwuide](https://github.com/qwuide)! - The Astro compiler reports byte offsets. The processor converts them to string indices, so a non-ASCII character no longer drops every `t()` call that follows it. A single accented character in frontmatter dropped every source string in the file.

- Updated dependencies [[`66f1457`](https://github.com/yapyak/yapyak/commit/66f1457345bf62392906e51fe687e488bde430dc), [`4807ab7`](https://github.com/yapyak/yapyak/commit/4807ab79dcd38c2cf764755afc137b0138a9bda7), [`72c4ff1`](https://github.com/yapyak/yapyak/commit/72c4ff14cdb15b3351a2c01e58bec3880827725e), [`d5a21c5`](https://github.com/yapyak/yapyak/commit/d5a21c58a09ed35ce1223595493324a68d1042bb), [`1d78383`](https://github.com/yapyak/yapyak/commit/1d78383f04db53b0604f55c609c939eb2e28ea62), [`246ea2b`](https://github.com/yapyak/yapyak/commit/246ea2b465f405d133be8cfe60ae8545d502eea6), [`b82db6c`](https://github.com/yapyak/yapyak/commit/b82db6c1eeb8ccda662251a85d29b0831100e36b), [`9756b8e`](https://github.com/yapyak/yapyak/commit/9756b8e7ccdd1173a78d4fc393a5015a53cd1122), [`db2f4ef`](https://github.com/yapyak/yapyak/commit/db2f4ef4306a0b307e243e41154e521375b86db9), [`70a100d`](https://github.com/yapyak/yapyak/commit/70a100dec3ffdd7f585b470f432a548af1183549), [`954fd7b`](https://github.com/yapyak/yapyak/commit/954fd7b7e88840c3f8ef3fd90d88cfcf122f12dd), [`961c582`](https://github.com/yapyak/yapyak/commit/961c582c8a6c35f7966876dcfe415cb8493e3f8b)]:
  - yapyak@0.0.3
  - @yapyak/vite@0.0.3

## 0.0.2

### Patch Changes

- Updated dependencies [[`b762202`](https://github.com/yapyak/yapyak/commit/b7622024db3a938ceeeacf2c8c91168c9669aa63), [`d82fcdb`](https://github.com/yapyak/yapyak/commit/d82fcdbb9013d2c0227fa6c828c953e1ff7111b4)]:
  - yapyak@0.0.2
  - @yapyak/vite@0.0.2

## 0.0.1

### Patch Changes

- [`8823a59`](https://github.com/yapyak/yapyak/commit/8823a59372ae43dcf39578c5177f2d806723cba3) Thanks [@qwuide](https://github.com/qwuide)! - Initial release.

- Updated dependencies [[`8823a59`](https://github.com/yapyak/yapyak/commit/8823a59372ae43dcf39578c5177f2d806723cba3)]:
  - yapyak@0.0.1
  - @yapyak/vite@0.0.1

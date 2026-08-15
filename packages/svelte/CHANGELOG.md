# @yapyak/svelte

## 0.0.7

### Patch Changes

- Updated dependencies [[`28e2993`](https://github.com/yapyak/yapyak/commit/28e2993e0f59cdf7ed5484081c3e02e1cf5bcbd8), [`1f0fe13`](https://github.com/yapyak/yapyak/commit/1f0fe130ac5c64646145cf4a8388959fe29640f5), [`e00d698`](https://github.com/yapyak/yapyak/commit/e00d698ff0c565e685e76a98f8d7433fa8fd36ab), [`89660e1`](https://github.com/yapyak/yapyak/commit/89660e16d182ca681b437fc29cb8ed56467c60a1)]:
  - yapyak@0.0.7

## 0.0.6

### Patch Changes

- Updated dependencies [[`ddcdba5`](https://github.com/yapyak/yapyak/commit/ddcdba5e2b9f2a0c85840bb9c4be74125fbdb57d)]:
  - yapyak@0.0.6

## 0.0.5

### Patch Changes

- Updated dependencies []:
  - yapyak@0.0.5

## 0.0.4

### Patch Changes

- [`3cbb9e9`](https://github.com/yapyak/yapyak/commit/3cbb9e930bc1787c0630c29366789ecf9ca5d2af) Thanks [@qwuide](https://github.com/qwuide)! - Fix the dev server failing to start with `js_parse_error: Unexpected token`.

  The package shipped its runtime entries as TypeScript source, which Vite's dependency optimizer compiles with no TypeScript step. It now ships compiled JavaScript, built with `svelte-package`.

- Updated dependencies []:
  - yapyak@0.0.4

## 0.0.3

### Patch Changes

- [`a86e6f9`](https://github.com/yapyak/yapyak/commit/a86e6f92efa16fdb9245162d3bf5cf54413b8477) Thanks [@qwuide](https://github.com/qwuide)! - A `t()` call in an `{#snippet}` parameter default is extracted and rewritten. `{#snippet greet(label = t('Save'))}` left the call in the built component and removed the `yapyak` import it still needed.

- [`b12b7d7`](https://github.com/yapyak/yapyak/commit/b12b7d717ca449323cf5cc0313b07205e1c78054) Thanks [@qwuide](https://github.com/qwuide)! - A `t()` call in an `{#await}` then or catch pattern is extracted and rewritten. `{#await p then { label = t('Save') }}` left the call in the built component and removed the `yapyak` import it still needed.

- [`5b9faea`](https://github.com/yapyak/yapyak/commit/5b9faea963fa37329f504993b55439bf7fb39e50) Thanks [@qwuide](https://github.com/qwuide)! - A `t()` call in an `{#each}` context pattern is extracted and rewritten. `{#each items as { label = t('Save') }}` left the call in the built component and removed the `yapyak` import it still needed.

- [`a6c4f47`](https://github.com/yapyak/yapyak/commit/a6c4f47e365dc05267cc3c09e5a399a84c631e31) Thanks [@qwuide](https://github.com/qwuide)! - The Svelte compiler's parse errors surface as `YAP0048` diagnostics. A file the compiler could not parse crashed the whole scan with a raw error naming no file; the same file now fails the build with the compiler's message and location.

- Updated dependencies [[`66f1457`](https://github.com/yapyak/yapyak/commit/66f1457345bf62392906e51fe687e488bde430dc), [`4807ab7`](https://github.com/yapyak/yapyak/commit/4807ab79dcd38c2cf764755afc137b0138a9bda7), [`72c4ff1`](https://github.com/yapyak/yapyak/commit/72c4ff14cdb15b3351a2c01e58bec3880827725e), [`d5a21c5`](https://github.com/yapyak/yapyak/commit/d5a21c58a09ed35ce1223595493324a68d1042bb), [`1d78383`](https://github.com/yapyak/yapyak/commit/1d78383f04db53b0604f55c609c939eb2e28ea62), [`246ea2b`](https://github.com/yapyak/yapyak/commit/246ea2b465f405d133be8cfe60ae8545d502eea6), [`b82db6c`](https://github.com/yapyak/yapyak/commit/b82db6c1eeb8ccda662251a85d29b0831100e36b), [`9756b8e`](https://github.com/yapyak/yapyak/commit/9756b8e7ccdd1173a78d4fc393a5015a53cd1122), [`db2f4ef`](https://github.com/yapyak/yapyak/commit/db2f4ef4306a0b307e243e41154e521375b86db9), [`70a100d`](https://github.com/yapyak/yapyak/commit/70a100dec3ffdd7f585b470f432a548af1183549), [`954fd7b`](https://github.com/yapyak/yapyak/commit/954fd7b7e88840c3f8ef3fd90d88cfcf122f12dd), [`961c582`](https://github.com/yapyak/yapyak/commit/961c582c8a6c35f7966876dcfe415cb8493e3f8b)]:
  - yapyak@0.0.3

## 0.0.2

### Patch Changes

- Updated dependencies [[`b762202`](https://github.com/yapyak/yapyak/commit/b7622024db3a938ceeeacf2c8c91168c9669aa63), [`d82fcdb`](https://github.com/yapyak/yapyak/commit/d82fcdbb9013d2c0227fa6c828c953e1ff7111b4)]:
  - yapyak@0.0.2

## 0.0.1

### Patch Changes

- [`8823a59`](https://github.com/yapyak/yapyak/commit/8823a59372ae43dcf39578c5177f2d806723cba3) Thanks [@qwuide](https://github.com/qwuide)! - Initial release.

- Updated dependencies [[`8823a59`](https://github.com/yapyak/yapyak/commit/8823a59372ae43dcf39578c5177f2d806723cba3)]:
  - yapyak@0.0.1

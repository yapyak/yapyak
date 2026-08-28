# @yapyak/astro

## 0.0.13

### Patch Changes

- Updated dependencies []:
  - yapyak@0.0.13
  - @yapyak/vite@0.0.13

## 0.0.12

### Patch Changes

- [`c66b92a`](https://github.com/yapyak/yapyak/commit/c66b92a8f57ef242d57ed76588cd252ffe349b48) Thanks [@qwuide](https://github.com/qwuide)! - Add a top-level `types` field beside `exports` in every published package. Tools that reference the package directory rather than the bare specifier — a relativized `typeof import()` in a generated declaration, a tsconfig `paths` entry pointing at the package root — now resolve the types instead of silently landing on `any`.

- Updated dependencies [[`3f650aa`](https://github.com/yapyak/yapyak/commit/3f650aadff02816ae37bded75c31b583b8e7879a), [`3f43a37`](https://github.com/yapyak/yapyak/commit/3f43a37623ab3d8f4ef5ef90d69945a2094be49a), [`5adeaa9`](https://github.com/yapyak/yapyak/commit/5adeaa953ccf94919078c529976d23311fc40837), [`56dcc76`](https://github.com/yapyak/yapyak/commit/56dcc76871dae9fe6c9fd0fc4bec00339bd2e827), [`5b3afcf`](https://github.com/yapyak/yapyak/commit/5b3afcfc4b78342eeedacf1d1b123281a54e8e57), [`91b135c`](https://github.com/yapyak/yapyak/commit/91b135c728219863c49fe40dfa6328d022443995), [`c66b92a`](https://github.com/yapyak/yapyak/commit/c66b92a8f57ef242d57ed76588cd252ffe349b48), [`1ed9529`](https://github.com/yapyak/yapyak/commit/1ed9529145dc146ee4b6461ca6f42ee5480390e3)]:
  - yapyak@0.0.12
  - @yapyak/vite@0.0.12

## 0.0.11

### Patch Changes

- Updated dependencies [[`3cccfd0`](https://github.com/yapyak/yapyak/commit/3cccfd0bf301d10d3ad4eb25a95dfdbf26b33e9c), [`c6798e7`](https://github.com/yapyak/yapyak/commit/c6798e73a04279f6732aad0d6649e9c2e685c03f)]:
  - yapyak@0.0.11
  - @yapyak/vite@0.0.11

## 0.0.10

### Patch Changes

- [`f335c63`](https://github.com/yapyak/yapyak/commit/f335c63b02a910a09bcfdee6e4042aeb17aadc05) Thanks [@qwuide](https://github.com/qwuide)! - Supply the enclosing attribute name from template attributes. A `t()` call in an attribute expression — `title={t('Save changes')}` — now carries `title` as call-site context; element content carries nothing.

- Updated dependencies [[`7b7d19b`](https://github.com/yapyak/yapyak/commit/7b7d19b488e9e83ad251be03946568864c48933a), [`ebcf3f0`](https://github.com/yapyak/yapyak/commit/ebcf3f0e04264fd00520bac2275fc285d101f353), [`b7852de`](https://github.com/yapyak/yapyak/commit/b7852deef88c33949d9165e1e8466ec4d6aa401a), [`93053a1`](https://github.com/yapyak/yapyak/commit/93053a1c0d039a2906593ab7b4c4e86d65b6bfa5), [`287e33e`](https://github.com/yapyak/yapyak/commit/287e33ed8f526beda2d0c195a0d80d911fea4e54)]:
  - yapyak@0.0.10
  - @yapyak/vite@0.0.10

## 0.0.9

### Patch Changes

- Updated dependencies [[`0b8aa25`](https://github.com/yapyak/yapyak/commit/0b8aa25dff2a894c96cc1041f40f4e2bb3b798b3)]:
  - yapyak@0.0.9
  - @yapyak/vite@0.0.9

## 0.0.8

### Patch Changes

- Updated dependencies [[`d3ad210`](https://github.com/yapyak/yapyak/commit/d3ad210a72f5068fa52b83654f7725b92f12bf54), [`9e397d1`](https://github.com/yapyak/yapyak/commit/9e397d17aa18fcbc0791169e7bb4f4082c6e5aa9), [`620e004`](https://github.com/yapyak/yapyak/commit/620e004a6830525d8f2f7e3a2647a590f0335edd), [`590291f`](https://github.com/yapyak/yapyak/commit/590291f5ce9b50357c5181f5702f0d1007a9123f), [`9d0f071`](https://github.com/yapyak/yapyak/commit/9d0f071e733379dd9fd285f4660cd52ccba089b4), [`7afe3de`](https://github.com/yapyak/yapyak/commit/7afe3de8d7355450928f3c513f04b6f1877d7135), [`acc8102`](https://github.com/yapyak/yapyak/commit/acc81020525122cdf97087956b9e428967166bcf), [`975476e`](https://github.com/yapyak/yapyak/commit/975476e4af8e50df9c55331de9675332bae06073), [`1a9051e`](https://github.com/yapyak/yapyak/commit/1a9051e9d959b77427845499c34ad741a8f6fe17), [`6fae207`](https://github.com/yapyak/yapyak/commit/6fae207d80007c18872a9a69dda6f1ee66da9892), [`868621d`](https://github.com/yapyak/yapyak/commit/868621d0671f6fa43a74727b25a080de21148d2d)]:
  - yapyak@0.0.8
  - @yapyak/vite@0.0.8

## 0.0.7

### Patch Changes

- Updated dependencies [[`28e2993`](https://github.com/yapyak/yapyak/commit/28e2993e0f59cdf7ed5484081c3e02e1cf5bcbd8), [`837fe2c`](https://github.com/yapyak/yapyak/commit/837fe2c2cd82741693564fbadb02a92f8ca3dc14), [`fc2ce49`](https://github.com/yapyak/yapyak/commit/fc2ce49547c4dd8749cac494c933008f6b19f14f), [`1f0fe13`](https://github.com/yapyak/yapyak/commit/1f0fe130ac5c64646145cf4a8388959fe29640f5), [`e00d698`](https://github.com/yapyak/yapyak/commit/e00d698ff0c565e685e76a98f8d7433fa8fd36ab), [`89660e1`](https://github.com/yapyak/yapyak/commit/89660e16d182ca681b437fc29cb8ed56467c60a1)]:
  - yapyak@0.0.7
  - @yapyak/vite@0.0.7

## 0.0.6

### Patch Changes

- Updated dependencies [[`3019f62`](https://github.com/yapyak/yapyak/commit/3019f627b66265c100454f9e7c86439e903fbf81), [`ddcdba5`](https://github.com/yapyak/yapyak/commit/ddcdba5e2b9f2a0c85840bb9c4be74125fbdb57d)]:
  - @yapyak/vite@0.0.6
  - yapyak@0.0.6

## 0.0.5

### Patch Changes

- Updated dependencies [[`0a642a7`](https://github.com/yapyak/yapyak/commit/0a642a79fda9329607e8589dfd122280cda1198f)]:
  - @yapyak/vite@0.0.5
  - yapyak@0.0.5

## 0.0.4

### Patch Changes

- Updated dependencies []:
  - yapyak@0.0.4
  - @yapyak/vite@0.0.4

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

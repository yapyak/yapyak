import type { Options } from 'tsup';

export function defineConfig(overrides: Options): Options {
  return {
    clean: true,
    dts: true,
    format: 'esm',
    ...overrides,
  };
}

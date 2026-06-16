import type { UserConfig } from 'tsdown';

export function defineConfig(overrides: UserConfig): UserConfig {
  return {
    clean: true,
    dts: true,
    fixedExtension: false,
    format: 'esm',
    treeshake: {
      moduleSideEffects: 'no-external',
    },
    ...overrides,
  };
}

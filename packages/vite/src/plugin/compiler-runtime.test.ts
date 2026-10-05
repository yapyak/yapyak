import { describe, expect, it, vi } from 'vitest';
import { normalizeYapyakConfig } from 'yapyak/config/internal';
import { createProcessor } from 'yapyak/processor';

import { createCompilerRuntimePlugin } from './compiler-runtime';
import { createState } from './state';

const COMPILER_RUNTIME_ID =
  '/project/node_modules/@yapyak/react/dist/compiler-runtime/internal.js';

type ResolveIdFn = (
  this: {
    resolve: (
      source: string,
      importer: string | undefined,
      options: {
        skipSelf: boolean;
      },
    ) => Promise<{
      id: string;
    } | null>;
  },
  source: string,
  importer: string | undefined,
) => Promise<string | null>;

function buildState(filter: (fileId: string) => boolean = () => true) {
  const state = createState({
    root: '/project',
  });
  state.filter = filter;
  state.normalized = normalizeYapyakConfig({
    processors: [
      createProcessor({
        extensions: [
          '.tsx',
        ],
        id: 'react',
        runtime: {
          compilerRuntime: {
            module: '@yapyak/react/compiler-runtime/internal',
            specifiers: [
              'react/compiler-runtime',
            ],
          },
          module: '@yapyak/react/internal',
        },
      }),
    ],
  });
  return state;
}

function buildResolve(id: string | null) {
  return vi.fn(async () =>
    id === null
      ? null
      : {
          id,
        },
  );
}

describe('createCompilerRuntimePlugin', () => {
  it('returns a plugin that runs before other plugins', () => {
    expect(createCompilerRuntimePlugin(buildState()).enforce).toBe('pre');
  });

  it('resolves a compiler-runtime specifier to the processor module', async () => {
    const plugin = createCompilerRuntimePlugin(buildState());
    const resolve = buildResolve(COMPILER_RUNTIME_ID);

    const result = await (plugin.resolveId as ResolveIdFn).call(
      {
        resolve,
      },
      'react/compiler-runtime',
      '/project/src/a.tsx',
    );

    expect(result).toBe(COMPILER_RUNTIME_ID);
    expect(resolve).toHaveBeenCalledWith(
      '@yapyak/react/compiler-runtime/internal',
      '/project/src/a.tsx',
      {
        skipSelf: true,
      },
    );
  });

  it('returns `null` for a specifier no processor claims', async () => {
    const plugin = createCompilerRuntimePlugin(buildState());
    const resolve = buildResolve(COMPILER_RUNTIME_ID);

    const result = await (plugin.resolveId as ResolveIdFn).call(
      {
        resolve,
      },
      'react',
      '/project/src/a.tsx',
    );

    expect(result).toBeNull();
    expect(resolve).not.toHaveBeenCalled();
  });

  it('returns `null` without an importer', async () => {
    const plugin = createCompilerRuntimePlugin(buildState());
    const resolve = buildResolve(COMPILER_RUNTIME_ID);

    const result = await (plugin.resolveId as ResolveIdFn).call(
      {
        resolve,
      },
      'react/compiler-runtime',
      undefined,
    );

    expect(result).toBeNull();
    expect(resolve).not.toHaveBeenCalled();
  });

  it('returns `null` for an importer the filter rejects', async () => {
    const plugin = createCompilerRuntimePlugin(
      buildState((fileId) => fileId === 'src/a.tsx'),
    );
    const resolve = buildResolve(COMPILER_RUNTIME_ID);

    const result = await (plugin.resolveId as ResolveIdFn).call(
      {
        resolve,
      },
      'react/compiler-runtime',
      '/project/node_modules/compiled-library/dist/index.js',
    );

    expect(result).toBeNull();
    expect(resolve).not.toHaveBeenCalled();
  });

  it('returns `null` when the processor module imports the specifier itself', async () => {
    const plugin = createCompilerRuntimePlugin(buildState());

    const result = await (plugin.resolveId as ResolveIdFn).call(
      {
        resolve: buildResolve(COMPILER_RUNTIME_ID),
      },
      'react/compiler-runtime',
      COMPILER_RUNTIME_ID,
    );

    expect(result).toBeNull();
  });

  it('returns `null` when the processor module does not resolve', async () => {
    const plugin = createCompilerRuntimePlugin(buildState());

    const result = await (plugin.resolveId as ResolveIdFn).call(
      {
        resolve: buildResolve(null),
      },
      'react/compiler-runtime',
      '/project/src/a.tsx',
    );

    expect(result).toBeNull();
  });
});

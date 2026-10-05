import type { Plugin } from 'vite';
import type { CompilerRuntime, Processor } from 'yapyak/processor';
import type { State } from './state';

import { isCandidateId } from './candidate-id';
import { getNormalized } from './state';

export function createCompilerRuntimePlugin(state: State): Plugin {
  return {
    enforce: 'pre',
    name: 'yapyak:compiler-runtime',
    async resolveId(
      source: string,
      importer: string | undefined,
    ): Promise<string | null> {
      const compilerRuntime = findCompilerRuntime(
        getNormalized(state).processors,
        source,
      );
      if (
        compilerRuntime === undefined ||
        importer === undefined ||
        !isCandidateId(importer, state.filter, state.projectRoot)
      ) {
        return null;
      }
      const resolved = await this.resolve(compilerRuntime.module, importer, {
        skipSelf: true,
      });
      if (resolved === null || resolved.id === importer) {
        return null;
      }
      return resolved.id;
    },
  };
}

function findCompilerRuntime(
  processors: Processor[],
  source: string,
): CompilerRuntime | undefined {
  for (const processor of processors) {
    const compilerRuntime = processor.runtime?.compilerRuntime;
    if (compilerRuntime?.specifiers.includes(source)) {
      return compilerRuntime;
    }
  }
  return undefined;
}

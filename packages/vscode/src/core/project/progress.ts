import type { TranslationProgress } from 'yapyak/compiler/internal';
import type { Project } from './resolve';

export function readProjectProgress(
  project: Project,
): TranslationProgress | undefined {
  const { compiler, root } = project;
  return compiler.readTranslationProgress(compiler.getDefaultYapyakDir(root));
}

import type { ExtractedMessage } from 'yapyak/compiler/internal';
import type { Project } from './resolve';

const YAPYAK_MODULE = 'yapyak';

export type ResolveProjectMessagesResult = {
  messages: ExtractedMessage[];
  sourceFileIds: string[];
};

const resultsByRoot = new Map<string, ResolveProjectMessagesResult>();

export function resolveProjectMessages(
  project: Project,
): ResolveProjectMessagesResult {
  let result = resultsByRoot.get(project.root);
  if (result === undefined) {
    result = collectMessages(project);
    resultsByRoot.set(project.root, result);
  }
  return result;
}

export function invalidateProjectMessages(root: string): void {
  resultsByRoot.delete(root);
}

function collectMessages(project: Project): ResolveProjectMessagesResult {
  const { compiler, config, configModule, root } = project;
  const filter = configModule.createFilter(config.include, config.exclude);
  const messages: ExtractedMessage[] = [];
  const sourceFileIds: string[] = [];
  for (const file of compiler.walkSourceFiles(filter, root)) {
    if (!file.code.includes(YAPYAK_MODULE)) {
      sourceFileIds.push(file.fileId);
      continue;
    }
    const extracted = compiler.extractFile(file.fileId, file.code, {
      processors: config.processors,
    });
    const isParsed = !extracted.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === compiler.YAP_COMPILE.PROCESSOR_PARSE_ERROR.code,
    );
    if (isParsed) {
      sourceFileIds.push(file.fileId);
    }
    messages.push(...extracted.messages);
  }
  return {
    messages,
    sourceFileIds,
  };
}

import type { Logger } from 'vite';
import type { Diagnostic, ExtractFileResult } from 'yapyak/compiler/internal';

import { YAP_COMPILE, getDocsUrl } from 'yapyak/compiler/internal';

export function renderErrorDiagnostics(
  logger: Logger,
  result: ExtractFileResult,
): Diagnostic[] {
  const errors: Diagnostic[] = [];
  for (const diagnostic of result.diagnostics) {
    if (diagnostic.code === YAP_COMPILE.PROCESSOR_PARSE_ERROR.code) {
      continue;
    }
    if (diagnostic.severity === 'error') {
      errors.push(diagnostic);
      continue;
    }
    logger.warn(formatDiagnostic(diagnostic));
  }
  return errors;
}

export function hasParseFailure(result: ExtractFileResult): boolean {
  return result.diagnostics.some(
    (diagnostic) => diagnostic.code === YAP_COMPILE.PROCESSOR_PARSE_ERROR.code,
  );
}

export function formatDiagnostic(diagnostic: Diagnostic): string {
  const location = `${diagnostic.fileId}:${diagnostic.range.start.line}:${diagnostic.range.start.column}`;
  return `[yapyak] ${diagnostic.code} ${location}: ${diagnostic.message}\nSee ${getDocsUrl(diagnostic.code)}`;
}

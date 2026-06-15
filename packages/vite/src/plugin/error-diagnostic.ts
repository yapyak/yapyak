import type { Logger } from 'vite';
import type { Diagnostic, ExtractFileResult } from 'yapyak/compiler/internal';

export function renderErrorDiagnostics(
  logger: Logger,
  result: ExtractFileResult,
): Diagnostic[] {
  const errorDiagnostics: Diagnostic[] = [];
  for (const diagnostic of result.diagnostics) {
    const message = `[yapyak] ${diagnostic.code} ${diagnostic.fileId}:${diagnostic.range.start.line}:${diagnostic.range.start.column}: ${diagnostic.message}`;
    if (diagnostic.severity === 'error') {
      logger.error(message);
      errorDiagnostics.push(diagnostic);
    } else {
      logger.warn(message);
    }
  }
  return errorDiagnostics;
}

import type { Logger } from 'vite';
import type { ExtractFileResult } from 'yapyak/compiler';

export function renderErrorDiagnostics(
  logger: Logger,
  result: ExtractFileResult,
): void {
  for (const diagnostic of result.diagnostics) {
    const message = `[yapyak] ${diagnostic.code} ${diagnostic.fileId}:${diagnostic.range.start.line}:${diagnostic.range.start.column}: ${diagnostic.message}`;
    if (diagnostic.severity === 'error') {
      logger.error(message);
    } else {
      logger.warn(message);
    }
  }
}

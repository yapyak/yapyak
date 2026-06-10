import type { Logger } from 'vite';
import type { ExtractFileResult } from 'yapyak/compiler';

export function renderErrorDiagnostics(
  logger: Logger,
  result: ExtractFileResult,
): void {
  for (const diagnostic of result.diagnostics) {
    if (diagnostic.severity !== 'error') {
      continue;
    }
    logger.error(
      `[yapyak] ${diagnostic.code} ${diagnostic.fileId}:${diagnostic.range.start.line}:${diagnostic.range.start.column}: ${diagnostic.message}`,
    );
  }
}

import type { ExtractFileResult } from 'yapyak/compiler';
import type { EngineState } from './state';

export function logErrors(state: EngineState, result: ExtractFileResult): void {
  for (const diagnostic of result.diagnostics) {
    if (diagnostic.severity !== 'error') {
      continue;
    }
    const { fileId, range, code, message } = diagnostic;
    state.error(
      `[yapyak] ${code} ${fileId}:${range.start.line}:${range.start.column}: ${message}`,
    );
  }
}

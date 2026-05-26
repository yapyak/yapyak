import type { Diagnostic, DiagnosticCode, Range } from './type';

export interface CreateDiagnosticInput {
  code: DiagnosticCode;
  fileId: string;
  hint?: string;
  message: string;
  range: Range;
  severity: 'error' | 'warning';
  source: string;
}

export function createDiagnostic(input: CreateDiagnosticInput): Diagnostic {
  const result: Diagnostic = {
    code: input.code,
    fileId: input.fileId,
    message: input.message,
    range: input.range,
    severity: input.severity,
    source: input.source,
  };
  if (input.hint) {
    result.hint = input.hint;
  }
  return result;
}

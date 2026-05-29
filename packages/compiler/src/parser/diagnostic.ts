import type { Range } from './range';

export type DiagnosticCode =
  | 'YPK001'
  | 'YPK002'
  | 'YPK003'
  | 'YPK005'
  | 'YPK007'
  | 'YPK008'
  | 'YPK009'
  | 'YPK010';

export interface Diagnostic {
  code: DiagnosticCode;
  fileId: string;
  hint?: string;
  message: string;
  range: Range;
  severity: 'error' | 'warning';
  source: string;
}

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

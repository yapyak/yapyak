import type { Range } from './range';

export type DiagnosticCode =
  | 'YPK101'
  | 'YPK102'
  | 'YPK103'
  | 'YPK104'
  | 'YPK105'
  | 'YPK106'
  | 'YPK201'
  | 'YPK202'
  | 'YPK203'
  | 'YPK204'
  | 'YPK205'
  | 'YPK206'
  | 'YPK301'
  | 'YPK302'
  | 'YPK303';

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

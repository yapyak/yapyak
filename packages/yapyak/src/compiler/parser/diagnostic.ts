import type { Range } from '../../processor';

type DiagnosticCode =
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
  | 'YPK303'
  | 'YPK304'
  | 'YPK401'
  | 'YPK403'
  | 'YPK404'
  | 'YPK405';

export type Diagnostic = {
  code: DiagnosticCode;
  fileId: string;
  hint?: string;
  message: string;
  range: Range;
  severity: 'error' | 'warning';
  source: string;
};

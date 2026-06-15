import type { YapCode } from '../../diagnostics/codes';
import type { Range } from '../../processor';

export type Diagnostic = {
  code: YapCode;
  fileId: string;
  hint?: string;
  message: string;
  range: Range;
  severity: 'error' | 'warning';
  source: string;
};

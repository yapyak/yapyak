import type { Fragment } from '../../processor';

import ts from 'typescript';

export function getScriptKind(
  fileId: string,
  language: Fragment['language'],
): ts.ScriptKind {
  if (fileId.endsWith('.tsx')) {
    return ts.ScriptKind.TSX;
  }
  if (fileId.endsWith('.jsx')) {
    return ts.ScriptKind.JSX;
  }
  if (language === 'js') {
    return ts.ScriptKind.JS;
  }
  return ts.ScriptKind.TS;
}

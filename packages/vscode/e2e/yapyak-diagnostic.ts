import type { Diagnostic, Uri } from 'vscode';

import { languages } from 'vscode';

export function getYapyakDiagnostics(uri: Uri): Diagnostic[] {
  return languages
    .getDiagnostics(uri)
    .filter((diagnostic) => diagnostic.source === 'yapyak');
}

import type { Diagnostic } from 'vscode';

import { Uri, languages, window, workspace } from 'vscode';

import { waitFor } from '../wait';
import { strict as assert } from 'node:assert';
import { join } from 'node:path';

function toCode(diagnostic: Diagnostic): string {
  return typeof diagnostic.code === 'object' && diagnostic.code !== null
    ? String(diagnostic.code.value)
    : String(diagnostic.code);
}

function getYapyakDiagnostics(uri: Uri): Diagnostic[] {
  return languages
    .getDiagnostics(uri)
    .filter((diagnostic) => diagnostic.source === 'yapyak');
}

test('emits diagnostics when yapyak resolves through a scoped dependency', async () => {
  const root = workspace.workspaceFolders?.[0]?.uri.fsPath;
  assert.ok(root, 'the fixture workspace is missing');
  const document = await workspace.openTextDocument(
    Uri.file(join(root, 'locales', 'sv.json')),
  );
  await window.showTextDocument(document);
  const diagnostics = await waitFor(
    () => getYapyakDiagnostics(document.uri),
    (value) => value.length >= 2,
  );

  assert.deepEqual(diagnostics.map(toCode).sort(), [
    'YAP0051',
    'YAP0053',
  ]);
});

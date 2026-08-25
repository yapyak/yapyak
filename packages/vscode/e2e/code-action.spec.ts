import type { CodeAction } from 'vscode';

import { commands, workspace } from 'vscode';

import { openDocument } from './document';
import { toPosition } from './position';
import { waitFor } from './wait';
import { getYapyakDiagnostics } from './yapyak-diagnostic';
import { strict as assert } from 'node:assert';

async function collectActions(
  path: string,
  needle: string,
): Promise<CodeAction[]> {
  const { document } = await openDocument(path);
  await waitFor(
    () => getYapyakDiagnostics(document.uri),
    (value) => value.length >= 2,
  );
  const position = toPosition(document, needle);
  return waitFor(
    () =>
      commands.executeCommand<CodeAction[]>(
        'vscode.executeCodeActionProvider',
        document.uri,
        document.lineAt(position.line).range,
      ),
    (actions) => actions.length > 0,
  );
}

test('renames the misspelled placeholder', async () => {
  const actions = await collectActions('locales/sv.json', '"Hi {name}"');
  const rename = actions.find(
    (action) => action.title === 'Rename {namn} to {name}',
  );
  assert.ok(rename?.edit, 'the rename action has no edit');

  await workspace.applyEdit(rename.edit);
  const { document } = await openDocument('locales/sv.json');
  assert.match(document.getText(), /"Hi \{name\}": "Hej \{name\}"/);
  await commands.executeCommand('workbench.action.files.revert');
});

test('drops the unused entry', async () => {
  const actions = await collectActions('locales/sv.json', '"Cancel"');

  assert.ok(
    actions.some((action) => action.title === 'Remove unused translation'),
  );
});

test('lists a fix-all action holding every unambiguous fix', async () => {
  const actions = await collectActions('locales/sv.json', '"Hi {name}"');

  assert.ok(actions.some((action) => action.title === 'Fix all (1)'));
});

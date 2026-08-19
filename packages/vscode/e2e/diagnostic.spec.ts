import type { Diagnostic } from 'vscode';

import { DiagnosticTag, commands, languages } from 'vscode';

import { openDocument } from './document';
import { FIXTURE_ROOT } from './fixture-root';
import { toPosition } from './position';
import { waitFor } from './wait';
import { strict as assert } from 'node:assert';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

function toCode(diagnostic: Diagnostic): string {
  return typeof diagnostic.code === 'object' && diagnostic.code !== null
    ? String(diagnostic.code.value)
    : String(diagnostic.code);
}

test('emits a misspelled-placeholder and an unused-entry diagnostic for a locale file', async () => {
  const { document } = await openDocument('locales/sv.json');
  const diagnostics = await waitFor(
    () => languages.getDiagnostics(document.uri),
    (value) => value.length >= 2,
  );

  assert.deepEqual(diagnostics.map(toCode).sort(), [
    'YAP0051',
    'YAP0053',
  ]);
});

test('marks the unused entry as unnecessary', async () => {
  const { document } = await openDocument('locales/sv.json');
  const diagnostics = await waitFor(
    () => languages.getDiagnostics(document.uri),
    (value) => value.length >= 2,
  );
  const unused = diagnostics.find(
    (diagnostic) => toCode(diagnostic) === 'YAP0053',
  );

  assert.deepEqual(unused?.tags, [
    DiagnosticTag.Unnecessary,
  ]);
  assert.equal(document.getText(unused?.range).trim(), '"Cancel": "Avbryt",');
});

test('emits a missing-param diagnostic while a source file is edited', async () => {
  const editor = await openDocument('src/a.tsx');
  const { document } = editor;
  const anchor = toPosition(document, "{t('Hello')}");
  await editor.edit((edit) => {
    edit.insert(anchor, "{t('Hi {name}')}\n      ");
  });
  const diagnostics = await waitFor(
    () => languages.getDiagnostics(document.uri),
    (value) => value.length > 0,
  );

  assert.deepEqual(diagnostics.map(toCode), [
    'YAP0004',
  ]);
  await commands.executeCommand('workbench.action.files.revert');
});

suite('diagnostic', () => {
  const sourcePath = join(FIXTURE_ROOT, 'src', 'a.tsx');
  let original = '';

  setup(async () => {
    original = await readFile(sourcePath, 'utf8');
  });

  teardown(async () => {
    await writeFile(sourcePath, original);
  });

  test('drops the unused-entry diagnostic when the source file gains the call on disk', async () => {
    const { document } = await openDocument('locales/sv.json');
    await waitFor(
      () => languages.getDiagnostics(document.uri),
      (value) => value.map(toCode).includes('YAP0053'),
    );

    await writeFile(
      sourcePath,
      original.replace("{t('Hello')}", "{t('Hello')}\n      {t('Cancel')}"),
    );
    const diagnostics = await waitFor(
      () => languages.getDiagnostics(document.uri),
      (value) => !value.map(toCode).includes('YAP0053'),
    );

    assert.deepEqual(diagnostics.map(toCode), [
      'YAP0051',
    ]);
  });
});

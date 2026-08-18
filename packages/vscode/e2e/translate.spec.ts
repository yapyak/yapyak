import { commands } from 'vscode';

import { FIXTURE_ROOT } from './fixture-root';
import { waitFor } from './wait';
import { strict as assert } from 'node:assert';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

suite('translate', () => {
  const localePath = join(FIXTURE_ROOT, 'locales/sv.json');
  let original = '';

  setup(async () => {
    original = await readFile(localePath, 'utf8');
  });

  teardown(async () => {
    await writeFile(localePath, original);
  });

  test('writes the translation of every empty stub into the locale file', async () => {
    await commands.executeCommand('yapyak.translate', {
      locale: 'sv',
      root: FIXTURE_ROOT,
    });
    const content = await waitFor(
      () => readFile(localePath, 'utf8'),
      (value) => value.includes('"Hello": "Hej"'),
    );

    assert.match(content, /"Cancel": "Avbryt"/);
  });
});

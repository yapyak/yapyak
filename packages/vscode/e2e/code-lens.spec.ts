import type { CodeLens } from 'vscode';

import { commands } from 'vscode';

import { openDocument } from './document';
import { waitFor } from './wait';
import { strict as assert } from 'node:assert';

test('lists a translate lens and a retranslate lens in a locale file', async () => {
  const { document } = await openDocument('locales/sv.json');
  const titles = await waitFor(
    async () =>
      (
        await commands.executeCommand<CodeLens[]>(
          'vscode.executeCodeLensProvider',
          document.uri,
        )
      ).map((lens) => lens.command?.title ?? ''),
    (value) => value.length > 0,
  );

  assert.deepEqual(titles, [
    'Translate (1)',
    'Retranslate all (4)',
  ]);
});

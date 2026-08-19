import type { LocationLink } from 'vscode';

import { commands } from 'vscode';

import { openDocument } from './document';
import { toPosition } from './position';
import { waitFor } from './wait';
import { strict as assert } from 'node:assert';

test('resolves the `t()` call of a locale entry', async () => {
  const { document } = await openDocument('locales/sv.json');
  const [link] = await waitFor(
    () =>
      commands.executeCommand<LocationLink[]>(
        'vscode.executeDefinitionProvider',
        document.uri,
        toPosition(document, '"Hi {name}"'),
      ),
    (links) => links.length > 0,
  );

  assert.ok(link?.targetUri.fsPath.endsWith('src/a.tsx'));
  assert.equal(link?.targetRange.start.line, 6);
});

test('resolves the source file of a file key', async () => {
  const { document } = await openDocument('locales/sv.json');
  const [link] = await waitFor(
    () =>
      commands.executeCommand<LocationLink[]>(
        'vscode.executeDefinitionProvider',
        document.uri,
        toPosition(document, '"src/a.tsx"'),
      ),
    (links) => links.length > 0,
  );

  assert.ok(link?.targetUri.fsPath.endsWith('src/a.tsx'));
  assert.equal(link?.targetRange.start.line, 0);
});

import type { CompletionList } from 'vscode';

import { commands } from 'vscode';

import { openDocument } from './document';
import { toPosition } from './position';
import { waitFor } from './wait';
import { strict as assert } from 'node:assert';

async function collectLabels(path: string, needle: string): Promise<string[]> {
  const { document } = await openDocument(path);
  return waitFor(
    async () =>
      (
        await commands.executeCommand<CompletionList>(
          'vscode.executeCompletionItemProvider',
          document.uri,
          toPosition(document, needle).translate(0, needle.length),
          '{',
        )
      ).items.map((item) =>
        typeof item.label === 'string' ? item.label : item.label.label,
      ),
    (labels) => labels.length > 0,
  );
}

test('lists the placeholders of the source string in a locale file', async () => {
  const labels = await collectLabels('locales/sv.json', '"Hej {');

  assert.ok(labels.includes('{name}'), labels.join(', '));
});

test('lists the ICU placeholder shapes inside a `t()` call', async () => {
  const labels = await collectLabels('src/a.tsx', "t('Hi {");

  assert.ok(labels.includes('{name}'), labels.join(', '));
  assert.ok(labels.includes('{value, plural}'), labels.join(', '));
});

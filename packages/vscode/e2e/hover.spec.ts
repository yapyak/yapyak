import type { Hover } from 'vscode';

import { commands } from 'vscode';

import { openDocument } from './document';
import { toPosition } from './position';
import { waitFor } from './wait';
import { strict as assert } from 'node:assert';

function toMarkdown(hovers: Hover[]): string {
  return hovers
    .flatMap((hover) => hover.contents)
    .map((content) => (typeof content === 'string' ? content : content.value))
    .join('\n');
}

test('renders the translations of a source string', async () => {
  const { document } = await openDocument('src/a.tsx');
  const markdown = await waitFor(
    async () =>
      toMarkdown(
        await commands.executeCommand<Hover[]>(
          'vscode.executeHoverProvider',
          document.uri,
          toPosition(document, "'Hello'").translate(0, 1),
        ),
      ),
    (value) => value !== '',
  );

  assert.match(markdown, /\*\*Hello\*\*/);
  assert.match(markdown, /`sv` _untranslated_/);
});

test('renders a translate link for an empty stub', async () => {
  const { document } = await openDocument('locales/sv.json');
  const markdown = await waitFor(
    async () =>
      toMarkdown(
        await commands.executeCommand<Hover[]>(
          'vscode.executeHoverProvider',
          document.uri,
          toPosition(document, '"Hello"'),
        ),
      ),
    (value) => value !== '',
  );

  assert.match(markdown, /Go to source/);
  assert.match(markdown, /Translate\]/);
  assert.doesNotMatch(markdown, /Retranslate/);
});

test('renders a retranslate link for a translated entry', async () => {
  const { document } = await openDocument('locales/sv.json');
  const markdown = await waitFor(
    async () =>
      toMarkdown(
        await commands.executeCommand<Hover[]>(
          'vscode.executeHoverProvider',
          document.uri,
          toPosition(document, '"Hi {name}"'),
        ),
      ),
    (value) => value !== '',
  );

  assert.match(markdown, /Retranslate/);
});

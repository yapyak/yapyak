import { commands } from 'vscode';

import { openDocument } from './document';
import { strict as assert } from 'node:assert';

const COMMANDS = [
  'yapyak.addLocale',
  'yapyak.openLocale',
  'yapyak.openSource',
  'yapyak.openTranslation',
  'yapyak.retranslate',
  'yapyak.retranslateLocale',
  'yapyak.showStats',
  'yapyak.translate',
];

test('registers every yapyak command', async () => {
  await openDocument('src/a.tsx');
  const registered = await commands.getCommands(true);

  for (const command of COMMANDS) {
    assert.ok(registered.includes(command), `${command} is not registered.`);
  }
});

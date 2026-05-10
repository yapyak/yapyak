#!/usr/bin/env node
import { add } from './commands/add.js';
import { check } from './commands/check.js';
import { status } from './commands/status.js';
import { translate } from './commands/translate.js';
import { color, symbol } from './tui.js';

export async function run(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;
  const projectRoot = process.cwd();

  switch (command) {
    case undefined:
    case '--help':
    case '-h':
    case 'help':
      printHelp();
      return 0;
    case '--version':
    case '-v':
      process.stdout.write('yapyak 0.0.0\n');
      return 0;
    case 'status':
      return status({
        json: rest.includes('--json'),
        projectRoot,
      });
    case 'check':
      return check({ projectRoot });
    case 'add': {
      const locale = rest.find((arg) => !arg.startsWith('--')) ?? '';
      return await add({ locale, projectRoot });
    }
    case 'translate': {
      const locale = rest.find((arg) => !arg.startsWith('--'));
      const providerArg = rest.find((arg) => arg.startsWith('--provider='));
      const provider = providerArg
        ? (providerArg.slice('--provider='.length) as 'anthropic' | 'openai')
        : undefined;
      const force = rest.includes('--force') || rest.includes('-f');
      return await translate({
        force,
        locale,
        projectRoot,
        provider,
      });
    }
    default:
      process.stdout.write(
        `\n  ${symbol.cross} ${color.red(`Unknown command: ${command}`)}\n`,
      );
      printHelp();
      return 1;
  }
}

function printHelp(): void {
  process.stdout.write(`
  ${color.bold('yapyak')}  ${color.dim('Translation that lives where you code.')}

  ${color.dim('Usage:')}  yapyak ${color.cyan('<command>')} ${color.dim('[options]')}

  ${color.bold('Commands')}
    ${color.cyan('add')} ${color.dim('<locale>')}          ${color.dim('Add a locale, auto-translate everything')}
    ${color.cyan('translate')} ${color.dim('[locale]')}    ${color.dim('Fill missing translations via AI (uses .env API key)')}
    ${color.cyan('translate --force')}     ${color.dim('Re-translate everything, including existing values')}
    ${color.cyan('status')}                ${color.dim('Coverage report')}
    ${color.cyan('status --json')}         ${color.dim('Machine-readable, exits 1 if any missing')}
    ${color.cyan('check')}                 ${color.dim('Exits 1 if anything is missing — for CI')}

`);
}

void run(process.argv.slice(2)).then((code) => {
  process.exit(code);
});

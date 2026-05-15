#!/usr/bin/env node

import { add } from './commands/add.ts';
import { check } from './commands/check.ts';
import { exportCommand } from './commands/export.ts';
import { status } from './commands/status.ts';
import { translate } from './commands/translate.ts';
import { loadYapyakConfig } from './load-config.ts';
import { color, symbol } from './tui.ts';

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
    case 'status': {
      const config = await loadYapyakConfig(projectRoot);
      return status({
        config,
        json: rest.includes('--json'),
        projectRoot,
      });
    }
    case 'check': {
      const config = await loadYapyakConfig(projectRoot);
      return check({ config, projectRoot });
    }
    case 'add': {
      const config = await loadYapyakConfig(projectRoot);
      const locales = rest.filter((arg) => !arg.startsWith('--'));
      return await add({ config, locales, projectRoot });
    }
    case 'translate': {
      const config = await loadYapyakConfig(projectRoot);
      const locale = rest.find((arg) => !arg.startsWith('--'));
      const providerArg = rest.find((arg) => arg.startsWith('--provider='));
      const provider = providerArg
        ? (providerArg.slice('--provider='.length) as 'anthropic' | 'openai')
        : undefined;
      const force = rest.includes('--force') || rest.includes('-f');
      return await translate({
        config,
        force,
        locale,
        projectRoot,
        provider,
      });
    }
    case 'export': {
      const config = await loadYapyakConfig(projectRoot);
      const locales = rest.filter((arg) => !arg.startsWith('--'));
      const outArg = rest.find((arg) => arg.startsWith('--out='));
      const out = outArg ? outArg.slice('--out='.length) : undefined;
      const split = rest.includes('--split');
      return exportCommand({ config, locales, out, projectRoot, split });
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
    ${color.cyan('add')} ${color.dim('<locale...>')}       ${color.dim('Add one or more locales, auto-translate everything')}
    ${color.cyan('translate')} ${color.dim('[locale]')}    ${color.dim('Fill missing translations via AI (uses .env API key)')}
    ${color.cyan('translate --force')}     ${color.dim('Re-translate everything, including existing values')}
    ${color.cyan('export')} ${color.dim('[locale...]')}    ${color.dim('Snapshot locales as wrapped JSON to stdout')}
    ${color.cyan('export --out=path')}     ${color.dim('Write snapshot to a file')}
    ${color.cyan('export --split --out=dir')}  ${color.dim('Write one file per locale into a directory')}
    ${color.cyan('status')}                ${color.dim('Coverage report')}
    ${color.cyan('status --json')}         ${color.dim('Machine-readable, exits 1 if any missing')}
    ${color.cyan('check')}                 ${color.dim('Exits 1 if anything is missing — for CI')}

`);
}

void run(process.argv.slice(2)).then((code) => {
  process.exit(code);
});

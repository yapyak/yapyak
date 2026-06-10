#!/usr/bin/env node

import { add, check, clean, exportCommand, status, translate } from './command';
import { loadConfig } from './config';
import { color, symbol } from './tui';
import { fileURLToPath } from 'node:url';

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
      const config = await loadConfig(projectRoot);
      return status(config, projectRoot, {
        json: rest.includes('--json'),
      });
    }
    case 'check': {
      const config = await loadConfig(projectRoot);
      return check(config, projectRoot);
    }
    case 'clean': {
      const config = await loadConfig(projectRoot);
      return clean(config, projectRoot, {
        write: rest.includes('--write'),
      });
    }
    case 'add': {
      const config = await loadConfig(projectRoot);
      const locales = rest.filter((entry) => !entry.startsWith('-'));
      return add(config, projectRoot, {
        locales,
      });
    }
    case 'translate': {
      const config = await loadConfig(projectRoot);
      const locale = rest.find((entry) => !entry.startsWith('-'));
      return translate(config, projectRoot, {
        force: rest.includes('--force') || rest.includes('-f'),
        locale,
      });
    }
    case 'export': {
      const config = await loadConfig(projectRoot);
      const locales = rest.filter((entry) => !entry.startsWith('-'));
      const outFlag = rest.find((entry) => entry.startsWith('--out='));
      const out = outFlag?.slice('--out='.length);
      return exportCommand(config, projectRoot, {
        locales,
        split: rest.includes('--split'),
        ...(out !== undefined && {
          out,
        }),
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
    ${color.cyan('add')} ${color.dim('<locale...>')}       ${color.dim('Add one or more locales, auto-translate everything')}
    ${color.cyan('translate')} ${color.dim('[locale]')}    ${color.dim('Fill missing translations via the translator in yapyak.config.ts')}
    ${color.cyan('translate --force')}     ${color.dim('Re-translate everything, including existing values')}
    ${color.cyan('export')} ${color.dim('[locale...]')}    ${color.dim('Snapshot locales as wrapped JSON to stdout')}
    ${color.cyan('export --out=path')}     ${color.dim('Write snapshot to a file')}
    ${color.cyan('export --split --out=dir')}  ${color.dim('Write one file per locale into a directory')}
    ${color.cyan('status')}                ${color.dim('Coverage report')}
    ${color.cyan('status --json')}         ${color.dim('Machine-readable, exits 1 if any missing')}
    ${color.cyan('check')}                 ${color.dim('Exits 1 if anything is missing — for CI')}
    ${color.cyan('clean')}                 ${color.dim('List orphan locale entries (no matching t() call)')}
    ${color.cyan('clean --write')}         ${color.dim('Remove orphan entries from the locale files')}

`);
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  void (async (): Promise<void> => {
    try {
      const code = await run(process.argv.slice(2));
      process.exit(code);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      process.stderr.write(`\n  ${symbol.cross} ${color.red(message)}\n\n`);
      process.exit(1);
    }
  })();
}

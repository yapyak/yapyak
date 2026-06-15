import { add, check, clean, exportCommand, status, translate } from './command';
import { loadConfig } from './config';
import { color, symbol } from './tui';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const FLAGS_BY_COMMAND: Record<string, Set<string>> = {
  add: new Set<string>(),
  check: new Set<string>(),
  clean: new Set([
    '--write',
  ]),
  export: new Set([
    '--out',
    '--split',
  ]),
  status: new Set([
    '--json',
  ]),
  translate: new Set([
    '--force',
    '-f',
  ]),
};

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
      process.stdout.write(`yapyak ${readPackageVersion()}\n`);
      return 0;
    case 'status':
    case 'check':
    case 'clean':
    case 'add':
    case 'translate':
    case 'export': {
      const unknown = findUnknownFlags(rest, FLAGS_BY_COMMAND[command]);
      if (unknown.length > 0) {
        process.stderr.write(
          `\n  ${symbol.cross} ${color.red(`Unknown flag${unknown.length === 1 ? '' : 's'}: ${unknown.join(', ')}`)}\n`,
        );
        printHelp();
        return 1;
      }
      const config = await loadConfig(projectRoot);
      if (command === 'status') {
        return status(config, projectRoot, {
          json: hasFlag(rest, '--json'),
        });
      }
      if (command === 'check') {
        return check(config, projectRoot);
      }
      if (command === 'clean') {
        return clean(config, projectRoot, {
          write: hasFlag(rest, '--write'),
        });
      }
      if (command === 'add') {
        const locales = rest.filter((entry) => !entry.startsWith('-'));
        return add(config, projectRoot, locales);
      }
      if (command === 'translate') {
        const locale = rest.find((entry) => !entry.startsWith('-'));
        return translate(config, projectRoot, {
          force: hasFlag(rest, '--force') || hasFlag(rest, '-f'),
          locale,
        });
      }
      const exportArgs = parseExportArgs(rest);
      return exportCommand(config, projectRoot, {
        locales: exportArgs.locales,
        split: exportArgs.split,
        ...(exportArgs.out !== undefined && {
          out: exportArgs.out,
        }),
      });
    }
    default:
      process.stderr.write(
        `\n  ${symbol.cross} ${color.red(`Unknown command: ${command}`)}\n`,
      );
      printHelp();
      return 1;
  }
}

type ParseExportArgsResult = {
  locales: string[];
  out: string | undefined;
  split: boolean;
};

function parseExportArgs(args: string[]): ParseExportArgsResult {
  let out: string | undefined;
  let isSplit = false;
  const locales: string[] = [];
  for (let index = 0; index < args.length; index++) {
    const entry = args[index];
    if (entry === undefined) {
      continue;
    }
    if (entry === '--split') {
      isSplit = true;
      continue;
    }
    if (entry.startsWith('--out=')) {
      out = entry.slice('--out='.length);
      continue;
    }
    if (entry === '--out') {
      const next = args[index + 1];
      if (next !== undefined && !next.startsWith('-')) {
        out = next;
        index++;
      }
      continue;
    }
    if (!entry.startsWith('-')) {
      locales.push(entry);
    }
  }
  return {
    locales,
    out,
    split: isSplit,
  };
}

function hasFlag(entries: string[], flag: string): boolean {
  return entries.some(
    (entry) => entry === flag || entry.startsWith(`${flag}=`),
  );
}

function findUnknownFlags(
  args: string[],
  known: Set<string> | undefined,
): string[] {
  if (!known) {
    return [];
  }
  const unknown: string[] = [];
  for (const arg of args) {
    if (!arg.startsWith('-')) {
      continue;
    }
    const flagName = arg.includes('=') ? arg.slice(0, arg.indexOf('=')) : arg;
    if (!known.has(flagName)) {
      unknown.push(arg);
    }
  }
  return unknown;
}

function readPackageVersion(): string {
  try {
    const packagePath = join(import.meta.dirname, '..', '..', 'package.json');
    const parsed = JSON.parse(readFileSync(packagePath, 'utf-8'));
    if (typeof parsed.version === 'string') {
      return parsed.version;
    }
    return 'unknown';
  } catch {
    return 'unknown';
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

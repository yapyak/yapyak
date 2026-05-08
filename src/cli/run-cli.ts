import { runCheck } from './commands/check.js';
import { runCompile } from './commands/compile.js';
import { runExtract } from './commands/extract.js';
import { runInit } from './commands/init.js';
import { runTranslate } from './commands/translate.js';

export async function runCli(argv: string[]): Promise<void> {
  const command = argv[0];
  const projectRoot = process.cwd();

  if (!command || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  try {
    switch (command) {
      case 'init':
        await handleInit(projectRoot, argv.slice(1));
        return;
      case 'extract':
        handleExtract(projectRoot);
        return;
      case 'translate':
        await handleTranslate(projectRoot, argv.slice(1));
        return;
      case 'compile':
        handleCompile(projectRoot);
        return;
      case 'check':
        await handleCheck(projectRoot, argv.slice(1));
        return;
      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ ${message}`);
    process.exit(1);
  }
}

function printHelp(): void {
  console.log('Usage: yapyak <command>');
  console.log('');
  console.log('Commands:');
  console.log('  init [--locales sv,de,fr]  Scaffold locales/ and tsconfig include');
  console.log('  extract                    Extract source strings from code');
  console.log('  translate [--force]        Fill missing translations via AI');
  console.log('  compile                    Build compiled locale modules');
  console.log('  check [--write]            Validate translations (--write to auto-fix)');
  console.log('');
  console.log('Environment:');
  console.log('  ANTHROPIC_API_KEY          Required for `translate`');
}

async function handleInit(projectRoot: string, args: string[]): Promise<void> {
  const localesArg = parseFlag(args, '--locales');
  const defaultLocaleArg = parseFlag(args, '--default-locale');
  const localesDir = parseFlag(args, '--locales-dir') ?? 'locales';
  const locales = localesArg
    ? localesArg.split(',').map((s) => s.trim())
    : ['en', 'sv'];
  const defaultLocale = defaultLocaleArg ?? locales[0] ?? 'en';
  if (!locales.includes(defaultLocale)) {
    locales.unshift(defaultLocale);
  }

  const result = runInit(projectRoot, {
    defaultLocale,
    locales,
    localesDir,
  });

  if (result.createdLocalesDir) {
    console.log(`✔ Created ${localesDir}/`);
  }
  for (const file of result.createdLocaleFiles) {
    console.log(`✔ Created ${file}`);
  }
  if (result.updatedTsconfig) {
    console.log('✔ Added types include to tsconfig.json');
  }
  console.log('');
  console.log('Next steps:');
  console.log('  1. Add the yapyak plugin to vite.config.ts');
  console.log("  2. Wrap user-facing text in t('...')");
  console.log('  3. Run `yapyak extract` then `yapyak translate`');
}

function handleExtract(projectRoot: string): void {
  const result = runExtract(projectRoot);
  console.log(
    `✔ Extracted ${result.total} source strings across ${result.files} files`,
  );
  if (result.added > 0) {
    console.log(`  +${result.added} new`);
  }
  if (result.removed > 0) {
    console.log(`  -${result.removed} removed`);
  }
  if (result.renamed > 0) {
    console.log(`  ↻ ${result.renamed} renamed (translations preserved)`);
  }
}

async function handleTranslate(
  projectRoot: string,
  args: string[],
): Promise<void> {
  const forceAll = args.includes('--force');

  console.log('ℹ Translating missing strings...');
  const results = await runTranslate(projectRoot, { forceAll });

  for (const result of results) {
    if (result.translated > 0) {
      console.log(`✔ ${result.locale}: ${result.translated} translated`);
    } else {
      console.log(`✓ ${result.locale}: nothing to translate`);
    }
  }
}

function handleCompile(projectRoot: string): void {
  const results = runCompile(projectRoot);
  for (const result of results) {
    console.log(
      `✔ ${result.locale}: ${result.messages} messages, ${result.files} files`,
    );
  }
}

async function handleCheck(projectRoot: string, args: string[]): Promise<void> {
  const allowStale = args.includes('--allow-stale');
  const write = args.includes('--write');

  if (write) {
    const extractResult = runExtract(projectRoot);
    if (extractResult.renamed > 0) {
      console.log(
        `✔ Detected ${extractResult.renamed} rename(s); translations preserved`,
      );
    }
    if (extractResult.removed > 0) {
      console.log(`✔ Removed ${extractResult.removed} stale string(s)`);
    }
    const translateResults = await runTranslate(projectRoot, {
      forceAll: false,
    });
    let totalTranslated = 0;
    for (const result of translateResults) {
      totalTranslated += result.translated;
      if (result.translated > 0) {
        console.log(`✔ ${result.locale}: ${result.translated} translated`);
      }
    }
    if (
      extractResult.removed === 0 &&
      extractResult.renamed === 0 &&
      totalTranslated === 0
    ) {
      console.log('✓ Nothing to fix');
    }
    return;
  }

  const result = runCheck(projectRoot);
  const blocking = allowStale
    ? result.issues.filter((issue) => issue.kind !== 'stale')
    : result.issues;

  if (result.issues.length === 0) {
    console.log(`✔ All ${result.totalSources} strings translated`);
    return;
  }

  const missing = result.issues.filter((issue) => issue.kind === 'missing');
  const stale = result.issues.filter((issue) => issue.kind === 'stale');
  const invalid = result.issues.filter(
    (issue) => issue.kind === 'invalid-json',
  );

  if (invalid.length > 0) {
    console.log('✗ Invalid JSON:');
    for (const issue of invalid) {
      console.log(`  ${issue.fileId}`);
    }
  }

  if (missing.length > 0) {
    console.log(`✗ Missing translations (${missing.length}):`);
    for (const issue of missing) {
      console.log(`  [${issue.locale}] ${issue.fileId} → "${issue.source}"`);
    }
  }

  if (stale.length > 0) {
    const symbol = allowStale ? '⚠' : '✗';
    const label = allowStale ? 'Stale translations (warning)' : 'Stale translations';
    console.log(`${symbol} ${label} (${stale.length}):`);
    for (const issue of stale) {
      console.log(`  [${issue.locale}] ${issue.fileId} → "${issue.source}"`);
    }
  }

  if (blocking.length > 0) {
    process.exit(1);
  }
}

function parseFlag(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return args[index + 1];
}

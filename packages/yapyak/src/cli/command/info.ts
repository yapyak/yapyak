import { color, header } from '../tui';
import { readFileSync } from 'node:fs';
import { arch, platform, release } from 'node:os';
import { dirname, join } from 'node:path';

type DeclaredPackageEntry = {
  name: string;
  range: string;
  version?: string;
};

type ProbedPackageEntry = {
  name: string;
  version: string;
};

type PackageEntry = DeclaredPackageEntry | ProbedPackageEntry;

type PackageFile = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  name?: string;
  version?: string;
};

export function info(projectRoot: string): number {
  process.stdout.write(header('Environment'));
  process.stdout.write(
    `  ${color.dim('Node')}              ${process.version}\n`,
  );
  process.stdout.write(
    `  ${color.dim('System')}            ${platform()} ${release()} (${arch()})\n`,
  );
  process.stdout.write(
    `  ${color.dim('Package manager')}   ${resolvePackageManager()}\n\n`,
  );

  const entries: PackageEntry[] = [
    {
      name: 'yapyak',
      version: readOwnVersion(),
    },
    ...collectPackageEntries(projectRoot),
  ];
  process.stdout.write(`  ${color.bold('Packages')}\n`);
  const width = entries.reduce(
    (max, entry) => Math.max(max, entry.name.length),
    0,
  );
  for (const entry of entries) {
    const version =
      'range' in entry
        ? (entry.version ?? `${entry.range} ${color.dim('(not installed)')}`)
        : entry.version;
    process.stdout.write(`    ${entry.name.padEnd(width + 3)}${version}\n`);
  }
  process.stdout.write('\n');
  return 0;
}

function readOwnVersion(): string {
  let directory = import.meta.dirname;
  let previous = '';
  while (directory !== previous) {
    const packageFile = readPackageFile(directory);
    if (
      packageFile?.name === 'yapyak' &&
      typeof packageFile.version === 'string'
    ) {
      return packageFile.version;
    }
    previous = directory;
    directory = dirname(directory);
  }
  return 'unknown';
}

function resolvePackageManager(): string {
  const firstToken = process.env.npm_config_user_agent?.split(' ')[0];
  if (firstToken === undefined || firstToken === '') {
    return 'unknown';
  }
  return firstToken.replace('/', ' ');
}

function collectPackageEntries(projectRoot: string): PackageEntry[] {
  const packageFile = readPackageFile(projectRoot);
  if (packageFile === undefined) {
    return [];
  }
  const rangesByName = new Map<string, string>();
  for (const record of [
    packageFile.dependencies,
    packageFile.devDependencies,
  ]) {
    if (typeof record !== 'object' || record === null) {
      continue;
    }
    for (const [name, range] of Object.entries(record)) {
      if (
        name === 'typescript' ||
        name === 'vite' ||
        name.startsWith('@yapyak/')
      ) {
        rangesByName.set(name, range);
      }
    }
  }
  const entries: PackageEntry[] = [
    ...rangesByName.entries(),
  ].map(([name, range]) => {
    const version = findInstalledVersion(name, projectRoot);
    return {
      name,
      range,
      ...(version !== undefined && {
        version,
      }),
    };
  });
  for (const name of [
    'typescript',
    'vite',
  ]) {
    if (rangesByName.has(name)) {
      continue;
    }
    const version = findInstalledVersion(name, projectRoot);
    if (version !== undefined) {
      entries.push({
        name,
        version,
      });
    }
  }
  return entries.sort((left, right) => (left.name < right.name ? -1 : 1));
}

function findInstalledVersion(
  name: string,
  projectRoot: string,
): string | undefined {
  let directory = projectRoot;
  let previous = '';
  while (directory !== previous) {
    const version = readPackageFile(
      join(directory, 'node_modules', name),
    )?.version;
    if (typeof version === 'string') {
      return version;
    }
    previous = directory;
    directory = dirname(directory);
  }
  return undefined;
}

function readPackageFile(directory: string): PackageFile | undefined {
  try {
    const parsed = JSON.parse(
      readFileSync(join(directory, 'package.json'), 'utf-8'),
    );
    if (typeof parsed !== 'object' || parsed === null) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

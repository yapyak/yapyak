import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export interface WalkOptions {
  ignore?: string[];
  pattern: RegExp;
  projectRoot: string;
  roots: string[];
}

export interface WalkedFile {
  code: string;
  fileId: string;
}

const DEFAULT_IGNORE = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '.next',
  '.vite',
  '.cache',
  '.turbo',
  '.output',
];

export function walkSourceFiles(options: WalkOptions): WalkedFile[] {
  const ignore = new Set(options.ignore ?? DEFAULT_IGNORE);
  const results: WalkedFile[] = [];
  for (const root of options.roots) {
    walk(join(options.projectRoot, root), options.projectRoot, options.pattern, ignore, results);
  }
  return results;
}

function walk(
  dir: string,
  projectRoot: string,
  pattern: RegExp,
  ignore: Set<string>,
  results: WalkedFile[],
): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (ignore.has(name) || name.startsWith('.')) {
      continue;
    }
    const fullPath = join(dir, name);
    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      walk(fullPath, projectRoot, pattern, ignore, results);
      continue;
    }
    if (!stat.isFile() || !pattern.test(name)) {
      continue;
    }
    let code: string;
    try {
      code = readFileSync(fullPath, 'utf-8');
    } catch {
      continue;
    }
    const fileId = relative(projectRoot, fullPath).replaceAll('\\', '/');
    results.push({ code, fileId });
  }
}

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export interface WalkOptions {
  filter: (id: string) => boolean;
  projectRoot: string;
}

export interface WalkedFile {
  code: string;
  fileId: string;
}

const ALWAYS_SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.vite',
  '.cache',
  '.turbo',
]);

export function walkSourceFiles(options: WalkOptions): WalkedFile[] {
  const results: WalkedFile[] = [];
  walk(options.projectRoot, options.projectRoot, options.filter, results);
  return results;
}

function walk(
  dir: string,
  projectRoot: string,
  filter: (id: string) => boolean,
  results: WalkedFile[],
): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (ALWAYS_SKIP_DIRS.has(name)) {
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
      walk(fullPath, projectRoot, filter, results);
      continue;
    }
    if (!stat.isFile()) {
      continue;
    }
    if (!filter(fullPath)) {
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

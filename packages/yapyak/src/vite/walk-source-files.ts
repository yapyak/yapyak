import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/** @internal */
export interface WalkOptions {
  filter: (id: string) => boolean;
  projectRoot: string;
}

/** @internal */
export interface WalkedFile {
  code: string;
  fileId: string;
}

const PROBE_FILE = '__yapyak_probe__.ts';

/** @internal */
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
    const fullPath = join(dir, name);
    let stat: ReturnType<typeof statSync>;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      if (!filter(join(fullPath, PROBE_FILE))) {
        continue;
      }
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

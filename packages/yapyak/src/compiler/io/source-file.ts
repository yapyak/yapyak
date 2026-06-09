import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export interface WalkSourceFilesInput {
  filter: (id: string) => boolean;
  projectRoot: string;
}

export interface WalkedFile {
  code: string;
  fileId: string;
}

const PROBE_FILE = '__yapyak_probe__.ts';

export function walkSourceFiles(input: WalkSourceFilesInput): WalkedFile[] {
  const results: WalkedFile[] = [];
  walk(input.projectRoot, input.projectRoot, input.filter, results);
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
      const probeId = relative(
        projectRoot,
        join(fullPath, PROBE_FILE),
      ).replaceAll('\\', '/');
      if (!filter(probeId)) {
        continue;
      }
      walk(fullPath, projectRoot, filter, results);
      continue;
    }
    if (!stat.isFile()) {
      continue;
    }
    const fileId = relative(projectRoot, fullPath).replaceAll('\\', '/');
    if (!filter(fileId)) {
      continue;
    }
    let code: string;
    try {
      code = readFileSync(fullPath, 'utf-8');
    } catch {
      continue;
    }
    results.push({ code, fileId });
  }
}

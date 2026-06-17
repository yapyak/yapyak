import { readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export type WalkedFile = {
  code: string;
  fileId: string;
};

const PROBE_FILE = '__yapyak_probe__.ts';

export function walkSourceFiles(
  filter: (fileId: string) => boolean,
  projectRoot: string,
): WalkedFile[] {
  const results: WalkedFile[] = [];
  walk(projectRoot, projectRoot, filter, results, new Set<string>());
  return results;
}

function walk(
  dir: string,
  projectRoot: string,
  filter: (id: string) => boolean,
  results: WalkedFile[],
  visited: Set<string>,
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
      let realDir: string;
      try {
        realDir = realpathSync(fullPath);
      } catch {
        continue;
      }
      if (visited.has(realDir)) {
        continue;
      }
      visited.add(realDir);
      const probeId = relative(
        projectRoot,
        join(fullPath, PROBE_FILE),
      ).replaceAll('\\', '/');
      if (!filter(probeId)) {
        continue;
      }
      walk(fullPath, projectRoot, filter, results, visited);
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
    results.push({
      code,
      fileId,
    });
  }
}

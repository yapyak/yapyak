import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export interface FindFilesOptions {
  ignore: string[];
  patterns: string[];
  root: string;
}

export function findFiles(options: FindFilesOptions): string[] {
  const { ignore, patterns, root } = options;
  const results: string[] = [];
  walk(root, root, results, ignore);
  return results.filter((file) =>
    matchesAny(relative(root, file).split(sep).join('/'), patterns),
  );
}

function walk(
  root: string,
  dir: string,
  results: string[],
  ignore: string[],
): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.startsWith('.')) {
      continue;
    }
    const fullPath = join(dir, entry);
    const rel = relative(root, fullPath).split(sep).join('/');
    if (ignore.some((pattern) => matches(rel, pattern))) {
      continue;
    }
    let stats: ReturnType<typeof statSync>;
    try {
      stats = statSync(fullPath);
    } catch {
      continue;
    }
    if (stats.isDirectory()) {
      walk(root, fullPath, results, ignore);
    } else if (stats.isFile()) {
      results.push(fullPath);
    }
  }
}

function matchesAny(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => matches(path, pattern));
}

function matches(path: string, pattern: string): boolean {
  const regex = globToRegex(pattern);
  return regex.test(path);
}

function globToRegex(pattern: string): RegExp {
  const groupAlternatives = (input: string): string => {
    return input.replace(/\{([^{}]+)\}/g, (_, alternatives: string) => {
      return `(${alternatives.split(',').map(escapeRegex).join('|')})`;
    });
  };

  let result = '^';
  const expanded = groupAlternatives(pattern);
  let i = 0;
  while (i < expanded.length) {
    const ch = expanded[i];
    if (ch === '*') {
      if (expanded[i + 1] === '*') {
        result += '.*';
        i += 2;
        if (expanded[i] === '/') {
          i++;
        }
      } else {
        result += '[^/]*';
        i++;
      }
    } else if (ch === '?') {
      result += '[^/]';
      i++;
    } else if (ch === '.') {
      result += '\\.';
      i++;
    } else if (ch === '/') {
      result += '/';
      i++;
    } else if (ch === '(' || ch === ')' || ch === '|') {
      result += ch;
      i++;
    } else {
      result += escapeRegex(ch ?? '');
      i++;
    }
  }
  result += '$';
  return new RegExp(result);
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

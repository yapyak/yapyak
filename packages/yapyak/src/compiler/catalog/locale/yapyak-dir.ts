import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function ensureYapyakDir(yapyakDir: string): void {
  mkdirSync(yapyakDir, {
    recursive: true,
  });
  const gitignorePath = join(yapyakDir, '.gitignore');
  if (existsSync(gitignorePath)) {
    return;
  }
  writeFileSync(gitignorePath, '*\n', 'utf8');
}

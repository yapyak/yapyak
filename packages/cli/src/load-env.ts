import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ENV_FILES = ['.env.local', '.env'];

export function loadEnv(projectRoot: string): Record<string, string> {
  const env: Record<string, string> = { ...process.env } as Record<
    string,
    string
  >;
  for (const file of ENV_FILES) {
    const path = join(projectRoot, file);
    if (!existsSync(path)) {
      continue;
    }
    const content = readFileSync(path, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('#')) {
        continue;
      }
      const equalsIndex = trimmed.indexOf('=');
      if (equalsIndex === -1) {
        continue;
      }
      const key = trimmed.slice(0, equalsIndex).trim();
      const rawValue = trimmed.slice(equalsIndex + 1).trim();
      const value =
        (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
        (rawValue.startsWith("'") && rawValue.endsWith("'"))
          ? rawValue.slice(1, -1)
          : rawValue;
      if (!env[key]) {
        env[key] = value;
      }
    }
  }
  return env;
}

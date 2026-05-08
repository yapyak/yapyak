import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface InitOptions {
  defaultLocale: string;
  locales: string[];
  localesDir: string;
}

export interface InitResult {
  createdLocaleFiles: string[];
  createdLocalesDir: boolean;
  updatedTsconfig: boolean;
}

const TSCONFIG_INCLUDE = 'node_modules/.cache/yapyak/types.d.ts';

export function runInit(projectRoot: string, options: InitOptions): InitResult {
  const { locales, localesDir } = options;
  const dir = join(projectRoot, localesDir);

  const result: InitResult = {
    createdLocaleFiles: [],
    createdLocalesDir: false,
    updatedTsconfig: false,
  };

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    result.createdLocalesDir = true;
  }

  for (const locale of locales) {
    const localePath = join(dir, `${locale}.json`);
    if (!existsSync(localePath)) {
      writeFileSync(localePath, '{}\n');
      result.createdLocaleFiles.push(`${localesDir}/${locale}.json`);
    }
  }

  result.updatedTsconfig = ensureTsconfigInclude(projectRoot);

  return result;
}

function ensureTsconfigInclude(projectRoot: string): boolean {
  const tsconfigPath = join(projectRoot, 'tsconfig.json');
  if (!existsSync(tsconfigPath)) {
    return false;
  }
  const raw = readFileSync(tsconfigPath, 'utf8');
  if (raw.includes(TSCONFIG_INCLUDE)) {
    return false;
  }
  let parsed: { include?: string[] } & Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return false;
  }
  const include = Array.isArray(parsed.include) ? parsed.include : [];
  include.push(TSCONFIG_INCLUDE);
  parsed.include = include;
  writeFileSync(tsconfigPath, `${JSON.stringify(parsed, null, 2)}\n`);
  return true;
}

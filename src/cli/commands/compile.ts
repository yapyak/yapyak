import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { compileLocale } from '../../compiler/index.js';
import { loadConfig } from '../config.js';

export interface CompileResult {
  files: number;
  locale: string;
  messages: number;
}

export function runCompile(projectRoot: string): CompileResult[] {
  const config = loadConfig(projectRoot);
  const results: CompileResult[] = [];

  for (const locale of config.locales) {
    const sourcePath = join(projectRoot, config.localesDir, `${locale}.json`);
    const translations = readJson(sourcePath);
    const compiled = compileLocale({
      locale,
      translations,
    });
    const outPath = join(
      projectRoot,
      'node_modules/.cache/yapyak/dist',
      `${locale}.js`,
    );
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, compiled.code);
    results.push({
      files: compiled.fileCount,
      locale,
      messages: compiled.messageCount,
    });
  }

  return results;
}

function readJson(path: string): Record<string, Record<string, string>> {
  if (!existsSync(path)) {
    return {};
  }
  const raw = readFileSync(path, 'utf8');
  if (raw.trim() === '') {
    return {};
  }
  return JSON.parse(raw);
}

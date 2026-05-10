import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parse, stringify } from 'yaml';
import type { ExtractedSchema, SchemaTree } from './extract-schemas.js';

export interface SyncOptions {
  defaultLocale: string;
  locales: string[];
  localesDir: string;
  projectRoot: string;
  schemas: ExtractedSchema[];
}

export interface OrphanEntry {
  fileId: string;
  key: string;
  locale: string;
}

export interface SyncResult {
  added: Record<string, number>;
  filesWritten: string[];
  orphans: OrphanEntry[];
}

export function syncLocaleFiles(options: SyncOptions): SyncResult {
  const byFile = groupByFileId(options.schemas);
  const filesWritten: string[] = [];
  const added: Record<string, number> = {};
  const orphans: OrphanEntry[] = [];

  for (const locale of options.locales) {
    const isDefault = locale === options.defaultLocale;
    const localePath = join(
      options.projectRoot,
      options.localesDir,
      `${locale}.yml`,
    );
    const existing = readLocaleFile(localePath);
    const next: Record<string, SchemaTree> = {};
    let addedCount = 0;

    for (const fileId of Object.keys(byFile).sort()) {
      const schema = byFile[fileId];
      if (schema === undefined) {
        continue;
      }
      if (isDefault) {
        next[fileId] = schema;
        continue;
      }
      const existingFile = existing[fileId];
      const existingTree =
        existingFile !== undefined && typeof existingFile === 'object'
          ? existingFile
          : {};
      const merged = mergeWithStubs(schema, existingTree);
      next[fileId] = merged.tree;
      addedCount += merged.addedCount;
    }

    for (const [fileId, fileTree] of Object.entries(existing)) {
      if (typeof fileTree !== 'object' || fileTree === null) {
        continue;
      }
      const currentSchema = byFile[fileId];
      for (const key of flattenKeys(fileTree as SchemaTree)) {
        if (currentSchema === undefined || !hasNestedKey(currentSchema, key)) {
          orphans.push({ fileId, key, locale });
        }
      }
    }

    writeLocaleFile(localePath, next);
    filesWritten.push(localePath);
    added[locale] = addedCount;
  }

  return { added, filesWritten, orphans };
}

function groupByFileId(
  schemas: ExtractedSchema[],
): Record<string, SchemaTree> {
  const result: Record<string, SchemaTree> = {};
  for (const entry of schemas) {
    const existing = result[entry.fileId];
    result[entry.fileId] =
      existing === undefined ? entry.schema : deepMerge(existing, entry.schema);
  }
  return result;
}

interface MergeResult {
  addedCount: number;
  tree: SchemaTree;
}

function mergeWithStubs(
  schema: SchemaTree,
  existing: SchemaTree,
): MergeResult {
  const result: SchemaTree = {};
  let addedCount = 0;
  for (const key of Object.keys(schema).sort()) {
    const value = schema[key];
    if (value === undefined) {
      continue;
    }
    if (typeof value === 'string') {
      const existingValue = existing[key];
      if (typeof existingValue === 'string') {
        result[key] = existingValue;
      } else {
        result[key] = '';
        addedCount++;
      }
    } else {
      const existingNested = existing[key];
      const nested =
        typeof existingNested === 'object' && existingNested !== null
          ? existingNested
          : {};
      const merged = mergeWithStubs(value, nested);
      result[key] = merged.tree;
      addedCount += merged.addedCount;
    }
  }
  return { addedCount, tree: result };
}

function deepMerge(a: SchemaTree, b: SchemaTree): SchemaTree {
  const result: SchemaTree = { ...a };
  for (const [key, value] of Object.entries(b)) {
    const existing = result[key];
    if (
      typeof value === 'object' &&
      value !== null &&
      typeof existing === 'object' &&
      existing !== null
    ) {
      result[key] = deepMerge(existing, value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function flattenKeys(tree: SchemaTree, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    if (typeof value === 'object' && value !== null) {
      keys.push(...flattenKeys(value, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

function hasNestedKey(tree: SchemaTree, path: string): boolean {
  const parts = path.split('.');
  let current: SchemaTree | string = tree;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) {
      return false;
    }
    const next: SchemaTree | string | undefined = current[part];
    if (next === undefined) {
      return false;
    }
    current = next;
  }
  return true;
}

function readLocaleFile(path: string): Record<string, SchemaTree> {
  if (!existsSync(path)) {
    return {};
  }
  const content = readFileSync(path, 'utf-8');
  if (content.trim() === '') {
    return {};
  }
  const parsed: unknown = parse(content);
  if (typeof parsed !== 'object' || parsed === null) {
    return {};
  }
  return parsed as Record<string, SchemaTree>;
}

function writeLocaleFile(
  path: string,
  data: Record<string, SchemaTree>,
): void {
  mkdirSync(dirname(path), { recursive: true });
  const content = stringify(data, { lineWidth: 0 });
  writeFileSync(path, content);
}

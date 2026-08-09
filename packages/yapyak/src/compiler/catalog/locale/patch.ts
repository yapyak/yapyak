import type { Patch } from '../../../hmr-patch';
import type { Template } from '../../../template';
import type { CatalogEntry, LocaleFile } from './file';

import { parseTemplate } from '../../../template';
import { toMessageKey } from '../../parser/message-key';

export function buildPatches(
  before: LocaleFile,
  after: LocaleFile,
  locale: string,
): Patch[] {
  const patches: Patch[] = [];
  const fileIds = new Set<string>([
    ...Object.keys(before),
    ...Object.keys(after),
  ]);
  for (const fileId of fileIds) {
    const beforeEntries = before[fileId] ?? {};
    const afterEntries = after[fileId] ?? {};
    const sources = new Set<string>([
      ...Object.keys(beforeEntries),
      ...Object.keys(afterEntries),
    ]);
    for (const source of sources) {
      const beforeEntry = beforeEntries[source];
      const afterEntry = afterEntries[source];
      walkEntry(patches, fileId, source, locale, beforeEntry, afterEntry);
    }
  }
  return patches;
}

function walkEntry(
  patches: Patch[],
  fileId: string,
  source: string,
  locale: string,
  beforeEntry: CatalogEntry | undefined,
  afterEntry: CatalogEntry | undefined,
): void {
  if (typeof afterEntry === 'string') {
    if (beforeEntry && typeof beforeEntry === 'object') {
      for (const context of Object.keys(beforeEntry)) {
        patches.push({
          fileId,
          id: toMessageKey(source, context),
          locale,
          value: '',
        });
      }
    }
    if (typeof beforeEntry !== 'string' || beforeEntry !== afterEntry) {
      patches.push({
        fileId,
        id: toMessageKey(source),
        locale,
        value: parseLocaleValue(afterEntry),
      });
    }
    return;
  }
  if (afterEntry && typeof afterEntry === 'object') {
    if (typeof beforeEntry === 'string') {
      patches.push({
        fileId,
        id: toMessageKey(source),
        locale,
        value: '',
      });
    }
    const beforeMap =
      beforeEntry && typeof beforeEntry === 'object' ? beforeEntry : {};
    const contexts = new Set<string>([
      ...Object.keys(beforeMap),
      ...Object.keys(afterEntry),
    ]);
    for (const context of contexts) {
      const beforeValue = beforeMap[context];
      const afterValue = afterEntry[context];
      if (typeof afterValue === 'string') {
        if (beforeValue !== afterValue) {
          patches.push({
            fileId,
            id: toMessageKey(source, context),
            locale,
            value: parseLocaleValue(afterValue),
          });
        }
      } else if (afterValue === undefined && typeof beforeValue === 'string') {
        patches.push({
          fileId,
          id: toMessageKey(source, context),
          locale,
          value: '',
        });
      }
    }
    return;
  }
  if (typeof beforeEntry === 'string') {
    patches.push({
      fileId,
      id: toMessageKey(source),
      locale,
      value: '',
    });
  }
  if (beforeEntry && typeof beforeEntry === 'object') {
    for (const context of Object.keys(beforeEntry)) {
      patches.push({
        fileId,
        id: toMessageKey(source, context),
        locale,
        value: '',
      });
    }
  }
}

function parseLocaleValue(raw: string): string | Template {
  const { template } = parseTemplate(raw);
  if (template.length === 0) {
    return '';
  }
  if (template.length === 1 && template[0]?.kind === 'literal') {
    return template[0].value;
  }
  return template;
}

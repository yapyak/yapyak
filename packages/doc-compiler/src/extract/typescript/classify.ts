import type { ExportKind } from '../../access';
import type { ReferenceTag } from './type';

const HOOK_NAME_RX = /^use[A-Z]/;
const COMPONENT_NAME_RX = /^[A-Z][a-z]/;
const ALLOWED_OVERRIDES = new Set<ExportKind>([
  'class',
  'component',
  'function',
  'hook',
  'interface',
  'type',
  'variable',
]);

export function classifyExportKind(
  name: string,
  baseKind: ExportKind,
  tags: ReferenceTag[],
): ExportKind {
  const override = tags.find((tag) => tag.name === 'kind')?.text.trim();
  if (override !== undefined && ALLOWED_OVERRIDES.has(override as ExportKind)) {
    return override as ExportKind;
  }
  if (baseKind === 'function' || baseKind === 'variable') {
    if (HOOK_NAME_RX.test(name)) {
      return 'hook';
    }
    if (COMPONENT_NAME_RX.test(name)) {
      return 'component';
    }
  }
  return baseKind;
}

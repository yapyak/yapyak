import type { ExportKind } from '../../access';
import type { ReferenceMember, ReferenceTag } from './type';

const HOOK_NAME_RX = /^use[A-Z]/;
const COMPONENT_NAME_RX = /^[A-Z][a-z]/;
const EXPORT_KINDS: Record<ExportKind, true> = {
  class: true,
  component: true,
  function: true,
  hook: true,
  interface: true,
  type: true,
  variable: true,
};

export function classifyExportKind(
  name: string,
  baseKind: ExportKind,
  tags: ReferenceTag[],
): ExportKind {
  const override = tags.find((tag) => tag.name === 'kind')?.text.trim();
  if (override !== undefined && isExportKind(override)) {
    return override;
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

export function classifyMemberDisplayKind(member: ReferenceMember): ExportKind {
  if (member.kind === 'method') {
    return classifyExportKind(member.name, 'function', member.tags);
  }
  return classifyExportKind(member.name, 'variable', []);
}

function isExportKind(value: string): value is ExportKind {
  return value in EXPORT_KINDS;
}

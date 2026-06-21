import type { ExportKind } from '../../access';
import type {
  ReferenceCallSignature,
  ReferenceExport,
  ReferenceMember,
  TypeToken,
} from './type';

import { classifyMemberDisplayKind } from './classify';

export type ModuleEntry = {
  description: string;
  kind: ExportKind;
  label: string;
  segment: string;
};

const CALLABLE_DISPLAY_KINDS = new Set<ExportKind>([
  'component',
  'function',
  'hook',
]);

export function expandModuleEntries(exports: ReferenceExport[]): ModuleEntry[] {
  const exportsByName = new Map<string, ReferenceExport>();
  for (const symbol of exports) {
    exportsByName.set(symbol.name, symbol);
  }

  const entries: ModuleEntry[] = [];
  for (const symbol of exports) {
    if (symbol.kind === 'function') {
      entries.push({
        description: symbol.description,
        kind: symbol.displayKind,
        label: `${symbol.name}()`,
        segment: symbol.name,
      });
      continue;
    }

    if (symbol.kind === 'variable') {
      const typeExport = resolveTypeExport(symbol.type, exportsByName);
      const resolvedCallSignatures = getTypeCallSignatures(typeExport);
      const resolvedMembers = getTypeMembers(typeExport);
      const documentedMembers = [
        ...symbol.members,
        ...resolvedMembers,
      ].filter((member) => member.description.length > 0);

      const isCallable =
        resolvedCallSignatures.length > 0 ||
        CALLABLE_DISPLAY_KINDS.has(symbol.displayKind);
      const isPureNamespace = !isCallable && documentedMembers.length > 0;

      if (!isPureNamespace) {
        entries.push({
          description: symbol.description,
          kind: symbol.displayKind,
          label: isCallable ? `${symbol.name}()` : symbol.name,
          segment: symbol.name,
        });
      }
      for (const member of documentedMembers) {
        const memberKind = classifyMemberDisplayKind(member);
        const segment = `${symbol.name}.${member.name}`;
        entries.push({
          description: member.description,
          kind: memberKind,
          label: CALLABLE_DISPLAY_KINDS.has(memberKind)
            ? `${segment}()`
            : segment,
          segment,
        });
      }
      continue;
    }

    entries.push({
      description: symbol.description,
      kind: symbol.displayKind,
      label: symbol.name,
      segment: symbol.name,
    });
  }
  return entries;
}

export function resolveTypeExport(
  typeTokens: TypeToken[],
  exportsByName: Map<string, ReferenceExport>,
): ReferenceExport | undefined {
  const typeName = findTypeIdentifier(typeTokens);
  if (typeName === undefined) {
    return undefined;
  }
  return exportsByName.get(typeName);
}

export function getTypeMembers(
  typeExport: ReferenceExport | undefined,
): ReferenceMember[] {
  if (typeExport?.kind !== 'type' && typeExport?.kind !== 'interface') {
    return [];
  }
  return typeExport.members;
}

export function getTypeCallSignatures(
  typeExport: ReferenceExport | undefined,
): ReferenceCallSignature[] {
  if (typeExport?.kind !== 'type' && typeExport?.kind !== 'interface') {
    return [];
  }
  return typeExport.callSignatures;
}

function findTypeIdentifier(tokens: TypeToken[]): string | undefined {
  for (const token of tokens) {
    if (token.kind === 'ref') {
      return token.name;
    }
    const match = /^([A-Z][\w$]*)(?:<.*>)?$/.exec(token.text.trim());
    if (match !== null && match[1] !== undefined) {
      return match[1];
    }
  }
  return undefined;
}

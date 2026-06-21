import type { ExportKind } from '../../access';
import type {
  ReferenceExport,
  ReferenceMember,
  ReferenceTag,
  TypeToken,
} from './type';

import { classifyExportKind } from './classify';

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
      const resolvedCallSignatures =
        typeExport?.kind === 'type' || typeExport?.kind === 'interface'
          ? typeExport.callSignatures
          : [];
      const resolvedMembers =
        typeExport?.kind === 'type' || typeExport?.kind === 'interface'
          ? typeExport.members
          : [];
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
        entries.push({
          description: member.description,
          kind: memberDisplayKind(member),
          label: memberLabel(symbol.name, member),
          segment: `${symbol.name}.${member.name}`,
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

function memberDisplayKind(member: ReferenceMember): ExportKind {
  const baseKind: ExportKind =
    member.kind === 'method' ? 'function' : 'variable';
  const tags: ReferenceTag[] = member.kind === 'method' ? member.tags : [];
  return classifyExportKind(member.name, baseKind, tags);
}

function memberLabel(parentName: string, member: ReferenceMember): string {
  const displayKind = memberDisplayKind(member);
  const isCallable =
    displayKind === 'function' ||
    displayKind === 'hook' ||
    displayKind === 'component';
  return isCallable
    ? `${parentName}.${member.name}()`
    : `${parentName}.${member.name}`;
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

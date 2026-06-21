import type { ExportKind } from '../../access';
import type { ReferenceExport, ReferenceMethodMember, TypeToken } from './type';

export type ModuleEntry = {
  description: string;
  kind: ExportKind;
  label: string;
  segment: string;
};

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
        kind: 'function',
        label: `${symbol.name}()`,
        segment: symbol.name,
      });
      continue;
    }

    if (symbol.kind === 'variable') {
      const typeExport = resolveTypeExport(symbol.type, exportsByName);
      if (
        typeExport !== undefined &&
        (typeExport.kind === 'type' || typeExport.kind === 'interface')
      ) {
        const hasCallSignature = typeExport.callSignatures.length > 0;
        const methodMembers = typeExport.members.filter(
          (member): member is ReferenceMethodMember => member.kind === 'method',
        );

        if (hasCallSignature) {
          entries.push({
            description: symbol.description,
            kind: 'function',
            label: `${symbol.name}()`,
            segment: symbol.name,
          });
        }
        for (const method of methodMembers) {
          entries.push({
            description: method.description,
            kind: 'function',
            label: `${symbol.name}.${method.name}()`,
            segment: `${symbol.name}.${method.name}`,
          });
        }
        if (hasCallSignature || methodMembers.length > 0) {
          continue;
        }
      }
    }

    entries.push({
      description: symbol.description,
      kind: symbol.kind,
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

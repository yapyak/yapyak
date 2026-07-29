import type {
  ReferenceCallSignature,
  ReferenceExport,
  ReferenceExportBase,
  ReferenceMember,
  ReferencePropertyMember,
  TypeToken,
} from './type';

import { describe, expect, it } from 'vitest';

import {
  expandModuleEntries,
  formatSymbolLabel,
  getTypeCallSignatures,
  getTypeMembers,
  resolveTypeExport,
} from './module-entry';

function exportBase(
  name: string,
  displayKind: ReferenceExportBase['displayKind'],
): ReferenceExportBase {
  return {
    deprecated: null,
    description: '',
    displayKind,
    examples: [],
    location: {
      column: 1,
      file: 'src/a.ts',
      line: 1,
    },
    name,
    remarks: '',
    seeAlso: [],
    shape: '',
    tags: [],
    throws: [],
  };
}

function functionExport(
  name: string,
  displayKind: ReferenceExportBase['displayKind'] = 'function',
): ReferenceExport {
  return {
    ...exportBase(name, displayKind),
    kind: 'function',
    members: [],
    overloads: [],
  };
}

function variableExport(
  name: string,
  options: {
    displayKind?: ReferenceExportBase['displayKind'];
    members?: ReferenceMember[];
    type?: TypeToken[];
  } = {},
): ReferenceExport {
  return {
    ...exportBase(name, options.displayKind ?? 'variable'),
    kind: 'variable',
    members: options.members ?? [],
    type: options.type ?? [],
  };
}

function interfaceExport(
  name: string,
  options: {
    callSignatures?: ReferenceCallSignature[];
    members?: ReferenceMember[];
  } = {},
): ReferenceExport {
  return {
    ...exportBase(name, 'interface'),
    callSignatures: options.callSignatures ?? [],
    kind: 'interface',
    members: options.members ?? [],
    signature: '',
  };
}

function typeExport(
  name: string,
  options: {
    callSignatures?: ReferenceCallSignature[];
    members?: ReferenceMember[];
  } = {},
): ReferenceExport {
  return {
    ...exportBase(name, 'type'),
    callSignatures: options.callSignatures ?? [],
    kind: 'type',
    members: options.members ?? [],
    resolvedType: [],
    signature: '',
  };
}

function documentedProperty(name: string): ReferencePropertyMember {
  return {
    defaultValue: null,
    description: 'a documented field',
    kind: 'property',
    name,
    optional: false,
    type: [],
  };
}

describe('expandModuleEntries', () => {
  it('emits the function-symbol entry with the `()` label', () => {
    const entries = expandModuleEntries([
      functionExport('greet'),
    ]);
    expect(entries).toEqual([
      {
        description: '',
        kind: 'function',
        label: 'greet()',
        segment: 'greet',
      },
    ]);
  });

  it('emits the variable as a pure namespace when its type carries documented members and no call signatures', () => {
    const format = interfaceExport('Format', {
      members: [
        documentedProperty('number'),
      ],
    });
    const variable = variableExport('format', {
      type: [
        {
          kind: 'ref',
          module: '.',
          name: 'Format',
          text: 'Format',
        },
      ],
    });
    const entries = expandModuleEntries([
      variable,
      format,
    ]);
    expect(entries.find((entry) => entry.segment === 'format')).toBeUndefined();
    expect(
      entries.find((entry) => entry.segment === 'format.number'),
    ).toBeDefined();
  });

  it('emits the variable as callable when displayKind is `function`', () => {
    const entries = expandModuleEntries([
      variableExport('t', {
        displayKind: 'function',
      }),
    ]);
    expect(entries[0]?.label).toBe('t()');
  });

  it('emits members for a variable carrying documented members', () => {
    const entries = expandModuleEntries([
      variableExport('format', {
        displayKind: 'function',
        members: [
          documentedProperty('number'),
        ],
      }),
    ]);
    expect(entries.map((entry) => entry.segment)).toEqual([
      'format',
      'format.number',
    ]);
  });

  it('emits a non-function non-variable export unchanged', () => {
    const entries = expandModuleEntries([
      interfaceExport('Locale'),
    ]);
    expect(entries).toEqual([
      {
        description: '',
        kind: 'interface',
        label: 'Locale',
        segment: 'Locale',
      },
    ]);
  });
});

describe('formatSymbolLabel', () => {
  it('builds the `<name>` label when kind is `component`', () => {
    expect(formatSymbolLabel('Button', 'component')).toBe('<Button>');
  });

  it('builds the `name()` label when kind is `function`', () => {
    expect(formatSymbolLabel('greet', 'function')).toBe('greet()');
  });

  it('builds the `name` label when kind is `interface`', () => {
    expect(formatSymbolLabel('Locale', 'interface')).toBe('Locale');
  });
});

describe('getTypeCallSignatures', () => {
  it('returns no call signatures when typeExport is `undefined`', () => {
    expect(getTypeCallSignatures(undefined)).toEqual([]);
  });

  it('returns the call signatures when typeExport kind is `interface`', () => {
    const signatures: ReferenceCallSignature[] = [
      {
        parameters: [],
        returnType: [],
        signature: '(): void',
        typeParameters: [],
      },
    ];
    expect(
      getTypeCallSignatures(
        interfaceExport('Callable', {
          callSignatures: signatures,
        }),
      ),
    ).toEqual(signatures);
  });
});

describe('getTypeMembers', () => {
  it('returns no members when typeExport is `undefined`', () => {
    expect(getTypeMembers(undefined)).toEqual([]);
  });

  it('returns the members when typeExport kind is `type`', () => {
    const member = documentedProperty('a');
    expect(
      getTypeMembers(
        typeExport('Foo', {
          members: [
            member,
          ],
        }),
      ),
    ).toEqual([
      member,
    ]);
  });
});

describe('resolveTypeExport', () => {
  it('returns the export when the type identifier matches a name in the map', () => {
    const target = interfaceExport('Format');
    const map = new Map<string, ReferenceExport>([
      [
        'Format',
        target,
      ],
    ]);
    const tokens: TypeToken[] = [
      {
        kind: 'ref',
        module: '.',
        name: 'Format',
        text: 'Format',
      },
    ];
    expect(resolveTypeExport(tokens, map)).toBe(target);
  });

  it('returns `undefined` when no type identifier is found', () => {
    const map = new Map<string, ReferenceExport>();
    const tokens: TypeToken[] = [
      {
        kind: 'text',
        text: 'string',
      },
    ];
    expect(resolveTypeExport(tokens, map)).toBeUndefined();
  });
});

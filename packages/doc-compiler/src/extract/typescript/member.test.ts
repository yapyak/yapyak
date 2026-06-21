import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { extractMembers } from './member';

const CONTEXT = {
  packageDir: '/tmp',
};

function parseTypeLiteral(source: string): ts.TypeLiteralNode {
  const sourceFile = ts.createSourceFile(
    'a.ts',
    `type Probe = ${source};`,
    ts.ScriptTarget.Latest,
    true,
  );
  const alias = sourceFile.statements.find(ts.isTypeAliasDeclaration);
  if (alias === undefined || !ts.isTypeLiteralNode(alias.type)) {
    throw new Error('expected a type literal');
  }
  return alias.type;
}

describe('extractMembers', () => {
  it('extracts property name, optionality, and type tokens', () => {
    const literal = parseTypeLiteral('{ greeting: string; count?: number }');
    expect(extractMembers(literal.members, CONTEXT)).toEqual([
      {
        defaultValue: null,
        description: '',
        kind: 'property',
        name: 'greeting',
        optional: false,
        type: [
          {
            kind: 'text',
            text: 'string',
          },
        ],
      },
      {
        defaultValue: null,
        description: '',
        kind: 'property',
        name: 'count',
        optional: true,
        type: [
          {
            kind: 'text',
            text: 'number',
          },
        ],
      },
    ]);
  });

  it('reads each property description from its leading JSDoc comment', () => {
    const literal = parseTypeLiteral(
      '{\n  /** The greeting label. */\n  greeting: string;\n}',
    );
    expect(extractMembers(literal.members, CONTEXT)[0]?.description).toBe(
      'The greeting label.',
    );
  });

  it('reads `@defaultValue` tags into the defaultValue field', () => {
    const literal = parseTypeLiteral(
      '{\n  /**\n   * Retry count.\n   * @defaultValue `2`\n   */\n  retries?: number;\n}',
    );
    const [member] = extractMembers(literal.members, CONTEXT);
    if (member?.kind !== 'property') {
      throw new Error('expected a property member');
    }
    expect(member.defaultValue).toBe('`2`');
  });

  it('groups consecutive method signatures with the same name into one method member', () => {
    const literal = parseTypeLiteral(
      '{\n  as<T extends string>(context: T): void;\n  as<T extends string>(context: T, source: string): string;\n}',
    );
    const members = extractMembers(literal.members, CONTEXT);
    expect(members).toHaveLength(1);
    const [member] = members;
    if (member?.kind !== 'method') {
      throw new Error('expected a method member');
    }
    expect(member.name).toBe('as');
    expect(member.overloads).toHaveLength(2);
  });
});

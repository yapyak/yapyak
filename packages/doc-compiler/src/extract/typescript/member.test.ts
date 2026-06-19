import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { extractMembers } from './member';

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
    expect(extractMembers(literal.members)).toEqual([
      {
        defaultValue: null,
        description: '',
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
    expect(extractMembers(literal.members)[0]?.description).toBe(
      'The greeting label.',
    );
  });

  it('reads `@defaultValue` tags into the defaultValue field', () => {
    const literal = parseTypeLiteral(
      '{\n  /**\n   * Retry count.\n   * @defaultValue `2`\n   */\n  retries?: number;\n}',
    );
    expect(extractMembers(literal.members)[0]?.defaultValue).toBe('`2`');
  });
});

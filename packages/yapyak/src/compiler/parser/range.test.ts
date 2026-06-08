import type { Fragment } from '../../processor';

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { remapRange, toRange } from './range';

function makeNode(source: string): {
  node: ts.Node;
  sourceFile: ts.SourceFile;
} {
  const sourceFile = ts.createSourceFile(
    'test.ts',
    source,
    ts.ScriptTarget.ESNext,
    true,
  );
  const statement = sourceFile.statements[0];
  if (!statement) {
    throw new Error('test setup expects at least one statement');
  }
  return { node: statement, sourceFile };
}

const fragment: Fragment = {
  code: '',
  kind: 'script',
  lang: 'ts',
  originalOffset: 0,
};

describe('remapRange', () => {
  it('returns the range unchanged when the fragment originalOffset is zero', () => {
    const range = {
      end: { column: 5, line: 1, offset: 4 },
      start: { column: 1, line: 1, offset: 0 },
    };
    expect(remapRange(range, fragment, 'source')).toEqual(range);
  });

  it('builds a range with both endpoints remapped when offset is non-zero', () => {
    const result = remapRange(
      {
        end: { column: 6, line: 1, offset: 5 },
        start: { column: 1, line: 1, offset: 0 },
      },
      { ...fragment, originalOffset: 6 },
      'first\nsecond',
    );
    expect(result).toEqual({
      end: { column: 6, line: 2, offset: 11 },
      start: { column: 1, line: 2, offset: 6 },
    });
  });
});

describe('toRange', () => {
  it('builds a range from a node start and end positions', () => {
    const { node, sourceFile } = makeNode('export const x = 1;');
    expect(toRange(node, sourceFile)).toEqual({
      end: { column: 20, line: 1, offset: 19 },
      start: { column: 1, line: 1, offset: 0 },
    });
  });
});

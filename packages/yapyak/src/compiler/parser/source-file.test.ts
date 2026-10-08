import { describe, expect, it } from 'vitest';

import { parseSourceFile } from './source-file';

describe('parseSourceFile', () => {
  it('parses src/a.ts as TS', () => {
    const sourceFile = parseSourceFile('src/a.ts', {
      code: "t('Hello');",
      language: 'ts',
      type: 'script',
    });

    expect(sourceFile.lang).toBe('ts');
    expect(sourceFile.fatalError).toBeUndefined();
  });

  it('parses src/a.tsx as TSX', () => {
    const sourceFile = parseSourceFile('src/a.tsx', {
      code: "<p>{t('Hello')}</p>;",
      language: 'ts',
      type: 'script',
    });

    expect(sourceFile.lang).toBe('tsx');
    expect(sourceFile.fatalError).toBeUndefined();
  });

  it('parses src/a.jsx as JSX', () => {
    const sourceFile = parseSourceFile('src/a.jsx', {
      code: "<p>{t('Hello')}</p>;",
      language: 'ts',
      type: 'script',
    });

    expect(sourceFile.lang).toBe('jsx');
    expect(sourceFile.fatalError).toBeUndefined();
  });

  it('parses a `tsx` fragment as TSX', () => {
    const sourceFile = parseSourceFile('src/a.astro', {
      code: "<p>{t('Hello')}</p>;",
      language: 'tsx',
      type: 'script',
    });

    expect(sourceFile.lang).toBe('tsx');
  });

  it('parses a `js` fragment as JSX', () => {
    const sourceFile = parseSourceFile('src/a.vue', {
      code: "<p>{t('Hello')}</p>;",
      language: 'js',
      type: 'script',
    });

    expect(sourceFile.lang).toBe('jsx');
  });

  it('parses src/a.d.ts as a declaration file', () => {
    const sourceFile = parseSourceFile('src/a.d.ts', {
      code: 'export const label: string;',
      language: 'ts',
      type: 'script',
    });

    expect(sourceFile.lang).toBe('dts');
    expect(sourceFile.fatalError).toBeUndefined();
  });

  it('maps every node to its parent', () => {
    const sourceFile = parseSourceFile('src/a.ts', {
      code: "t('Hello');",
      language: 'ts',
      type: 'script',
    });
    const [statement] = sourceFile.program.body;
    if (statement?.type !== 'ExpressionStatement') {
      throw new Error('test setup expects an expression statement');
    }

    expect(statement.parent).toBe(sourceFile.program);
    expect(statement.expression.parent).toBe(statement);
  });

  it('lists the line starts of the code', () => {
    const sourceFile = parseSourceFile('src/a.ts', {
      code: "t('Hello');\nt('World');",
      language: 'ts',
      type: 'script',
    });

    expect(sourceFile.lineStarts).toEqual([
      0,
      12,
    ]);
  });

  it('preserves the tree when an error is recoverable', () => {
    const sourceFile = parseSourceFile('src/a.ts', {
      code: "return t('Hello');",
      language: 'ts',
      type: 'script',
    });

    expect(sourceFile.fatalError).toBeUndefined();
    expect(sourceFile.program.body).toHaveLength(1);
  });

  it('parses a template expression that is an object literal as an expression', () => {
    const code = "{ title: t('Hello'), body: t('World') }";
    const sourceFile = parseSourceFile('src/a.vue', {
      code,
      language: 'ts',
      type: 'template-expression',
    });
    const [statement] = sourceFile.program.body;
    if (statement?.type !== 'ExpressionStatement') {
      throw new Error('test setup expects an expression statement');
    }
    const [property] =
      statement.expression.type === 'ObjectExpression'
        ? statement.expression.properties
        : [];

    expect(sourceFile.fatalError).toBeUndefined();
    expect(statement.start).toBe(0);
    expect(statement.end).toBe(code.length);
    expect(property?.start).toBe(code.indexOf('title'));
  });

  it('records the fatal error when a script does not parse', () => {
    const sourceFile = parseSourceFile('src/a.ts', {
      code: "t('Hello';",
      language: 'ts',
      type: 'script',
    });

    expect(sourceFile.fatalError?.message).toMatch(/Expected/);
    expect(sourceFile.program.body).toHaveLength(0);
  });

  it('records the fatal error when a template expression parses neither as statements nor as an expression', () => {
    const sourceFile = parseSourceFile('src/a.vue', {
      code: 'item of items',
      language: 'ts',
      type: 'template-expression',
    });

    expect(sourceFile.fatalError).toBeDefined();
    expect(sourceFile.program.body).toHaveLength(0);
  });
});

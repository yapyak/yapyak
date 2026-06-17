import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { resolveBindings } from './binding';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const FIXTURES = join(import.meta.dirname, 'fixture/binding');

function loadFixture(name: string): ts.SourceFile {
  const source = readFileSync(join(FIXTURES, name), 'utf-8');
  return ts.createSourceFile(
    name,
    source,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );
}

function parseSource(source: string): ts.SourceFile {
  return ts.createSourceFile(
    'inline.ts',
    source,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );
}

function findFirstCallExpression(
  node: ts.Node,
  name: string,
): ts.CallExpression | undefined {
  let found: ts.CallExpression | undefined;
  const visit = (n: ts.Node): void => {
    if (found !== undefined) {
      return;
    }
    if (
      ts.isCallExpression(n) &&
      ts.isIdentifier(n.expression) &&
      n.expression.text === name
    ) {
      found = n;
      return;
    }
    ts.forEachChild(n, visit);
  };
  visit(node);
  return found;
}

function findCallBindingKind(
  source: string,
  callName: string,
): string | undefined {
  const sourceFile = parseSource(source);
  const table = resolveBindings(sourceFile);
  const call = findFirstCallExpression(sourceFile, callName);
  expect(call).toBeDefined();
  return table.find(callName, call as ts.Node)?.kind;
}

function findFirstIfStatement(node: ts.Node): ts.IfStatement | undefined {
  let found: ts.IfStatement | undefined;
  const visit = (n: ts.Node): void => {
    if (found !== undefined) {
      return;
    }
    if (ts.isIfStatement(n)) {
      found = n;
      return;
    }
    ts.forEachChild(n, visit);
  };
  visit(node);
  return found;
}

describe('resolveBindings', () => {
  it('returns a direct binding for a direct import', () => {
    const sourceFile = loadFixture('direct-import.ts');
    const table = resolveBindings(sourceFile);
    const binding = table.root.bindings.get('t');
    expect(binding).toBeDefined();
    expect(binding?.kind).toBe('direct');
    expect(binding?.localName).toBe('t');
  });

  it('returns a direct binding for an aliased import', () => {
    const sourceFile = loadFixture('aliased-import.ts');
    const table = resolveBindings(sourceFile);
    const binding = table.root.bindings.get('tr');
    expect(binding?.kind).toBe('direct');
    expect(binding?.localName).toBe('tr');
    expect(table.root.bindings.has('t')).toBe(false);
  });

  it('returns a namespace binding for a namespace import', () => {
    const sourceFile = loadFixture('namespace-import.ts');
    const table = resolveBindings(sourceFile);
    const binding = table.root.bindings.get('y');
    expect(binding?.kind).toBe('namespace');
    expect(binding?.localName).toBe('y');
  });

  it('returns a wrapper binding at root scope', () => {
    const sourceFile = loadFixture('wrapper.ts');
    const table = resolveBindings(sourceFile);
    expect(table.root.bindings.get('t')?.kind).toBe('direct');
    const wrapper = table.root.bindings.get('translate');
    expect(wrapper?.kind).toBe('wrapper');
    expect(wrapper?.localName).toBe('translate');
  });

  it('returns a nested wrapper binding scoped to its block', () => {
    const sourceFile = loadFixture('shadowed-wrapper.ts');
    const table = resolveBindings(sourceFile);

    expect(table.root.bindings.get('t')?.kind).toBe('direct');
    expect(table.root.bindings.has('translate')).toBe(false);

    const ifStmt = findFirstIfStatement(sourceFile);
    expect(ifStmt).toBeDefined();
    const thenBlock = ifStmt?.thenStatement;
    expect(thenBlock).toBeDefined();
    const innerCall = findFirstCallExpression(
      thenBlock as ts.Node,
      'translate',
    );
    expect(innerCall).toBeDefined();
    expect(table.find('translate', innerCall as ts.Node)?.kind).toBe('wrapper');

    expect(table.find('translate', sourceFile)).toBeUndefined();
  });

  it('returns the binding by walking up the scope chain', () => {
    const sourceFile = loadFixture('direct-import.ts');
    const table = resolveBindings(sourceFile);
    const call = findFirstCallExpression(sourceFile, 't');
    expect(call).toBeDefined();
    expect(table.find('t', call as ts.Node)?.kind).toBe('direct');
  });

  it('returns no binding for an import from a different module', () => {
    const sourceFile = parseSource("import { t } from 'other';");
    const table = resolveBindings(sourceFile);
    expect(table.root.bindings.size).toBe(0);
  });

  it('returns no binding for a side-effect import of `yapyak`', () => {
    const sourceFile = parseSource("import 'yapyak';");
    const table = resolveBindings(sourceFile);
    expect(table.root.bindings.size).toBe(0);
  });

  it('returns no binding for a default-only import of `yapyak`', () => {
    const sourceFile = parseSource("import t from 'yapyak';");
    const table = resolveBindings(sourceFile);
    expect(table.root.bindings.size).toBe(0);
  });

  it('returns no wrapper binding for a variable assigned an unknown identifier', () => {
    const sourceFile = parseSource(
      "import { t } from 'yapyak';\nconst translate = somethingUnknown;",
    );
    const table = resolveBindings(sourceFile);
    expect(table.root.bindings.has('translate')).toBe(false);
  });

  it('preserves the namespace kind for a variable aliased to a namespace import', () => {
    const sourceFile = parseSource(
      "import * as y from 'yapyak';\nconst x = y;",
    );
    const table = resolveBindings(sourceFile);
    expect(table.root.bindings.get('x')?.kind).toBe('namespace');
  });

  it('returns a shadow binding for a function-declaration parameter named `t`', () => {
    expect(
      findCallBindingKind(
        "import { t } from 'yapyak';\nfunction f(t) { return t('Hello'); }",
        't',
      ),
    ).toBe('shadow');
  });

  it('returns a shadow binding for a function-expression parameter named `t`', () => {
    expect(
      findCallBindingKind(
        "import { t } from 'yapyak';\nconst f = function (t) { return t('Hello'); };",
        't',
      ),
    ).toBe('shadow');
  });

  it('returns a shadow binding for an arrow-function parameter named `t`', () => {
    expect(
      findCallBindingKind(
        "import { t } from 'yapyak';\nconst f = (t) => { return t('Hello'); };",
        't',
      ),
    ).toBe('shadow');
  });

  it('returns a shadow binding for an arrow-function expression-body parameter named `t`', () => {
    expect(
      findCallBindingKind(
        "import { t } from 'yapyak';\nconst f = (t) => t('Hello');",
        't',
      ),
    ).toBe('shadow');
  });

  it('returns a shadow binding for a method parameter named `t`', () => {
    expect(
      findCallBindingKind(
        "import { t } from 'yapyak';\nclass C { m(t) { return t('Hello'); } }",
        't',
      ),
    ).toBe('shadow');
  });

  it('returns a shadow binding for a constructor parameter named `t`', () => {
    expect(
      findCallBindingKind(
        "import { t } from 'yapyak';\nclass C { constructor(t) { t('Hello'); } }",
        't',
      ),
    ).toBe('shadow');
  });

  it('returns a shadow binding for a set-accessor parameter named `t`', () => {
    expect(
      findCallBindingKind(
        "import { t } from 'yapyak';\nclass C { set x(t) { t('Hello'); } }",
        't',
      ),
    ).toBe('shadow');
  });

  it('returns a shadow binding for a catch-clause variable named `t`', () => {
    expect(
      findCallBindingKind(
        "import { t } from 'yapyak';\ntry {} catch (t) { t('Hello'); }",
        't',
      ),
    ).toBe('shadow');
  });

  it('returns a shadow binding for a catch-clause object-destructured `{ t }`', () => {
    expect(
      findCallBindingKind(
        "import { t } from 'yapyak';\ntry {} catch ({ t }) { t('Hello'); }",
        't',
      ),
    ).toBe('shadow');
  });

  it('returns a shadow binding for an object-destructured parameter `{ t }`', () => {
    expect(
      findCallBindingKind(
        "import { t } from 'yapyak';\nfunction f({ t }) { return t('Hello'); }",
        't',
      ),
    ).toBe('shadow');
  });

  it('returns a shadow binding for an array-destructured parameter `[t]`', () => {
    expect(
      findCallBindingKind(
        "import { t } from 'yapyak';\nfunction f([t]) { return t('Hello'); }",
        't',
      ),
    ).toBe('shadow');
  });

  it('returns a shadow binding for a renamed object-destructured parameter `{ x: t }`', () => {
    expect(
      findCallBindingKind(
        "import { t } from 'yapyak';\nfunction f({ x: t }) { return t('Hello'); }",
        't',
      ),
    ).toBe('shadow');
  });

  it('returns a shadow binding for a rest parameter `...t`', () => {
    const sourceFile = parseSource(
      "import { t } from 'yapyak';\nfunction f(...t) { return t.length; }",
    );
    const table = resolveBindings(sourceFile);
    const functionDecl = sourceFile.statements.find(ts.isFunctionDeclaration);
    expect(functionDecl?.body).toBeDefined();
    expect(table.find('t', functionDecl?.body as ts.Node)?.kind).toBe('shadow');
  });

  it('returns a shadow binding for a parameter with default value `t = expr`', () => {
    expect(
      findCallBindingKind(
        "import { t } from 'yapyak';\nfunction f(t = () => '') { return t('Hello'); }",
        't',
      ),
    ).toBe('shadow');
  });

  it('returns a shadow binding for a nested function declaration `function t()`', () => {
    expect(
      findCallBindingKind(
        "import { t } from 'yapyak';\nfunction outer() { function t() { return ''; } return t('Hello'); }",
        't',
      ),
    ).toBe('shadow');
  });

  it('returns a shadow binding for a nested class declaration `class t`', () => {
    expect(
      findCallBindingKind(
        "import { t } from 'yapyak';\nfunction outer() { class t {} return t('Hello'); }",
        't',
      ),
    ).toBe('shadow');
  });

  it('returns a shadow binding for a nested `const t` declaration', () => {
    expect(
      findCallBindingKind(
        "import { t } from 'yapyak';\nfunction outer() { const t = () => ''; return t('Hello'); }",
        't',
      ),
    ).toBe('shadow');
  });

  it('returns a shadow binding for a nested `let t` declaration', () => {
    expect(
      findCallBindingKind(
        "import { t } from 'yapyak';\nfunction outer() { let t; t = () => ''; return t('Hello'); }",
        't',
      ),
    ).toBe('shadow');
  });

  it('returns a shadow binding for a nested `var t` declaration hoisted to the function scope', () => {
    expect(
      findCallBindingKind(
        "import { t } from 'yapyak';\nfunction outer() { if (true) { var t = () => ''; } return t('Hello'); }",
        't',
      ),
    ).toBe('shadow');
  });

  it('returns the direct binding when a sibling block has a `using t` shadow', () => {
    expect(
      findCallBindingKind(
        "import { t } from 'yapyak';\nfunction outer() { { using t = { [Symbol.dispose]() {} }; void t; } return t('Hello'); }",
        't',
      ),
    ).toBe('direct');
  });

  it('returns a shadow binding for a `for ... of` iteration variable named `t`', () => {
    expect(
      findCallBindingKind(
        "import { t } from 'yapyak';\nfor (const t of []) { t('Hello'); }",
        't',
      ),
    ).toBe('shadow');
  });

  it('returns a shadow binding for a `for` init declaration named `t`', () => {
    expect(
      findCallBindingKind(
        "import { t } from 'yapyak';\nfor (let t = () => ''; ; ) { t('Hello'); break; }",
        't',
      ),
    ).toBe('shadow');
  });

  it('returns a shadow binding for an object-destructured `const { t }`', () => {
    expect(
      findCallBindingKind(
        "import { t } from 'yapyak';\nfunction outer() { const { t } = { t: () => '' }; return t('Hello'); }",
        't',
      ),
    ).toBe('shadow');
  });

  it('returns the direct binding for a callsite outside any shadowing scope', () => {
    expect(
      findCallBindingKind(
        "import { t } from 'yapyak';\nfunction inner(other) { return other('x'); }\nexport const result = t('Hello');",
        't',
      ),
    ).toBe('direct');
  });
});

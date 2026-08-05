import ts from '@typescript/typescript6';
import { describe, expect, it } from 'vitest';

import { resolveBindings } from './binding';
import { discoverCalls } from './call';
import { resolveCallSiteContext } from './call-site-context';

function parseInline(source: string, fileName = 'src/a.tsx'): ts.SourceFile {
  const scriptKind = fileName.endsWith('.tsx')
    ? ts.ScriptKind.TSX
    : ts.ScriptKind.TS;
  return ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.ESNext,
    true,
    scriptKind,
  );
}

function findCalls(sourceFile: ts.SourceFile): ts.CallExpression[] {
  return discoverCalls(sourceFile, resolveBindings(sourceFile)).callSites.map(
    (callSite) => callSite.node,
  );
}

function findFirstCall(sourceFile: ts.SourceFile): ts.CallExpression {
  const [call] = findCalls(sourceFile);
  if (!call) {
    throw new Error('expected at least one call site');
  }
  return call;
}

describe('resolveCallSiteContext', () => {
  it('returns the function component name', () => {
    const sourceFile = parseInline(`
      import { t } from 'yapyak';
      export function Greeting() {
        return t('Hello');
      }
    `);
    const context = resolveCallSiteContext(
      findFirstCall(sourceFile),
      sourceFile,
    );
    expect(context.enclosingComponent).toBe('Greeting');
  });

  it('returns the arrow component name from its variable declaration', () => {
    const sourceFile = parseInline(`
      import { t } from 'yapyak';
      export const Greeting = () => t('Hello');
    `);
    const context = resolveCallSiteContext(
      findFirstCall(sourceFile),
      sourceFile,
    );
    expect(context.enclosingComponent).toBe('Greeting');
  });

  it('returns the `forwardRef` component name', () => {
    const sourceFile = parseInline(`
      import { t } from 'yapyak';
      const forwardRef = (fn: unknown) => fn;
      export const Greeting = forwardRef(() => t('Hello'));
    `);
    const context = resolveCallSiteContext(
      findFirstCall(sourceFile),
      sourceFile,
    );
    expect(context.enclosingComponent).toBe('Greeting');
  });

  it('returns the `memo` component name', () => {
    const sourceFile = parseInline(`
      import { t } from 'yapyak';
      const memo = (fn: unknown) => fn;
      export const Greeting = memo(() => t('Hello'));
    `);
    const context = resolveCallSiteContext(
      findFirstCall(sourceFile),
      sourceFile,
    );
    expect(context.enclosingComponent).toBe('Greeting');
  });

  it('returns no component name for a hook', () => {
    const sourceFile = parseInline(`
      import { t } from 'yapyak';
      export function useGreeting() {
        return t('Hello');
      }
    `);
    const context = resolveCallSiteContext(
      findFirstCall(sourceFile),
      sourceFile,
    );
    expect(context.enclosingComponent).toBeUndefined();
  });

  it('returns the outer component name through a nested hook', () => {
    const sourceFile = parseInline(`
      import { t } from 'yapyak';
      export function Greeting() {
        function useLabel() {
          return t('Hello');
        }
        return useLabel();
      }
    `);
    const context = resolveCallSiteContext(
      findFirstCall(sourceFile),
      sourceFile,
    );
    expect(context.enclosingComponent).toBe('Greeting');
  });

  it('returns the closest enclosing JSX element tag', () => {
    const sourceFile = parseInline(`
      import { t } from 'yapyak';
      export function Greeting() {
        return <article><header><h1>{t('Hello')}</h1></header></article>;
      }
    `);
    const context = resolveCallSiteContext(
      findFirstCall(sourceFile),
      sourceFile,
    );
    expect(context.enclosingElement).toBe('h1');
    expect(context.enclosingComponent).toBe('Greeting');
  });

  it('returns the enclosing element source as the snippet', () => {
    const sourceFile = parseInline(`
      import { t } from 'yapyak';
      export function Greeting() {
        return <button>{t('Save')}</button>;
      }
    `);
    const context = resolveCallSiteContext(
      findFirstCall(sourceFile),
      sourceFile,
    );
    expect(context.snippet).toBe(`<button>{t('Save')}</button>`);
  });

  it('returns the JSX tag for a self-closing element', () => {
    const sourceFile = parseInline(`
      import { t } from 'yapyak';
      export function Greeting() {
        return <Button label={t('Save')} />;
      }
    `);
    const context = resolveCallSiteContext(
      findFirstCall(sourceFile),
      sourceFile,
    );
    expect(context.enclosingElement).toBe('Button');
  });

  it('returns the full namespaced JSX tag', () => {
    const sourceFile = parseInline(`
      import { t } from 'yapyak';
      const Menu = { Item: (p: { children: unknown }) => p.children };
      export function Greeting() {
        return <Menu.Item>{t('Save')}</Menu.Item>;
      }
    `);
    const context = resolveCallSiteContext(
      findFirstCall(sourceFile),
      sourceFile,
    );
    expect(context.enclosingElement).toBe('Menu.Item');
  });

  it('returns context for every call in a nested JSX fixture', () => {
    const sourceFile = parseInline(
      `
        import { t } from 'yapyak';
        export function Greeting({ name }: { name: string }) {
          return (
            <article>
              <header><h1>{t('Hello')}</h1></header>
              <section>
                <p>{t('Hi {name}', { name })}</p>
                <button type="button">{t('Save')}</button>
              </section>
            </article>
          );
        }
      `,
      'src/a.tsx',
    );
    const calls = findCalls(sourceFile);
    expect(calls).toHaveLength(3);
    const contexts = calls.map((call) =>
      resolveCallSiteContext(call, sourceFile),
    );
    expect(contexts[0]?.enclosingElement).toBe('h1');
    expect(contexts[1]?.enclosingElement).toBe('p');
    expect(contexts[2]?.enclosingElement).toBe('button');
    for (const context of contexts) {
      expect(context.enclosingComponent).toBe('Greeting');
    }
  });

  it('returns an empty context for a top-level call', () => {
    const sourceFile = parseInline(`
      import { t } from 'yapyak';
      export const greeting = t('Hello');
    `);
    const context = resolveCallSiteContext(
      findFirstCall(sourceFile),
      sourceFile,
    );
    expect(context.enclosingComponent).toBeUndefined();
    expect(context.enclosingElement).toBeUndefined();
  });

  it('returns no component name for non-HOC callbacks', () => {
    const sourceFile = parseInline(`
      import { t } from 'yapyak';
      const items = ['a'].map((item) => t('Item: {item}', { item }));
    `);
    const context = resolveCallSiteContext(
      findFirstCall(sourceFile),
      sourceFile,
    );
    expect(context.enclosingComponent).toBeUndefined();
  });

  it('returns no component name for `t()` inside a class method', () => {
    const sourceFile = parseInline(`
      import { t } from 'yapyak';
      class Service {
        render() {
          return t('Hello');
        }
      }
    `);
    const context = resolveCallSiteContext(
      findFirstCall(sourceFile),
      sourceFile,
    );
    expect(context.enclosingComponent).toBeUndefined();
  });

  it('returns the component name from a named function expression', () => {
    const sourceFile = parseInline(`
      import { t } from 'yapyak';
      export const greeting = (function Greeting() { return t('Hello'); })();
    `);
    const context = resolveCallSiteContext(
      findFirstCall(sourceFile),
      sourceFile,
    );
    expect(context.enclosingComponent).toBe('Greeting');
  });

  it('returns no component name for `t()` inside a non-HOC bare function call', () => {
    const sourceFile = parseInline(`
      import { t } from 'yapyak';
      function wrap(fn: () => string) { return fn(); }
      export const greeting = wrap(() => t('Hello'));
    `);
    const context = resolveCallSiteContext(
      findFirstCall(sourceFile),
      sourceFile,
    );
    expect(context.enclosingComponent).toBeUndefined();
  });
});

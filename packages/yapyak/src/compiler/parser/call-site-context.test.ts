import * as ts from 'typescript';
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

function findCalls(sf: ts.SourceFile): ts.CallExpression[] {
  return discoverCalls(sf, resolveBindings(sf)).callSites.map((c) => c.node);
}

function findFirstCall(sf: ts.SourceFile): ts.CallExpression {
  const [call] = findCalls(sf);
  if (!call) {
    throw new Error('expected at least one call site');
  }
  return call;
}

describe('resolveCallSiteContext', () => {
  it('returns the function component name', () => {
    const sf = parseInline(`
      import { t } from 'yapyak';
      export function Greeting() {
        return t('Hello');
      }
    `);
    const ctx = resolveCallSiteContext(findFirstCall(sf), sf);
    expect(ctx.componentName).toBe('Greeting');
  });

  it('returns the arrow component name from its variable declaration', () => {
    const sf = parseInline(`
      import { t } from 'yapyak';
      export const Greeting = () => t('Hello');
    `);
    const ctx = resolveCallSiteContext(findFirstCall(sf), sf);
    expect(ctx.componentName).toBe('Greeting');
  });

  it('returns the `forwardRef` component name', () => {
    const sf = parseInline(`
      import { t } from 'yapyak';
      const forwardRef = (fn: unknown) => fn;
      export const Greeting = forwardRef(() => t('Hello'));
    `);
    const ctx = resolveCallSiteContext(findFirstCall(sf), sf);
    expect(ctx.componentName).toBe('Greeting');
  });

  it('returns the `memo` component name', () => {
    const sf = parseInline(`
      import { t } from 'yapyak';
      const memo = (fn: unknown) => fn;
      export const Greeting = memo(() => t('Hello'));
    `);
    const ctx = resolveCallSiteContext(findFirstCall(sf), sf);
    expect(ctx.componentName).toBe('Greeting');
  });

  it('returns no component name for a hook', () => {
    const sf = parseInline(`
      import { t } from 'yapyak';
      export function useGreeting() {
        return t('Hello');
      }
    `);
    const ctx = resolveCallSiteContext(findFirstCall(sf), sf);
    expect(ctx.componentName).toBeUndefined();
  });

  it('returns the outer component name through a nested hook', () => {
    const sf = parseInline(`
      import { t } from 'yapyak';
      export function Greeting() {
        function useLabel() {
          return t('Hello');
        }
        return useLabel();
      }
    `);
    const ctx = resolveCallSiteContext(findFirstCall(sf), sf);
    expect(ctx.componentName).toBe('Greeting');
  });

  it('returns the closest enclosing JSX element tag', () => {
    const sf = parseInline(`
      import { t } from 'yapyak';
      export function Greeting() {
        return <article><header><h1>{t('Hello')}</h1></header></article>;
      }
    `);
    const ctx = resolveCallSiteContext(findFirstCall(sf), sf);
    expect(ctx.enclosingJsx).toBe('h1');
    expect(ctx.componentName).toBe('Greeting');
  });

  it('returns the JSX tag for a self-closing element', () => {
    const sf = parseInline(`
      import { t } from 'yapyak';
      export function Greeting() {
        return <Button label={t('Save')} />;
      }
    `);
    const ctx = resolveCallSiteContext(findFirstCall(sf), sf);
    expect(ctx.enclosingJsx).toBe('Button');
  });

  it('returns the full namespaced JSX tag', () => {
    const sf = parseInline(`
      import { t } from 'yapyak';
      const Menu = { Item: (p: { children: unknown }) => p.children };
      export function Greeting() {
        return <Menu.Item>{t('Save')}</Menu.Item>;
      }
    `);
    const ctx = resolveCallSiteContext(findFirstCall(sf), sf);
    expect(ctx.enclosingJsx).toBe('Menu.Item');
  });

  it('returns context for every call in a nested JSX fixture', () => {
    const sf = parseInline(
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
    const calls = findCalls(sf);
    expect(calls).toHaveLength(3);
    const contexts = calls.map((c) => resolveCallSiteContext(c, sf));
    expect(contexts[0]?.enclosingJsx).toBe('h1');
    expect(contexts[1]?.enclosingJsx).toBe('p');
    expect(contexts[2]?.enclosingJsx).toBe('button');
    for (const ctx of contexts) {
      expect(ctx.componentName).toBe('Greeting');
    }
  });

  it('returns an empty context for a top-level call', () => {
    const sf = parseInline(`
      import { t } from 'yapyak';
      export const greeting = t('Hello');
    `);
    const ctx = resolveCallSiteContext(findFirstCall(sf), sf);
    expect(ctx.componentName).toBeUndefined();
    expect(ctx.enclosingJsx).toBeUndefined();
  });

  it('returns no component name for non-HOC callbacks', () => {
    const sf = parseInline(`
      import { t } from 'yapyak';
      const items = ['a'].map((item) => t('Item: {item}', { item }));
    `);
    const ctx = resolveCallSiteContext(findFirstCall(sf), sf);
    expect(ctx.componentName).toBeUndefined();
  });
});

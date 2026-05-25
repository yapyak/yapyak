import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { resolveCallSiteContext } from './call-site-context';
import { discoverCalls } from './discover-calls';
import { resolveBindings } from './resolve-bindings';

function parseInline(source: string, fileName = 'test.tsx'): ts.SourceFile {
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
  return discoverCalls(sf, resolveBindings(sf)).map((c) => c.node);
}

describe('resolveCallSiteContext', () => {
  it('detects function component name', () => {
    const sf = parseInline(`
      import { $t } from 'yapyak';
      export function Greeting() {
        return $t('Hello');
      }
    `);
    const [call] = findCalls(sf);
    const ctx = resolveCallSiteContext(call!, sf);
    expect(ctx.componentName).toBe('Greeting');
    expect(ctx.enclosingFunction).toBe('Greeting');
    expect(ctx.enclosingHook).toBeUndefined();
  });

  it('detects arrow component via variable declaration', () => {
    const sf = parseInline(`
      import { $t } from 'yapyak';
      export const Greeting = () => $t('Hello');
    `);
    const [call] = findCalls(sf);
    const ctx = resolveCallSiteContext(call!, sf);
    expect(ctx.componentName).toBe('Greeting');
  });

  it('detects forwardRef component', () => {
    const sf = parseInline(`
      import { $t } from 'yapyak';
      const forwardRef = (fn: unknown) => fn;
      export const Greeting = forwardRef(() => $t('Hello'));
    `);
    const [call] = findCalls(sf);
    const ctx = resolveCallSiteContext(call!, sf);
    expect(ctx.componentName).toBe('Greeting');
  });

  it('detects memo component', () => {
    const sf = parseInline(`
      import { $t } from 'yapyak';
      const memo = (fn: unknown) => fn;
      export const Greeting = memo(() => $t('Hello'));
    `);
    const [call] = findCalls(sf);
    const ctx = resolveCallSiteContext(call!, sf);
    expect(ctx.componentName).toBe('Greeting');
  });

  it('does not misattribute name from non-HOC callbacks', () => {
    const sf = parseInline(`
      import { $t } from 'yapyak';
      const items = ['a'].map((item) => $t('Item: {item}', { item }));
    `);
    const [call] = findCalls(sf);
    const ctx = resolveCallSiteContext(call!, sf);
    expect(ctx.componentName).toBeUndefined();
    expect(ctx.enclosingFunction).toBeUndefined();
  });

  it('detects hook name', () => {
    const sf = parseInline(`
      import { $t } from 'yapyak';
      export function useGreeting() {
        return $t('Hello');
      }
    `);
    const [call] = findCalls(sf);
    const ctx = resolveCallSiteContext(call!, sf);
    expect(ctx.enclosingHook).toBe('useGreeting');
    expect(ctx.enclosingFunction).toBe('useGreeting');
    expect(ctx.componentName).toBeUndefined();
  });

  it('detects component AND nested hook', () => {
    const sf = parseInline(`
      import { $t } from 'yapyak';
      export function Greeting() {
        function useLabel() {
          return $t('Hello');
        }
        return useLabel();
      }
    `);
    const [call] = findCalls(sf);
    const ctx = resolveCallSiteContext(call!, sf);
    expect(ctx.enclosingFunction).toBe('useLabel');
    expect(ctx.enclosingHook).toBe('useLabel');
    expect(ctx.componentName).toBe('Greeting');
  });

  it('detects closest enclosing JSX element', () => {
    const sf = parseInline(`
      import { $t } from 'yapyak';
      export function Greeting() {
        return <article><header><h1>{$t('Welcome')}</h1></header></article>;
      }
    `);
    const [call] = findCalls(sf);
    const ctx = resolveCallSiteContext(call!, sf);
    expect(ctx.enclosingJsx).toBe('h1');
    expect(ctx.componentName).toBe('Greeting');
  });

  it('detects JSX inside self-closing element', () => {
    const sf = parseInline(`
      import { $t } from 'yapyak';
      export function Greeting() {
        return <Button label={$t('Save')} />;
      }
    `);
    const [call] = findCalls(sf);
    const ctx = resolveCallSiteContext(call!, sf);
    expect(ctx.enclosingJsx).toBe('Button');
  });

  it('detects namespaced JSX tag', () => {
    const sf = parseInline(`
      import { $t } from 'yapyak';
      const Menu = { Item: (p: { children: unknown }) => p.children };
      export function Greeting() {
        return <Menu.Item>{$t('Save')}</Menu.Item>;
      }
    `);
    const [call] = findCalls(sf);
    const ctx = resolveCallSiteContext(call!, sf);
    expect(ctx.enclosingJsx).toBe('Menu.Item');
  });

  it('returns empty context for top-level call', () => {
    const sf = parseInline(`
      import { $t } from 'yapyak';
      export const greeting = $t('Hello');
    `);
    const [call] = findCalls(sf);
    const ctx = resolveCallSiteContext(call!, sf);
    expect(ctx.componentName).toBeUndefined();
    expect(ctx.enclosingFunction).toBeUndefined();
    expect(ctx.enclosingHook).toBeUndefined();
    expect(ctx.enclosingJsx).toBeUndefined();
  });

  it('records context for every call in nested-jsx fixture', () => {
    const sf = parseInline(
      `
        import { $t } from 'yapyak';
        export function Greeting({ name }: { name: string }) {
          return (
            <article>
              <header><h1>{$t('Welcome')}</h1></header>
              <section>
                <p>{$t('Hi {name}', { name })}</p>
                <button type="button">{$t('Continue')}</button>
              </section>
            </article>
          );
        }
      `,
      'test.tsx',
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
});

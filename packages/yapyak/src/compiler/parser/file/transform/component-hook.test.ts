import type { ComponentHook, Fragment } from '../../../../processor';

import MagicString from 'magic-string';
import { describe, expect, it } from 'vitest';

import { segmentsFromOffset } from '../../../../processor';
import { parseSourceFile } from '../../source-file';
import { extractFile } from '../extract';
import { collectComponentHosts, injectComponentHooks } from './component-hook';
import { extractPrologueDirectives } from './directive';

const COMPONENT_NAME_RX = /^[A-Z]|^use[A-Z]/;

const EVIDENCE_RX = /^use[A-Z]/;

function buildFragment(source: string, offset = 0): Fragment {
  return {
    code: source,
    language: 'ts',
    scope: 'module',
    segments: segmentsFromOffset(source, offset),
    type: 'script',
  };
}

function buildComponentHook(
  overrides: Partial<ComponentHook> = {},
): ComponentHook {
  return {
    evidencePattern: EVIDENCE_RX,
    invoke: 'useYapyak',
    namePattern: COMPONENT_NAME_RX,
    ...overrides,
  };
}

function runInject(
  source: string,
  overrides: Partial<ComponentHook> = {},
  fileId = 'src/a.tsx',
): string {
  const extracted = extractFile(fileId, source);
  const magicString = new MagicString(source);
  const fragment = buildFragment(source);
  const sourceFile = parseSourceFile(fileId, fragment);
  const hosts = collectComponentHosts({
    callSites: extracted.callSites,
    componentHook: buildComponentHook(overrides),
    directives: extractPrologueDirectives(sourceFile.program),
    source,
    sourceFilesByFragment: new Map([
      [
        fragment,
        sourceFile,
      ],
    ]),
  });
  injectComponentHooks({
    hosts,
    invocation: 'useYapyak',
    magicString,
  });
  return magicString.toString();
}

describe('collectComponentHosts', () => {
  it('collects a function declaration matching the name pattern', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        'export function Header() {',
        "  return t('Hello');",
        '}',
      ].join('\n'),
    );
    expect(code).toContain('{useYapyak();');
  });

  it('collects an arrow-function const matching the name pattern', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        'export const Header = () => {',
        "  return t('Hello');",
        '};',
      ].join('\n'),
    );
    expect(code).toContain('{useYapyak();');
  });

  it('collects an object-property arrow matching the name pattern', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        'export const route = {',
        "  Component: () => { return t('Hello'); },",
        '};',
      ].join('\n'),
    );
    expect(code).toContain('{useYapyak();');
  });

  it('collects an anonymous callback bound to a matching variable', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        'export const Header = withTheme(() => {',
        "  return <p>{t('Hello')}</p>;",
        '});',
      ].join('\n'),
    );
    expect(code).toContain('{useYapyak();');
  });

  it('collects a callback chained through several calls', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        'export const Header = withAuth(withTheme(() => {',
        "  return <p>{t('Hello')}</p>;",
        '}));',
      ].join('\n'),
    );
    expect(code).toContain('{useYapyak();');
  });

  it('collects an anonymous function returned from a factory', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        'export function withLoading() {',
        "  return () => { return <p>{t('Loading...')}</p>; };",
        '}',
      ].join('\n'),
    );
    expect(code).toContain('=> {useYapyak();');
  });

  it('collects an anonymous default-exported arrow holding JSX', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        "export default () => <p>{t('Hello')}</p>;",
      ].join('\n'),
    );
    expect(code).toContain('{useYapyak();return(<p>');
  });

  it('collects an anonymous default function declaration holding JSX', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        'export default function () {',
        "  return <p>{t('Hello')}</p>;",
        '}',
      ].join('\n'),
    );
    expect(code).toContain('{useYapyak();');
  });

  it('collects an anonymous callback that calls a hook', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        'export const useGreeting = withCache(() => {',
        '  useMemo();',
        "  return t('Hello');",
        '});',
      ].join('\n'),
    );
    expect(code).toContain('{useYapyak();');
  });

  it('collects the enclosing component for a render callback', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        'export function Header({ items }) {',
        "  return items.map(() => <li>{t('Open')}</li>);",
        '}',
      ].join('\n'),
    );
    expect(code).toContain('Header({ items }) {useYapyak();');
    expect(code).not.toContain('=> {useYapyak();return(<li>');
  });

  it('collects the component above a lowercase helper arrow', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        'export function Header() {',
        "  const renderFooter = () => <footer>{t('Cancel')}</footer>;",
        '  return renderFooter();',
        '}',
      ].join('\n'),
    );
    expect(code).toContain('Header() {useYapyak();');
    expect(code).not.toContain('=> {useYapyak();return(<footer>');
  });

  it('collects the inner arrow of a factory that returns JSX', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        "export const makeCard = () => () => <p>{t('Hello')}</p>;",
      ].join('\n'),
    );
    expect(code).toContain('() => {useYapyak();return(<p>');
  });

  it('collects a component holding JSX without yapyak reads', () => {
    const code = runInject(
      [
        "import { getGreeting } from './greeting';",
        'export function Header() {',
        '  return <p>{getGreeting()}</p>;',
        '}',
      ].join('\n'),
    );
    expect(code).toContain('Header() {useYapyak();');
  });

  it('collects a hook calling a hook without yapyak reads', () => {
    const code = runInject(
      [
        "import { useContext } from 'react';",
        'export function useTheme() {',
        '  return useContext(ThemeContext);',
        '}',
      ].join('\n'),
    );
    expect(code).toContain('useTheme() {useYapyak();');
  });

  it('collects a hook calling a hook in a `.ts` file', () => {
    const code = runInject(
      [
        "import { useContext } from 'react';",
        'export function useTheme() {',
        '  return useContext(ThemeContext);',
        '}',
      ].join('\n'),
      {},
      'src/a.ts',
    );
    expect(code).toContain('useTheme() {useYapyak();');
  });

  it('collects an anonymous callback holding JSX bound to a matching variable without yapyak reads', () => {
    const code = runInject(
      [
        "import { memo } from 'react';",
        'export const Header = memo(() => <p>{getGreeting()}</p>);',
      ].join('\n'),
    );
    expect(code).toContain('{useYapyak();return(<p>');
  });

  it('collects every component in a file', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        'export function Header() {',
        "  return <h1>{t('Hello')}</h1>;",
        '}',
        'export function Footer() {',
        '  return <p>{getGreeting()}</p>;',
        '}',
      ].join('\n'),
    );
    expect(code).toContain('Header() {useYapyak();');
    expect(code).toContain('Footer() {useYapyak();');
  });

  it('collects a hook declared in a `.ts` file', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        'export function useGreeting() {',
        "  return t('Hello');",
        '}',
      ].join('\n'),
      {},
      'src/a.ts',
    );
    expect(code).toContain('useGreeting() {useYapyak();');
  });

  it('collects a component that reads `format`', () => {
    const code = runInject(
      [
        "import { format } from 'yapyak';",
        'export function Price() {',
        '  return format.number(1);',
        '}',
      ].join('\n'),
    );
    expect(code).toContain('Price() {useYapyak();');
  });

  it('collects a component that reads a renamed `format`', () => {
    const code = runInject(
      [
        "import { format as fmt } from 'yapyak';",
        'export function Price() {',
        '  return fmt.number(1);',
        '}',
      ].join('\n'),
    );
    expect(code).toContain('Price() {useYapyak();');
  });

  it('collects a component that reads `format` through a namespace import', () => {
    const code = runInject(
      [
        "import * as yapyak from 'yapyak';",
        'export function Price() {',
        '  return yapyak.format.number(1);',
        '}',
      ].join('\n'),
    );
    expect(code).toContain('Price() {useYapyak();');
  });

  it('collects a hook that reads `format` in a `.ts` file', () => {
    const code = runInject(
      [
        "import { format } from 'yapyak';",
        'export function usePrice() {',
        '  return format.number(1);',
        '}',
      ].join('\n'),
      {},
      'src/a.ts',
    );
    expect(code).toContain('usePrice() {useYapyak();');
  });

  it('skips a callback without component evidence', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        "export const Loader = createPoller(() => t('Loading...'));",
      ].join('\n'),
    );
    expect(code).not.toContain('useYapyak();');
  });

  it('skips a call site in a class method', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        'export class Header {',
        '  render() {',
        "    return t('Hello');",
        '  }',
        '}',
      ].join('\n'),
    );
    expect(code).not.toContain('useYapyak();');
  });

  it('skips a curried factory without component evidence', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        "export const makeGreeting = () => () => t('Hello');",
      ].join('\n'),
    );
    expect(code).not.toContain('useYapyak();');
  });

  it('skips an anonymous default export without evidence', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        'export default function () {',
        "  return t('Hello');",
        '}',
      ].join('\n'),
    );
    expect(code).not.toContain('useYapyak();');
  });

  it('skips a capitalized function without evidence or yapyak reads', () => {
    const code = runInject(
      [
        'export function Money(amount) {',
        '  return amount * 2;',
        '}',
      ].join('\n'),
    );
    expect(code).not.toContain('useYapyak();');
  });

  it('skips a `use`-prefixed function without evidence in a `.ts` file', () => {
    const code = runInject(
      [
        'export function useCoupon(code) {',
        '  return code.trim();',
        '}',
      ].join('\n'),
      {},
      'src/a.ts',
    );
    expect(code).not.toContain('useYapyak();');
  });

  it('skips a lowercase function holding JSX', () => {
    const code = runInject(
      [
        'function renderRow() {',
        '  return <li>{getGreeting()}</li>;',
        '}',
      ].join('\n'),
    );
    expect(code).not.toContain('useYapyak();');
  });

  it('skips a capitalized function declared in a `.ts` file', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        'export function Header() {',
        "  return t('Hello');",
        '}',
      ].join('\n'),
      {},
      'src/a.ts',
    );
    expect(code).not.toContain('useYapyak();');
  });

  it('skips an anonymous function with hook evidence in a `.ts` file', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        'export default function () {',
        '  useMemo();',
        "  return t('Hello');",
        '}',
      ].join('\n'),
      {},
      'src/a.ts',
    );
    expect(code).not.toContain('useYapyak();');
  });

  it('skips a lowercase helper that reads `format`', () => {
    const code = runInject(
      [
        "import { format } from 'yapyak';",
        'export function formatPrice(amount) {',
        '  return format.number(amount);',
        '}',
      ].join('\n'),
    );
    expect(code).not.toContain('useYapyak();');
  });

  it('skips a component whose `format` is shadowed by a parameter', () => {
    const code = runInject(
      [
        "import { format } from 'yapyak';",
        'export function Price({ format }) {',
        '  return format.number(1);',
        '}',
      ].join('\n'),
    );
    expect(code).not.toContain('useYapyak();');
  });

  it('skips a `format` property key', () => {
    const code = runInject(
      [
        "import { format } from 'yapyak';",
        'export function Price() {',
        '  return { format: 1 };',
        '}',
      ].join('\n'),
    );
    expect(code).not.toContain('useYapyak();');
  });

  it('skips a `format` property read on another object', () => {
    const code = runInject(
      [
        "import { format } from 'yapyak';",
        'export function Price({ money }) {',
        '  return money.format(1);',
        '}',
      ].join('\n'),
    );
    expect(code).not.toContain('useYapyak();');
  });

  it('skips a `format` imported from another module', () => {
    const code = runInject(
      [
        "import { format } from 'date-fns';",
        'export function Updated() {',
        '  return format(new Date());',
        '}',
      ].join('\n'),
    );
    expect(code).not.toContain('useYapyak();');
  });

  it('blocks collection when the eligibility directive is missing from the prologue', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        'export function Header() {',
        "  return t('Hello');",
        '}',
      ].join('\n'),
      {
        eligibilityDirective: 'use client',
      },
    );
    expect(code).not.toContain('useYapyak()');
  });

  it('collects a component when the eligibility directive is present in the prologue', () => {
    const code = runInject(
      [
        "'use client';",
        "import { t } from 'yapyak';",
        'export function Header() {',
        "  return t('Hello');",
        '}',
      ].join('\n'),
      {
        eligibilityDirective: 'use client',
      },
    );
    expect(code).toContain('{useYapyak();');
  });

  it('collects a JSX component when the eligibility directive is present in the prologue', () => {
    const code = runInject(
      [
        "'use client';",
        "import { t } from 'yapyak';",
        'export function Header() {',
        "  return <h1>{t('Hello')}</h1>;",
        '}',
      ].join('\n'),
      {
        eligibilityDirective: 'use client',
      },
    );
    expect(code).toContain('{useYapyak();');
  });

  it('blocks collection for an object method', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        'export const views = {',
        "  Header() { return <h1>{t('Hello')}</h1>; },",
        '};',
      ].join('\n'),
    );
    expect(code).not.toContain('useYapyak()');
  });

  it('blocks collection for a component without evidence or yapyak reads', () => {
    const code = runInject(
      [
        'export function Header() {',
        "  return 'static';",
        '}',
      ].join('\n'),
    );
    expect(code).not.toContain('useYapyak()');
  });
});

describe('injectComponentHooks', () => {
  it('emits an invocation at the body start of a block function', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        'export function Header() {',
        "  return t('Hello');",
        '}',
      ].join('\n'),
    );
    expect(code).toContain('Header() {useYapyak();');
  });

  it('rewrites a concise arrow body into a block carrying the invocation', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        "export const Header = () => <p>{t('Hello')}</p>;",
      ].join('\n'),
    );
    expect(code).toContain('=> {useYapyak();return(<p>');
    expect(code).toContain('</p>);};');
  });

  it('rewrites a concise custom-hook body into a block carrying the invocation', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        "export const useGreeting = () => t('Hello');",
      ].join('\n'),
    );
    expect(code).toContain('=> {useYapyak();return(t(');
  });

  it('rewrites a parenthesized concise arrow body into a block carrying the invocation', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        'export const Header = () => (',
        "  <p>{t('Hello')}</p>",
        ');',
      ].join('\n'),
    );
    expect(code).toContain('=> {useYapyak();return((');
    expect(code).toContain('));};');
  });

  it('rewrites a concise arrow returning an object literal', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        "export const useLabels = () => ({ save: t('Save') });",
      ].join('\n'),
    );
    expect(code).toContain('=> {useYapyak();return((');
    expect(code).toContain('));};');
  });

  it('emits one invocation for several call sites in the same component', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        'export function Header() {',
        "  return t('Hello') + t('World');",
        '}',
      ].join('\n'),
    );
    expect(code.split('useYapyak();')).toHaveLength(2);
  });

  it('emits one invocation for a component that calls `t()` and reads `format`', () => {
    const code = runInject(
      [
        "import { format, t } from 'yapyak';",
        'export function Price() {',
        "  return t('Hello') + format.number(1);",
        '}',
      ].join('\n'),
    );
    expect(code.split('useYapyak();')).toHaveLength(2);
  });

  it('emits the invocation into the fragment holding the call site', () => {
    const leading = 'const version = 1;\n';
    const trailing = [
      "import { t } from 'yapyak';",
      'export function Header() {',
      "  return t('Hello');",
      '}',
    ].join('\n');
    const source = leading + trailing;
    const extracted = extractFile('src/a.tsx', source);
    const magicString = new MagicString(source);
    const leadingFragment = buildFragment(leading);
    const trailingFragment = buildFragment(trailing, leading.length);
    const hosts = collectComponentHosts({
      callSites: extracted.callSites,
      componentHook: buildComponentHook(),
      directives: [],
      source,
      sourceFilesByFragment: new Map([
        [
          leadingFragment,
          parseSourceFile('src/a.tsx', leadingFragment),
        ],
        [
          trailingFragment,
          parseSourceFile('src/a.tsx', trailingFragment),
        ],
      ]),
    });
    injectComponentHooks({
      hosts,
      invocation: 'useYapyak',
      magicString,
    });
    const code = magicString.toString();
    expect(code).toContain('Header() {useYapyak();');
    expect(code.split('useYapyak();')).toHaveLength(2);
  });
});

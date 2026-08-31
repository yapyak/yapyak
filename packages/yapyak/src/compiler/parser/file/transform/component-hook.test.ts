import type { ComponentHook, Fragment } from '../../../../processor';

import MagicString from 'magic-string';
import { describe, expect, it } from 'vitest';

import { segmentsFromOffset } from '../../../../processor';
import { extractFile } from '../extract';
import { injectComponentHooks } from './component-hook';

const COMPONENT_NAME_RX = /^[A-Z]|^use[A-Z]/;

const EVIDENCE_RX = /^use[A-Z]/;

function buildFragment(source: string): Fragment {
  return {
    code: source,
    language: 'ts',
    scope: 'module',
    segments: segmentsFromOffset(source, 0),
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
): string {
  const extracted = extractFile('src/a.tsx', source);
  const magicString = new MagicString(source);
  injectComponentHooks({
    callSites: extracted.callSites,
    componentHook: buildComponentHook(overrides),
    fileId: 'src/a.tsx',
    fragments: [
      buildFragment(source),
    ],
    invocation: 'useYapyak',
    magicString,
    source,
  });
  return magicString.toString();
}

describe('injectComponentHooks', () => {
  it('emits an invocation at the body start of a matching function declaration', () => {
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

  it('emits an invocation into an arrow-function const matching the name pattern', () => {
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

  it('emits an invocation into an object-property arrow matching the name pattern', () => {
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

  it('emits an invocation into an anonymous callback bound to a matching variable', () => {
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

  it('emits an invocation into a callback chained through several calls', () => {
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

  it('emits an invocation into an anonymous function returned from a factory', () => {
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

  it('emits an invocation into an anonymous default-exported arrow holding JSX', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        "export default () => <p>{t('Hello')}</p>;",
      ].join('\n'),
    );
    expect(code).toContain('{useYapyak();return(<p>');
  });

  it('emits an invocation into an anonymous default function declaration holding JSX', () => {
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

  it('emits an invocation when the anonymous callback calls a hook', () => {
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

  it('emits the invocation into the enclosing component for a render callback', () => {
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

  it('emits the invocation into the component above a lowercase helper arrow', () => {
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

  it('rewrites the inner arrow of a factory that returns JSX', () => {
    const code = runInject(
      [
        "import { t } from 'yapyak';",
        "export const makeCard = () => () => <p>{t('Hello')}</p>;",
      ].join('\n'),
    );
    expect(code).toContain('() => {useYapyak();return(<p>');
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
    injectComponentHooks({
      callSites: extracted.callSites,
      componentHook: buildComponentHook(),
      fileId: 'src/a.tsx',
      fragments: [
        {
          code: leading,
          language: 'ts',
          scope: 'module',
          segments: segmentsFromOffset(leading, 0),
          type: 'script',
        },
        {
          code: trailing,
          language: 'ts',
          scope: 'module',
          segments: segmentsFromOffset(trailing, leading.length),
          type: 'script',
        },
      ],
      invocation: 'useYapyak',
      magicString,
      source,
    });
    const code = magicString.toString();
    expect(code).toContain('Header() {useYapyak();');
    expect(code.split('useYapyak();')).toHaveLength(2);
  });

  it('blocks injection when the eligibility directive is missing from the prologue', () => {
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

  it('emits an invocation when the eligibility directive is present in the prologue', () => {
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

  it('blocks injection for functions that do not contain a call site', () => {
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

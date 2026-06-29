import type { ComponentHook, Fragment } from '../../../../processor';

import MagicString from 'magic-string';
import { describe, expect, it } from 'vitest';

import { extractFile } from '../extract';
import { injectComponentHooks } from './component-hook';

const COMPONENT_NAME_RX = /^[A-Z]|^use[A-Z]/;

function buildFragment(source: string): Fragment {
  return {
    code: source,
    lang: 'ts',
    originalOffset: 0,
    type: 'script',
  };
}

function buildComponentHook(
  overrides: Partial<ComponentHook> = {},
): ComponentHook {
  return {
    invoke: 'useYapyak',
    namePattern: COMPONENT_NAME_RX,
    ...overrides,
  };
}

describe('injectComponentHooks', () => {
  it('emits an invocation at the body start of a matching function declaration', () => {
    const source = [
      "import { t } from 'yapyak';",
      'export function Header() {',
      "  return t('Hello');",
      '}',
    ].join('\n');
    const extracted = extractFile('src/a.tsx', source);
    const magicString = new MagicString(source);
    injectComponentHooks({
      callSites: extracted.callSites,
      componentHook: buildComponentHook(),
      fileId: 'src/a.tsx',
      fragments: [
        buildFragment(source),
      ],
      invocation: '_useYapyak',
      magicString,
      source,
    });
    expect(magicString.toString()).toContain('{_useYapyak();');
  });

  it('emits an invocation into an arrow-function const matching the name pattern', () => {
    const source = [
      "import { t } from 'yapyak';",
      'export const Header = () => {',
      "  return t('Hello');",
      '};',
    ].join('\n');
    const extracted = extractFile('src/a.tsx', source);
    const magicString = new MagicString(source);
    injectComponentHooks({
      callSites: extracted.callSites,
      componentHook: buildComponentHook(),
      fileId: 'src/a.tsx',
      fragments: [
        buildFragment(source),
      ],
      invocation: '_useYapyak',
      magicString,
      source,
    });
    expect(magicString.toString()).toContain('{_useYapyak();');
  });

  it('blocks injection when the eligibility directive is missing from the prologue', () => {
    const source = [
      "import { t } from 'yapyak';",
      'export function Header() {',
      "  return t('Hello');",
      '}',
    ].join('\n');
    const extracted = extractFile('src/a.tsx', source);
    const magicString = new MagicString(source);
    injectComponentHooks({
      callSites: extracted.callSites,
      componentHook: buildComponentHook({
        eligibilityDirective: 'use client',
      }),
      fileId: 'src/a.tsx',
      fragments: [
        buildFragment(source),
      ],
      invocation: '_useYapyak',
      magicString,
      source,
    });
    expect(magicString.toString()).not.toContain('_useYapyak()');
  });

  it('emits an invocation when the eligibility directive is present in the prologue', () => {
    const source = [
      "'use client';",
      "import { t } from 'yapyak';",
      'export function Header() {',
      "  return t('Hello');",
      '}',
    ].join('\n');
    const extracted = extractFile('src/a.tsx', source);
    const magicString = new MagicString(source);
    injectComponentHooks({
      callSites: extracted.callSites,
      componentHook: buildComponentHook({
        eligibilityDirective: 'use client',
      }),
      fileId: 'src/a.tsx',
      fragments: [
        buildFragment(source),
      ],
      invocation: '_useYapyak',
      magicString,
      source,
    });
    expect(magicString.toString()).toContain('{_useYapyak();');
  });

  it('blocks injection for functions whose name does not match the pattern', () => {
    const source = [
      "import { t } from 'yapyak';",
      'export function helper() {',
      "  return t('Hello');",
      '}',
    ].join('\n');
    const extracted = extractFile('src/a.tsx', source);
    const magicString = new MagicString(source);
    injectComponentHooks({
      callSites: extracted.callSites,
      componentHook: buildComponentHook(),
      fileId: 'src/a.tsx',
      fragments: [
        buildFragment(source),
      ],
      invocation: '_useYapyak',
      magicString,
      source,
    });
    expect(magicString.toString()).not.toContain('_useYapyak()');
  });

  it('blocks injection for functions that do not contain a call site', () => {
    const source = [
      'export function Header() {',
      "  return 'static';",
      '}',
    ].join('\n');
    const extracted = extractFile('src/a.tsx', source);
    const magicString = new MagicString(source);
    injectComponentHooks({
      callSites: extracted.callSites,
      componentHook: buildComponentHook(),
      fileId: 'src/a.tsx',
      fragments: [
        buildFragment(source),
      ],
      invocation: '_useYapyak',
      magicString,
      source,
    });
    expect(magicString.toString()).not.toContain('_useYapyak()');
  });
});

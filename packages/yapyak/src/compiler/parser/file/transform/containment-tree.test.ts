import { describe, expect, it } from 'vitest';

import { extractFile } from '../extract';
import { buildContainmentTree, hasContainingParent } from './containment-tree';

function findAllCallSites(source: string) {
  return extractFile('src/a.tsx', source).callSites;
}

describe('buildContainmentTree', () => {
  it('holds no entries when no call site contains another', () => {
    const source = [
      "import { t } from 'yapyak';",
      "export const a = t('Hello');",
      "export const b = t('Save');",
    ].join('\n');
    const tree = buildContainmentTree(findAllCallSites(source));
    expect(tree.size).toBe(0);
  });

  it('holds the inner call site as a child of the outer one when nested', () => {
    const source = [
      "import { t } from 'yapyak';",
      "export const a = t('Hi {name}', { name: t('Alex') });",
    ].join('\n');
    const callSites = findAllCallSites(source);
    const tree = buildContainmentTree(callSites);
    const outer = callSites.find((site) => site.source === 'Hi {name}');
    const inner = callSites.find((site) => site.source === 'Alex');
    if (!outer || !inner) {
      throw new Error('expected both outer and inner call sites');
    }
    expect(tree.get(outer)).toEqual([
      inner,
    ]);
  });
});

describe('hasContainingParent', () => {
  it('returns false for a top-level call site', () => {
    const source = [
      "import { t } from 'yapyak';",
      "export const x = t('Hello');",
    ].join('\n');
    const callSites = findAllCallSites(source);
    const callSite = callSites[0];
    if (!callSite) {
      throw new Error('expected a call site');
    }
    expect(hasContainingParent(callSite, callSites)).toBe(false);
  });

  it('returns true for a call site nested inside another', () => {
    const source = [
      "import { t } from 'yapyak';",
      "export const a = t('Hi {name}', { name: t('Alex') });",
    ].join('\n');
    const callSites = findAllCallSites(source);
    const inner = callSites.find((site) => site.source === 'Alex');
    if (!inner) {
      throw new Error('expected an inner call site');
    }
    expect(hasContainingParent(inner, callSites)).toBe(true);
  });
});

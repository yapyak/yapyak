import type { Fragment } from '../type';

import { describe, expect, it } from 'vitest';

import { astroProcessor } from './astro';

function verifyOffsetInvariant(source: string, fragment: Fragment): void {
  const slice = source.slice(
    fragment.originalOffset,
    fragment.originalOffset + fragment.code.length,
  );
  expect(slice).toBe(fragment.code);
}

describe('astroProcessor', () => {
  it('returns empty for empty source', () => {
    expect(astroProcessor.parseFragments('')).toEqual([]);
  });

  it('extracts frontmatter as script fragment', () => {
    const source = [
      '---',
      "import { $t } from '@yapyak/core';",
      "const greeting = $t('Hello');",
      '---',
      '<h1>Hi</h1>',
    ].join('\n');
    const fragments = astroProcessor.parseFragments(source);
    const scripts = fragments.filter((f) => f.kind === 'script');
    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.lang).toBe('ts');
    expect(scripts[0]?.code).toContain('$t');
    verifyOffsetInvariant(source, scripts[0] as Fragment);
  });

  it('extracts template expression {expr}', () => {
    const source = [
      '---',
      "import { $t } from '@yapyak/core';",
      '---',
      `<h1>{$t('Welcome')}</h1>`,
    ].join('\n');
    const fragments = astroProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(exprs).toHaveLength(1);
    expect(exprs[0]?.code).toBe("$t('Welcome')");
    verifyOffsetInvariant(source, exprs[0] as Fragment);
  });

  it('extracts attribute expression value', () => {
    const source = [
      '---',
      "import { $t } from '@yapyak/core';",
      '---',
      `<button aria-label={$t('Save')}>x</button>`,
    ].join('\n');
    const fragments = astroProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(exprs).toHaveLength(1);
    expect(exprs[0]?.code).toBe("$t('Save')");
    verifyOffsetInvariant(source, exprs[0] as Fragment);
  });

  it('extracts shorthand attribute {name}', () => {
    const source = [
      '---',
      'const className = "btn";',
      '---',
      `<button {className}>x</button>`,
    ].join('\n');
    const fragments = astroProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(exprs.some((e) => e.code === 'className')).toBe(true);
  });

  it('extracts spread attribute {...obj}', () => {
    const source = [
      '---',
      'const props = { foo: "bar" };',
      '---',
      `<div {...props}>x</div>`,
    ].join('\n');
    const fragments = astroProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(exprs.some((e) => e.code === 'props')).toBe(true);
  });

  it('recurses into nested elements', () => {
    const source = [
      '---',
      "import { $t } from '@yapyak/core';",
      '---',
      `<article>`,
      `  <header><h1>{$t('Welcome')}</h1></header>`,
      `  <section>`,
      `    <p>{$t('Hi {name}', { name })}</p>`,
      `    <button aria-label={$t('Save')}>{$t('Save')}</button>`,
      `  </section>`,
      `</article>`,
    ].join('\n');
    const fragments = astroProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(exprs.length).toBeGreaterThanOrEqual(4);
    for (const fragment of exprs) {
      verifyOffsetInvariant(source, fragment);
    }
  });

  it('extracts expressions inside Component-typed elements', () => {
    const source = [
      '---',
      'import Button from "./Button.astro";',
      "import { $t } from '@yapyak/core';",
      '---',
      `<Button label={$t('Save')} />`,
    ].join('\n');
    const fragments = astroProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(exprs).toHaveLength(1);
    expect(exprs[0]?.code).toBe("$t('Save')");
  });

  it('handles static attributes (no extraction)', () => {
    const source = [`<button class="btn">x</button>`].join('\n');
    const fragments = astroProcessor.parseFragments(source);
    expect(fragments).toHaveLength(0);
  });

  it('handles no frontmatter', () => {
    const source = [`<h1>{$t('Hello')}</h1>`].join('\n');
    const fragments = astroProcessor.parseFragments(source);
    const scripts = fragments.filter((f) => f.kind === 'script');
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(scripts).toHaveLength(0);
    expect(exprs).toHaveLength(1);
  });

  it('extracts template-literal attribute value', () => {
    const source = [
      '---',
      'const name = "Alex";',
      '---',
      `<div title=\`Hello \${name}\`>x</div>`,
    ].join('\n');
    const fragments = astroProcessor.parseFragments(source);
    const exprs = fragments.filter((f) => f.kind === 'template-expression');
    expect(exprs.length).toBeGreaterThan(0);
  });
});

import type { Fragment } from '../fragment';

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
  describe('parseFragments', () => {
    it('returns frontmatter as a script fragment', () => {
      const source = [
        '---',
        "import { t } from 'yapyak';",
        "const greeting = t('Hello');",
        '---',
        '<h1>Hi</h1>',
      ].join('\n');
      const fragments = astroProcessor.parseFragments(source);
      const scripts = fragments.filter((f) => f.kind === 'script');
      expect(scripts).toHaveLength(1);
      expect(scripts[0]?.lang).toBe('ts');
      expect(scripts[0]?.code).toContain('t');
      verifyOffsetInvariant(source, scripts[0] as Fragment);
    });

    it('returns a template expression for `{expr}`', () => {
      const source = [
        '---',
        "import { t } from 'yapyak';",
        '---',
        `<h1>{t('Hello')}</h1>`,
      ].join('\n');
      const fragments = astroProcessor.parseFragments(source);
      const exprs = fragments.filter((f) => f.kind === 'template-expression');
      expect(exprs).toHaveLength(1);
      expect(exprs[0]?.code).toBe("t('Hello')");
      verifyOffsetInvariant(source, exprs[0] as Fragment);
    });

    it('returns a fragment for an attribute expression value', () => {
      const source = [
        '---',
        "import { t } from 'yapyak';",
        '---',
        `<button aria-label={t('Save')}>x</button>`,
      ].join('\n');
      const fragments = astroProcessor.parseFragments(source);
      const exprs = fragments.filter((f) => f.kind === 'template-expression');
      expect(exprs).toHaveLength(1);
      expect(exprs[0]?.code).toBe("t('Save')");
      verifyOffsetInvariant(source, exprs[0] as Fragment);
    });

    it('returns a fragment for a shorthand attribute `{name}`', () => {
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

    it('returns a fragment for a spread attribute `{...obj}`', () => {
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

    it('returns fragments from nested elements', () => {
      const source = [
        '---',
        "import { t } from 'yapyak';",
        '---',
        `<article>`,
        `  <header><h1>{t('Hello')}</h1></header>`,
        `  <section>`,
        `    <p>{t('Hi {name}', { name })}</p>`,
        `    <button aria-label={t('Save')}>{t('Save')}</button>`,
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

    it('returns fragments from Component-typed elements', () => {
      const source = [
        '---',
        'import Button from "./Button.astro";',
        "import { t } from 'yapyak';",
        '---',
        `<Button label={t('Save')} />`,
      ].join('\n');
      const fragments = astroProcessor.parseFragments(source);
      const exprs = fragments.filter((f) => f.kind === 'template-expression');
      expect(exprs).toHaveLength(1);
      expect(exprs[0]?.code).toBe("t('Save')");
    });

    it('returns a fragment for a template-literal attribute value', () => {
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

    it('returns expressions when there is no frontmatter', () => {
      const source = [`<h1>{t('Hello')}</h1>`].join('\n');
      const fragments = astroProcessor.parseFragments(source);
      const scripts = fragments.filter((f) => f.kind === 'script');
      const exprs = fragments.filter((f) => f.kind === 'template-expression');
      expect(scripts).toHaveLength(0);
      expect(exprs).toHaveLength(1);
    });

    it('returns an empty array for empty source', () => {
      expect(astroProcessor.parseFragments('')).toEqual([]);
    });

    it('returns an empty array when only static attributes are present', () => {
      const source = [`<button class="btn">x</button>`].join('\n');
      const fragments = astroProcessor.parseFragments(source);
      expect(fragments).toHaveLength(0);
    });
  });
});

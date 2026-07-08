import type { Page } from '@yapyak/doc-compiler';

import { describe, expect, it, vi } from 'vitest';

import { getPageTitle } from './page';

vi.mock('virtual:doc-compiler', () => ({
  doc: {},
}));

function page(overrides: Partial<Page> = {}): Page {
  return {
    blocks: [],
    breadcrumbs: [],
    description: '',
    href: '/guide/save',
    meta: {},
    title: 'Save',
    ...overrides,
  };
}

describe('getPageTitle', () => {
  it('returns the branded title when the page has no section', () => {
    expect(getPageTitle(page())).toBe('Save - yapyak');
  });

  it('returns the section-qualified title', () => {
    expect(
      getPageTitle(
        page({
          breadcrumbs: [
            'Settings',
          ],
        }),
      ),
    ).toBe('Save - Settings - yapyak');
  });

  it('returns the branded title when the section repeats the page title', () => {
    expect(
      getPageTitle(
        page({
          breadcrumbs: [
            'Save',
          ],
        }),
      ),
    ).toBe('Save - yapyak');
  });

  it('returns the branded title when the section is the brand', () => {
    expect(
      getPageTitle(
        page({
          breadcrumbs: [
            'yapyak',
          ],
        }),
      ),
    ).toBe('Save - yapyak');
  });
});

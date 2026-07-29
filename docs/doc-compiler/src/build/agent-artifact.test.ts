import type { Block } from '../access';
import type { Manifest, Page, SidebarNode } from './manifest';

import { describe, expect, it } from 'vitest';

import { buildAgentArtifact } from './agent-artifact';

function buildPage(overrides: Partial<Page> = {}): Page {
  return {
    breadcrumbs: [],
    description: '',
    href: '/guide/getting-started/installation',
    meta: {},
    title: 'Installation',
    ...overrides,
  };
}

function buildSidebar(): SidebarNode[] {
  return [
    {
      children: [
        {
          badge: undefined,
          href: '/guide/getting-started/installation',
          kind: 'link',
          label: 'Installation',
        },
      ],
      collapsible: false,
      href: undefined,
      kind: 'group',
      label: 'Getting started',
    },
  ];
}

function buildManifest(page: Page, blocks: Block[] = []): Manifest {
  return {
    collections: {
      guide: {
        content: {
          'getting-started/installation': blocks,
        },
        pages: {
          'getting-started/installation': page,
        },
        redirects: {},
        sidebarNodes: buildSidebar(),
      },
    },
    options: {},
    symbols: {},
    version: 1,
  };
}

describe('buildAgentArtifact', () => {
  it('emits llms.txt with the site name and instructions', () => {
    const result = buildAgentArtifact(buildManifest(buildPage()), {
      description: 'i18n that keeps up.',
      instructions: 'Use t() with the English source as the key.',
      outDir: '',
      siteName: 'yapyak',
      siteUrl: 'https://yapyak.dev',
    });
    const index = result.files.get('llms.txt');
    expect(index).toContain('# yapyak');
    expect(index).toContain('> i18n that keeps up.');
    expect(index).toContain('## Instructions');
    expect(index).toContain('Use t() with the English source as the key.');
  });

  it('emits llms.txt with absolute URLs for sidebar links', () => {
    const result = buildAgentArtifact(
      buildManifest(
        buildPage({
          description: 'Install yapyak.',
        }),
      ),
      {
        description: 'i18n that keeps up.',
        instructions: '',
        outDir: '',
        siteName: 'yapyak',
        siteUrl: 'https://yapyak.dev',
      },
    );
    const index = result.files.get('llms.txt');
    expect(index).toContain(
      '[Installation](https://yapyak.dev/guide/getting-started/installation)',
    );
    expect(index).toContain(': Install yapyak.');
  });

  it('emits llms-full.txt with concatenated page content', () => {
    const page = buildPage({
      description: 'Install yapyak.',
    });
    const blocks: Block[] = [
      {
        children: [
          {
            kind: 'text',
            value: 'Step 1.',
          },
        ],
        kind: 'paragraph',
      },
    ];
    const result = buildAgentArtifact(buildManifest(page, blocks), {
      description: 'i18n.',
      instructions: '',
      outDir: '',
      siteName: 'yapyak',
      siteUrl: 'https://yapyak.dev',
    });
    const full = result.files.get('llms-full.txt');
    expect(full).toContain('# Installation');
    expect(full).toContain('Step 1.');
  });

  it('emits a markdown file per page mirroring the URL path', () => {
    const result = buildAgentArtifact(buildManifest(buildPage()), {
      description: '',
      instructions: '',
      outDir: '',
      siteName: 'yapyak',
      siteUrl: 'https://yapyak.dev',
    });
    expect(result.files.has('guide/getting-started/installation.md')).toBe(
      true,
    );
  });

  it('renders page heading and description in the per-page markdown', () => {
    const page = buildPage({
      description: 'Install yapyak.',
      title: 'Installation',
    });
    const result = buildAgentArtifact(buildManifest(page), {
      description: '',
      instructions: '',
      outDir: '',
      siteName: 'yapyak',
      siteUrl: 'https://yapyak.dev',
    });
    const content = result.files.get('guide/getting-started/installation.md');
    expect(content).toContain('# Installation');
    expect(content).toContain('> Install yapyak.');
  });
});

import type { Block } from '../access';
import type { Manifest, Page, SidebarNode } from './manifest';

import { blocksToMarkdown } from '../access';

export type AgentArtifactConfig = {
  description: string;
  instructions: string;
  outDir: string;
  siteName: string;
  siteUrl: string;
};

export type AgentArtifact = {
  files: Map<string, string>;
};

export function buildAgentArtifact(
  manifest: Manifest,
  config: AgentArtifactConfig,
): AgentArtifact {
  const files = new Map<string, string>();
  files.set('llms.txt', buildLlmsIndex(manifest, config));
  files.set('llms-full.txt', buildLlmsFull(manifest, config));
  for (const collection of Object.values(manifest.collections)) {
    for (const [path, page] of Object.entries(collection.pages)) {
      files.set(
        hrefToFilePath(page.href),
        renderPageMarkdown(page, collection.content[path] ?? []),
      );
    }
  }
  return {
    files,
  };
}

function buildLlmsIndex(
  manifest: Manifest,
  config: AgentArtifactConfig,
): string {
  const out: string[] = [];
  out.push(`# ${config.siteName}`);
  out.push(`> ${config.description}`);
  if (config.instructions.trim() !== '') {
    out.push('## Instructions');
    out.push(config.instructions.trim());
  }
  for (const [collectionId, collection] of Object.entries(
    manifest.collections,
  )) {
    out.push(`## ${capitalize(collectionId)}`);
    const links = collectLink(
      collection.sidebarNodes,
      collection.pages,
      config.siteUrl,
    );
    for (const line of links) {
      out.push(line);
    }
  }
  return `${out.join('\n\n')}\n`;
}

function collectLink(
  sidebarNodes: SidebarNode[],
  pages: Record<string, Page>,
  siteUrl: string,
  depth = 0,
): string[] {
  const lines: string[] = [];
  const indent = '  '.repeat(depth);
  for (const sidebarNode of sidebarNodes) {
    if (sidebarNode.kind === 'link') {
      const page = findPageByHref(pages, sidebarNode.href);
      const description = page?.description ?? '';
      const url = `${siteUrl}${sidebarNode.href}`;
      const descriptionSuffix = description === '' ? '' : `: ${description}`;
      lines.push(
        `${indent}- [${sidebarNode.label}](${url})${descriptionSuffix}`,
      );
      continue;
    }
    if (sidebarNode.label !== '') {
      lines.push(`${indent}- **${sidebarNode.label}**`);
    }
    const childLines = collectLink(
      sidebarNode.children,
      pages,
      siteUrl,
      depth + 1,
    );
    for (const childLine of childLines) {
      lines.push(childLine);
    }
  }
  return lines;
}

function findPageByHref(
  pages: Record<string, Page>,
  href: string,
): Page | undefined {
  for (const page of Object.values(pages)) {
    if (page.href === href) {
      return page;
    }
  }
  return undefined;
}

function buildLlmsFull(
  manifest: Manifest,
  config: AgentArtifactConfig,
): string {
  const out: string[] = [];
  out.push(`# ${config.siteName}`);
  out.push(`> ${config.description}`);
  for (const collection of Object.values(manifest.collections)) {
    for (const [path, page] of Object.entries(collection.pages)) {
      out.push('---');
      out.push(renderPageMarkdown(page, collection.content[path] ?? []));
    }
  }
  return `${out.join('\n\n')}\n`;
}

function renderPageMarkdown(page: Page, blocks: Block[]): string {
  const out: string[] = [];
  out.push(`# ${page.title}`);
  if (page.description.trim() !== '') {
    out.push(`> ${page.description}`);
  }
  const body = blocksToMarkdown(blocks);
  if (body !== '') {
    out.push(body);
  }
  return `${out.join('\n\n')}\n`;
}

function hrefToFilePath(href: string): string {
  const trimmed = href.replace(/^\//, '').replace(/\/$/, '');
  if (trimmed === '') {
    return 'index.md';
  }
  return `${trimmed}.md`;
}

function capitalize(value: string): string {
  if (value === '') {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

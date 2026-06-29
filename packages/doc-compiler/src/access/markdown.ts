import type { Block, ListBlock, TableBlock, TableRowBlock } from './block';

export function blocksToMarkdown(blocks: Block[]): string {
  const out: string[] = [];
  for (const block of blocks) {
    const rendered = renderBlock(block);
    if (rendered === '') {
      continue;
    }
    out.push(rendered);
  }
  return out
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function renderBlock(block: Block): string {
  switch (block.kind) {
    case 'text':
      return block.value;
    case 'heading':
      return `${'#'.repeat(block.level)} ${renderInline(block.children)}`;
    case 'paragraph':
      return renderInline(block.children);
    case 'link':
      return `[${renderInline(block.children)}](${block.href})`;
    case 'image':
      return `![${block.alt ?? ''}](${block.src})`;
    case 'list':
      return renderList(block);
    case 'list-item':
      return renderInline(block.children);
    case 'emphasis':
      return `*${renderInline(block.children)}*`;
    case 'strong':
      return `**${renderInline(block.children)}**`;
    case 'strikethrough':
      return `~~${renderInline(block.children)}~~`;
    case 'inline-code':
      return `\`${block.value}\``;
    case 'quote':
      return renderQuote(block.children);
    case 'divider':
      return '---';
    case 'line-break':
      return '  \n';
    case 'table':
      return renderTable(block);
    case 'table-row':
      return renderTableRow(block);
    case 'table-cell':
      return renderInline(block.children);
    case 'code-block':
      return renderCodeBlock(block);
    case 'code-expression':
      return `\`${renderInline(block.children)}\``;
    case 'switch':
      return renderSwitch(block);
    case 'only':
      return `${renderBlocks(block.children)}\n\n*(Applies when ${block.group} = "${block.value}")*`;
    case 'picker':
      return '';
    case 'callout':
      return renderCallout(block.variant, block.title, block.children);
    case 'output':
      return renderOutput(block.lines);
    case 'diagnostics':
      return renderDiagnostics(block.language, block.lines);
    case 'eyebrow':
      return renderEyebrow(block);
    case 'code-location':
      return `*${block.file}:${block.line}*`;
    default:
      return '';
  }
}

function renderInline(blocks: Block[]): string {
  return blocks.map(renderBlock).join('');
}

function renderBlocks(blocks: Block[]): string {
  return blocksToMarkdown(blocks);
}

function renderList(block: ListBlock): string {
  const marker = block.ordered ? (index: number) => `${index + 1}.` : () => '-';
  return block.children
    .map((item, index) => {
      const rendered = renderListItemContent(item.children);
      return `${marker(index)} ${rendered}`;
    })
    .join('\n');
}

function renderListItemContent(blocks: Block[]): string {
  const parts: string[] = [];
  let inline = '';
  for (const block of blocks) {
    if (block.kind === 'paragraph') {
      if (inline !== '') {
        parts.push(inline);
        inline = '';
      }
      parts.push(renderInline(block.children));
      continue;
    }
    if (block.kind === 'list') {
      if (inline !== '') {
        parts.push(inline);
        inline = '';
      }
      const nested = renderBlock(block);
      parts.push(
        nested
          .split('\n')
          .map((line) => `  ${line}`)
          .join('\n'),
      );
      continue;
    }
    inline += renderBlock(block);
  }
  if (inline !== '') {
    parts.push(inline);
  }
  return parts.join('\n  ');
}

function renderQuote(children: Block[]): string {
  return blocksToMarkdown(children)
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
}

function renderTable(table: TableBlock): string {
  const out: string[] = [];
  if (table.head !== null) {
    out.push(renderTableRow(table.head));
    const separators = new Array(table.head.children.length).fill('---');
    out.push(`| ${separators.join(' | ')} |`);
  }
  for (const row of table.body) {
    out.push(renderTableRow(row));
  }
  return out.join('\n');
}

function renderTableRow(row: TableRowBlock): string {
  const cells = row.children.map((cell) => renderInline(cell.children));
  return `| ${cells.join(' | ')} |`;
}

function renderCodeBlock(block: {
  label: string | null;
  language: string | null;
  path: string | null;
  source: string;
}): string {
  const language = block.language ?? '';
  const decorator = block.path ?? block.label ?? '';
  const fenceInfo = decorator === '' ? language : `${language} [${decorator}]`;
  return `\`\`\`${fenceInfo}\n${block.source}\n\`\`\``;
}

function renderSwitch(block: {
  branches: Record<string, Block[]>;
  group: string;
}): string {
  const out: string[] = [];
  for (const [value, branchBlocks] of Object.entries(block.branches)) {
    if (branchBlocks.length === 0) {
      continue;
    }
    out.push(`#### ${block.group}: ${value}`);
    out.push(blocksToMarkdown(branchBlocks));
  }
  return out.join('\n\n');
}

function renderCallout(
  variant: 'danger' | 'info' | 'tip' | 'warning',
  title: string | null,
  children: Block[],
): string {
  const headerText = title ?? capitalize(variant);
  const body = blocksToMarkdown(children);
  return `> **${headerText}**${
    body === ''
      ? ''
      : `\n>\n${body
          .split('\n')
          .map((line) => `> ${line}`)
          .join('\n')}`
  }`;
}

function renderOutput(
  lines: {
    locale: string | null;
    value: string;
  }[],
): string {
  const body = lines
    .map((line) => {
      if (line.locale === null) {
        return line.value;
      }
      return `${line.locale}: ${line.value}`;
    })
    .join('\n');
  return `\`\`\`output\n${body}\n\`\`\``;
}

function renderDiagnostics(
  language: string,
  lines: {
    code: string;
    message: string | null;
    status: 'error' | 'ok';
  }[],
): string {
  const body = lines
    .map((line) => {
      const marker = line.status === 'ok' ? '✓' : '✗';
      const suffix = line.message === null ? '' : `  // ${line.message}`;
      return `${marker} ${line.code}${suffix}`;
    })
    .join('\n');
  return `\`\`\`${language}\n${body}\n\`\`\``;
}

function renderEyebrow(block: {
  kind: string | null;
  module: string | null;
}): string {
  const parts: string[] = [];
  if (block.kind !== null) {
    parts.push(block.kind);
  }
  if (block.module !== null) {
    parts.push(`from \`${block.module}\``);
  }
  if (parts.length === 0) {
    return '';
  }
  return `*${parts.join(' ')}*`;
}

function capitalize(value: string): string {
  if (value === '') {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

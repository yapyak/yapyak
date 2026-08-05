import type { Config, Schema, Tag } from '@markdoc/markdoc';
import type {
  Block,
  CalloutBlock,
  CodeBlock,
  DiagnosticBlock,
  DiagnosticLine,
  DiagnosticStatus,
  OutputBlock,
  OutputLine,
  TableBlock,
  TableCellBlock,
  TableRowBlock,
  TerminalBlock,
  TerminalLine,
  TerminalSegment,
} from '../../access';
import type { MetaValue } from '../../build';

import Markdoc from '@markdoc/markdoc';

import { nullify } from '../../nullify';
import { slugify } from '../../slugify';

type ParseMarkdownResult = {
  blocks: Block[];
  frontmatter: Record<string, MetaValue>;
};

export function parseMarkdown(source: string): ParseMarkdownResult {
  const ast = Markdoc.parse(transformFenceLabels(source));
  const frontmatterSource = ast.attributes.frontmatter as string | undefined;
  const frontmatter = frontmatterSource
    ? parseFrontmatter(frontmatterSource)
    : {};
  const transformed = Markdoc.transform(ast, markdocConfig);
  const raw = Array.isArray(transformed)
    ? transformed
    : [
        transformed,
      ];
  const blocks = raw.flatMap(toBlocks);
  return {
    blocks,
    frontmatter,
  };
}

function transformFenceLabels(source: string): string {
  return source.replace(/^(```)(\S+) +(\[[^\]]+\])[ \t]*$/gm, '$1$2$3');
}

export function parseFrontmatterOnly(
  source: string,
): Record<string, MetaValue> {
  const ast = Markdoc.parse(source);
  const frontmatterSource = ast.attributes.frontmatter as string | undefined;
  return frontmatterSource ? parseFrontmatter(frontmatterSource) : {};
}

function toBlocks(node: unknown): Block[] {
  if (typeof node === 'string') {
    return [
      {
        kind: 'text',
        value: node,
      },
    ];
  }
  if (typeof node === 'number' || typeof node === 'boolean') {
    return [
      {
        kind: 'text',
        value: String(node),
      },
    ];
  }
  if (!Markdoc.Tag.isTag(node)) {
    return [];
  }

  const children = node.children.flatMap(toBlocks);

  switch (node.name) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return [
        {
          children,
          id: getStringAttribute(node.attributes.id) ?? '',
          kind: 'heading',
          level: Number(node.name.slice(1)) as 1 | 2 | 3 | 4 | 5 | 6,
        },
      ];
    case 'p':
      return [
        {
          children,
          kind: 'paragraph',
        },
      ];
    case 'a': {
      const href = getStringAttribute(node.attributes.href) ?? '';
      return [
        {
          children,
          href,
          kind: 'link',
          linkKind: href.startsWith('/') ? 'internal' : 'external',
        },
      ];
    }
    case 'img':
      return [
        {
          alt: nullify(getStringAttribute(node.attributes.alt)),
          kind: 'image',
          src: getStringAttribute(node.attributes.src) ?? '',
        },
      ];
    case 'ul':
    case 'ol':
      return [
        {
          children: children.filter(isListItem),
          kind: 'list',
          ordered: node.name === 'ol',
        },
      ];
    case 'li':
      return [
        {
          children,
          kind: 'list-item',
        },
      ];
    case 'em':
      return [
        {
          children,
          kind: 'emphasis',
        },
      ];
    case 'strong':
      return [
        {
          children,
          kind: 'strong',
        },
      ];
    case 's':
      return [
        {
          children,
          kind: 'strikethrough',
        },
      ];
    case 'code':
      return [
        {
          kind: 'inline-code',
          value: extractText(node.children),
        },
      ];
    case 'blockquote':
      return [
        {
          children,
          kind: 'quote',
        },
      ];
    case 'hr':
      return [
        {
          kind: 'divider',
        },
      ];
    case 'br':
      return [
        {
          kind: 'line-break',
        },
      ];
    case 'table':
      return [
        buildTable(node.children),
      ];
    case 'thead':
    case 'tbody':
      return children;
    case 'tr':
      return [
        {
          children: children.filter(isCell),
          kind: 'table-row',
        },
      ];
    case 'th':
      return [
        {
          children,
          header: true,
          kind: 'table-cell',
        },
      ];
    case 'td':
      return [
        {
          children,
          header: false,
          kind: 'table-cell',
        },
      ];
    case 'CodeBlock': {
      const codeBlock = buildCodeBlock(node.attributes);
      if (codeBlock.language === 'terminal') {
        return [
          buildTerminalBlock(codeBlock.source),
        ];
      }
      const diagnostic = tryBuildDiagnosticFromCode(
        codeBlock.source,
        codeBlock.language ?? '',
      );
      if (diagnostic !== null) {
        return [
          diagnostic,
        ];
      }
      const outputs = tryBuildExampleOutputsFromCode(
        codeBlock.source,
        codeBlock.language ?? '',
        codeBlock.path,
      );
      if (outputs !== null) {
        return outputs;
      }
      return [
        codeBlock,
      ];
    }
    case 'Switch': {
      const group = getStringAttribute(node.attributes.group) ?? '';
      const branches: Record<string, Block[]> = {};
      let fallback: Block[] | undefined;
      for (const child of node.children) {
        if (!Markdoc.Tag.isTag(child)) {
          continue;
        }
        if (child.name === 'When') {
          const value = getStringAttribute(child.attributes.value) ?? '';
          if (value === '') {
            continue;
          }
          branches[value] = child.children.flatMap(toBlocks);
        } else if (child.name === 'Else') {
          fallback = child.children.flatMap(toBlocks);
        }
      }
      return [
        {
          branches,
          ...(fallback !== undefined && {
            fallback,
          }),
          group,
          kind: 'switch',
        },
      ];
    }
    case 'When':
    case 'Else':
      return children;
    case 'Only':
      return [
        {
          children,
          group: getStringAttribute(node.attributes.group) ?? '',
          kind: 'only',
          value: getStringAttribute(node.attributes.value) ?? '',
        },
      ];
    case 'Picker':
      return [
        {
          group: getStringAttribute(node.attributes.group) ?? '',
          kind: 'picker',
        },
      ];
    case 'InstallationWizard':
      return [
        {
          kind: 'installation-wizard',
        },
      ];
    case 'Callout':
      return [
        buildCallout(node.attributes, children),
      ];
    case 'Diagnostics':
      return [
        buildDiagnostic(node.attributes),
      ];
    default:
      throw new Error(`parseMarkdoc: unknown tag "${node.name}"`);
  }
}

function buildTable(children: unknown[]): TableBlock {
  let head: TableRowBlock | undefined;
  const body: TableRowBlock[] = [];

  for (const child of children) {
    if (!Markdoc.Tag.isTag(child)) {
      continue;
    }
    if (child.name === 'thead') {
      const rows = child.children
        .flatMap(toBlocks)
        .filter((block): block is TableRowBlock => block.kind === 'table-row');
      head = rows[0];
    } else if (child.name === 'tbody') {
      const rows = child.children
        .flatMap(toBlocks)
        .filter((block): block is TableRowBlock => block.kind === 'table-row');
      body.push(...rows);
    }
  }

  return {
    body: classifyColumns(body),
    head: nullify(head),
    kind: 'table',
  };
}

function classifyColumns(body: TableRowBlock[]): TableRowBlock[] {
  const columnCount = body.reduce(
    (max, row) => Math.max(max, row.children.length),
    0,
  );
  const columnTypes: (TableCellBlock['column'] | undefined)[] = [];
  for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
    const cells = body
      .map((row) => row.children[columnIndex])
      .filter((cell): cell is TableCellBlock => cell !== undefined);
    columnTypes[columnIndex] = classifyColumn(cells);
  }
  return body.map((row) => ({
    ...row,
    children: row.children.map((cell, columnIndex) => {
      const column = columnTypes[columnIndex];
      if (column === undefined || cell.column !== undefined) {
        return cell;
      }
      return {
        ...cell,
        column,
      };
    }),
  }));
}

function classifyColumn(
  cells: TableCellBlock[],
): TableCellBlock['column'] | undefined {
  if (cells.length === 0) {
    return undefined;
  }
  let identifierCount = 0;
  for (const cell of cells) {
    if (isIdentifierCell(cell)) {
      identifierCount += 1;
    }
  }
  if (identifierCount === cells.length) {
    return 'identifier';
  }
  return undefined;
}

function isIdentifierCell(cell: TableCellBlock): boolean {
  const inlineCode = findSingleInlineCode(cell.children);
  if (inlineCode === null) {
    return false;
  }
  return /^[A-Za-z_$][\w$.]*$/.test(inlineCode);
}

function findSingleInlineCode(blocks: Block[]): string | null {
  const meaningful = blocks.filter((block) => !isBlank(block));
  if (meaningful.length !== 1) {
    return null;
  }
  const first = meaningful[0];
  if (first === undefined) {
    return null;
  }
  if (first.kind === 'inline-code') {
    return first.value;
  }
  if (first.kind === 'link' && first.children.length === 1) {
    const inner = first.children[0];
    if (inner !== undefined && inner.kind === 'inline-code') {
      return inner.value;
    }
  }
  if (first.kind === 'paragraph') {
    return findSingleInlineCode(first.children);
  }
  return null;
}

function isBlank(block: Block): boolean {
  return block.kind === 'text' && block.value.trim() === '';
}

function buildCodeBlock(attributes: Record<string, unknown>): CodeBlock {
  return {
    kind: 'code-block',
    label: nullify(getStringAttribute(attributes.label)),
    language: nullify(getStringAttribute(attributes.language)),
    path: nullify(getStringAttribute(attributes.path)),
    source: getStringAttribute(attributes.source) ?? '',
  };
}

function buildCallout(
  attributes: Record<string, unknown>,
  children: Block[],
): CalloutBlock {
  const variant = attributes.variant;
  if (
    variant !== 'tip' &&
    variant !== 'info' &&
    variant !== 'warning' &&
    variant !== 'danger'
  ) {
    throw new Error(`Callout: invalid variant "${String(variant)}"`);
  }
  return {
    children,
    kind: 'callout',
    title: nullify(getStringAttribute(attributes.title)),
    variant,
  };
}

function splitCodeAndComment(line: string): [
  string,
  string | null,
] {
  let isInSingle = false;
  let isInDouble = false;
  let isInBacktick = false;
  for (let index = 0; index < line.length - 1; index++) {
    const character = line[index];
    if (!isInDouble && !isInBacktick && character === "'") {
      isInSingle = !isInSingle;
    } else if (!isInSingle && !isInBacktick && character === '"') {
      isInDouble = !isInDouble;
    } else if (!isInSingle && !isInDouble && character === '`') {
      isInBacktick = !isInBacktick;
    } else if (
      !isInSingle &&
      !isInDouble &&
      !isInBacktick &&
      character === '/' &&
      line[index + 1] === '/'
    ) {
      return [
        line.slice(0, index).trimEnd(),
        line.slice(index + 2).trim(),
      ];
    }
  }
  return [
    line,
    null,
  ];
}

function parseDiagnosticsAnnotation(annotation: string): {
  message: string | null;
  status: DiagnosticStatus;
} {
  if (annotation === 'ok' || annotation === 'yes') {
    return {
      message: null,
      status: 'ok',
    };
  }
  if (annotation === 'no' || annotation === 'error') {
    return {
      message: null,
      status: 'error',
    };
  }
  const errorMatch = annotation.match(/^error[:\s]\s*(.+)$/);
  if (errorMatch?.[1] !== undefined) {
    return {
      message: errorMatch[1].trim(),
      status: 'error',
    };
  }
  const okMatch = annotation.match(/^ok[:\s]\s*(.+)$/);
  if (okMatch?.[1] !== undefined) {
    return {
      message: okMatch[1].trim(),
      status: 'ok',
    };
  }
  return {
    message: annotation,
    status: 'error',
  };
}

function buildDiagnostic(attributes: Record<string, unknown>): DiagnosticBlock {
  const content = getStringAttribute(attributes.content) ?? '';
  const language = getStringAttribute(attributes.language) ?? 'ts';
  return buildDiagnosticBlock(content, language);
}

type TerminalTagKind = Extract<
  TerminalSegment['segmentKind'],
  'bold' | 'cyan' | 'dim' | 'green' | 'red' | 'yellow'
>;

const TERMINAL_TAGS: Record<string, TerminalTagKind> = {
  b: 'bold',
  c: 'cyan',
  d: 'dim',
  g: 'green',
  r: 'red',
  y: 'yellow',
};

function buildTerminalBlock(content: string): TerminalBlock {
  const rawLines = content.split('\n');
  while (rawLines.length > 0 && rawLines[0]?.trim() === '') {
    rawLines.shift();
  }
  while (rawLines.length > 0 && rawLines[rawLines.length - 1]?.trim() === '') {
    rawLines.pop();
  }
  const dedented = dedentTerminalLines(rawLines);
  const lines: TerminalLine[] = dedented.map((raw) => ({
    kind: 'terminal-line',
    segments: segmentTerminalLine(raw),
  }));
  return {
    kind: 'terminal',
    lines,
  };
}

function dedentTerminalLines(rawLines: string[]): string[] {
  let minIndent = Number.POSITIVE_INFINITY;
  for (const line of rawLines) {
    if (line.trim() === '') {
      continue;
    }
    const indent = line.length - line.trimStart().length;
    if (indent < minIndent) {
      minIndent = indent;
    }
  }
  if (minIndent === 0 || minIndent === Number.POSITIVE_INFINITY) {
    return rawLines;
  }
  return rawLines.map((line) =>
    line.trim() === '' ? line : line.slice(minIndent),
  );
}

function segmentTerminalLine(line: string): TerminalSegment[] {
  const segments: TerminalSegment[] = [];
  let buffer = '';
  let currentStyle: TerminalTagKind | undefined;
  let currentBarKind: 'bar-empty' | 'bar-fill' | undefined;

  const flush = (): void => {
    if (buffer.length === 0) {
      return;
    }
    const kind: TerminalSegment['segmentKind'] =
      currentBarKind ?? currentStyle ?? 'text';
    segments.push({
      kind: 'terminal-segment',
      segmentKind: kind,
      value: buffer,
    });
    buffer = '';
  };

  let index = 0;
  while (index < line.length) {
    const tagMatch = matchTerminalTag(line, index);
    if (tagMatch !== null) {
      flush();
      currentBarKind = undefined;
      currentStyle = tagMatch.closing ? undefined : tagMatch.kind;
      index += tagMatch.length;
      continue;
    }

    const character = line[index];
    if (character === undefined) {
      break;
    }
    const barKind: 'bar-empty' | 'bar-fill' | undefined =
      character === '█'
        ? 'bar-fill'
        : character === '░'
          ? 'bar-empty'
          : undefined;
    if (barKind !== currentBarKind) {
      flush();
      currentBarKind = barKind;
    }
    buffer += character;
    index += 1;
  }
  flush();
  return segments;
}

function matchTerminalTag(
  source: string,
  index: number,
): {
  closing: boolean;
  kind: TerminalTagKind;
  length: number;
} | null {
  if (source[index] !== '<') {
    return null;
  }
  const closing = source[index + 1] === '/';
  const nameStart = closing ? index + 2 : index + 1;
  const nameCharacter = source[nameStart];
  if (nameCharacter === undefined) {
    return null;
  }
  if (source[nameStart + 1] !== '>') {
    return null;
  }
  const kind = TERMINAL_TAGS[nameCharacter];
  if (kind === undefined) {
    return null;
  }
  return {
    closing,
    kind,
    length: closing ? 4 : 3,
  };
}

function buildDiagnosticBlock(
  content: string,
  language: string,
): DiagnosticBlock {
  const lines: DiagnosticLine[] = [];
  for (const raw of content.split('\n')) {
    if (raw.trim().length === 0) {
      continue;
    }
    const [code, annotation] = splitCodeAndComment(raw);
    if (annotation === null) {
      lines.push({
        code: code.trimEnd(),
        message: null,
        status: 'ok',
      });
      continue;
    }
    const { message, status } = parseDiagnosticsAnnotation(annotation);
    lines.push({
      code: code.trimEnd(),
      message,
      status,
    });
  }
  return {
    kind: 'diagnostic',
    language,
    lines,
  };
}

const DIAGNOSTICS_KEYWORD_RX = /^(ok|yes|no|error)(?:[:\s]|$)/;

export function tryBuildDiagnosticFromCode(
  content: string,
  language: string,
): DiagnosticBlock | null {
  const hasAnnotation = content.split('\n').some((line) => {
    const [, annotation] = splitCodeAndComment(line);
    return annotation !== null && DIAGNOSTICS_KEYWORD_RX.test(annotation);
  });
  if (!hasAnnotation) {
    return null;
  }
  return buildDiagnosticBlock(content, language);
}

const LOCALE_PREFIX_RX = /^([a-z]{2,3}(?:-[A-Za-z0-9]+){0,3}):[ \t]+(.+)$/;
const OUTPUT_MARKER_RX = /^(.*?)\s*\/\/\s*output:[ \t]?(.*)$/;
const OUTPUT_CONTINUATION_RX = /^\s*\/\/[ \t]?(.*)$/;

function buildOutputBlock(rawLines: string[]): OutputBlock {
  const lines: OutputLine[] = [];
  for (const raw of rawLines) {
    if (raw.trim().length === 0) {
      continue;
    }
    const match = raw.trim().match(LOCALE_PREFIX_RX);
    if (match?.[1] === undefined || match[2] === undefined) {
      lines.push({
        locale: null,
        value: raw.trimEnd(),
      });
      continue;
    }
    lines.push({
      locale: match[1],
      value: match[2].trim(),
    });
  }
  return {
    kind: 'output',
    lines,
  };
}

export function tryBuildExampleOutputsFromCode(
  content: string,
  language: string,
  path: string | null,
): Block[] | null {
  const rawLines = content.split('\n');
  const hasOutput = rawLines.some((line) => OUTPUT_MARKER_RX.test(line));
  if (!hasOutput) {
    return null;
  }
  type Segment = {
    kind: 'code' | 'output';
    lines: string[];
  };
  const segments: Segment[] = [];
  let currentKind: 'code' | 'output' = 'code';
  let currentLines: string[] = [];
  const flush = (): void => {
    if (currentLines.length === 0) {
      return;
    }
    segments.push({
      kind: currentKind,
      lines: currentLines,
    });
    currentLines = [];
  };
  for (const line of rawLines) {
    const inlineMatch = line.match(OUTPUT_MARKER_RX);
    if (inlineMatch !== null) {
      const codePart = inlineMatch[1] ?? '';
      const outputPart = inlineMatch[2] ?? '';
      if (codePart.trim().length > 0) {
        if (currentKind !== 'code') {
          flush();
          currentKind = 'code';
        }
        currentLines.push(codePart.trimEnd());
        flush();
        currentKind = 'output';
        currentLines.push(outputPart);
        continue;
      }
      if (currentKind !== 'output') {
        flush();
        currentKind = 'output';
      }
      currentLines.push(outputPart);
      continue;
    }
    if (currentKind === 'output') {
      const continuationMatch = line.match(OUTPUT_CONTINUATION_RX);
      if (continuationMatch !== null) {
        currentLines.push(continuationMatch[1] ?? '');
        continue;
      }
      flush();
      currentKind = 'code';
      if (line.trim().length === 0) {
        continue;
      }
      currentLines.push(line);
      continue;
    }
    currentLines.push(line);
  }
  flush();
  const blocks: Block[] = [];
  for (const segment of segments) {
    if (segment.kind === 'output') {
      blocks.push(buildOutputBlock(segment.lines));
      continue;
    }
    const source = segment.lines.join('\n').replace(/^\n+|\n+$/g, '');
    if (source.length === 0) {
      continue;
    }
    blocks.push({
      kind: 'code-block',
      label: null,
      language,
      path,
      source,
    });
  }
  return blocks;
}

type RawMarkdocNode = {
  attributes?: Record<string, unknown>;
  children?: RawMarkdocNode[];
  type?: string;
};

function extractRawText(node: RawMarkdocNode): string {
  if (node.type === 'text') {
    return typeof node.attributes?.content === 'string'
      ? node.attributes.content
      : '';
  }
  if (node.type === 'code') {
    const content =
      typeof node.attributes?.content === 'string'
        ? node.attributes.content
        : '';
    return `\`${content}\``;
  }
  if (node.type === 'softbreak' || node.type === 'hardbreak') {
    return '\n';
  }
  if (Array.isArray(node.children)) {
    return node.children.map(extractRawText).join('');
  }
  return '';
}

function isListItem(block: Block): block is Extract<
  Block,
  {
    kind: 'list-item';
  }
> {
  return block.kind === 'list-item';
}

function isCell(block: Block): block is TableCellBlock {
  return block.kind === 'table-cell';
}

function getStringAttribute(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

const document: Schema = {
  attributes: {
    frontmatter: {
      render: false,
      type: String,
    },
  },
  transform(node, config) {
    return node.transformChildren(config);
  },
};

const heading: Schema = {
  attributes: {
    level: {
      render: false,
      required: true,
      type: Number,
    },
  },
  children: [
    'inline',
  ],
  transform(node, config) {
    const attributes = node.transformAttributes(config);
    const children = node.transformChildren(config);
    const level = node.attributes.level as number;
    const slug = slugify(extractText(children));
    return new Markdoc.Tag(
      `h${level}`,
      {
        ...attributes,
        id: slug,
      },
      children,
    );
  },
};

const fence: Schema = {
  attributes: {
    content: {
      render: false,
      required: true,
      type: String,
    },
    language: {
      render: false,
      type: String,
    },
  },
  transform(node) {
    const rawLanguage = node.attributes.language as string | undefined;
    const content = node.attributes.content as string;
    const parsed = parseLanguageLabel(rawLanguage);
    const installSwitch = tryExpandInstallCommand(content, parsed.language);
    if (installSwitch !== undefined) {
      return installSwitch;
    }
    return new Markdoc.Tag('CodeBlock', {
      source: content,
      ...parsed,
    });
  },
};

const INSTALL_COMMAND_RX =
  /^(?:npm\s+install|pnpm\s+add|bun\s+add|yarn\s+add)\s+(.+)$/;

function tryExpandInstallCommand(
  content: string,
  language: string | undefined,
): Tag | undefined {
  if (language !== 'bash' && language !== 'sh' && language !== 'shell') {
    return undefined;
  }
  const trimmed = content.trim();
  if (trimmed.includes('\n')) {
    return undefined;
  }
  const match = INSTALL_COMMAND_RX.exec(trimmed);
  if (match === null || match[1] === undefined) {
    return undefined;
  }
  const packages = match[1].trim();
  return new Markdoc.Tag(
    'Switch',
    {
      group: 'packageManager',
    },
    [
      new Markdoc.Tag(
        'When',
        {
          value: 'pnpm',
        },
        [
          new Markdoc.Tag('CodeBlock', {
            language: 'bash',
            source: `pnpm add ${packages}`,
          }),
        ],
      ),
      new Markdoc.Tag(
        'When',
        {
          value: 'npm',
        },
        [
          new Markdoc.Tag('CodeBlock', {
            language: 'bash',
            source: `npm install ${packages}`,
          }),
        ],
      ),
      new Markdoc.Tag(
        'When',
        {
          value: 'bun',
        },
        [
          new Markdoc.Tag('CodeBlock', {
            language: 'bash',
            source: `bun add ${packages}`,
          }),
        ],
      ),
    ],
  );
}

const callout: Schema = {
  attributes: {
    title: {
      type: String,
    },
    variant: {
      matches: [
        'tip',
        'info',
        'warning',
        'danger',
      ],
      required: true,
      type: String,
    },
  },
  render: 'Callout',
};

const diagnostics: Schema = {
  attributes: {
    language: {
      type: String,
    },
  },
  transform(node, config) {
    const text = extractRawText(node as RawMarkdocNode);
    const attributes = node.transformAttributes(config);
    return new Markdoc.Tag('Diagnostics', {
      ...attributes,
      content: text,
    });
  },
};

const switchTag: Schema = {
  attributes: {
    group: {
      required: true,
      type: String,
    },
  },
  render: 'Switch',
};

const whenTag: Schema = {
  attributes: {
    value: {
      required: true,
      type: String,
    },
  },
  render: 'When',
};

const elseTag: Schema = {
  render: 'Else',
};

const onlyTag: Schema = {
  attributes: {
    group: {
      required: true,
      type: String,
    },
    value: {
      required: true,
      type: String,
    },
  },
  render: 'Only',
};

const pickerTag: Schema = {
  attributes: {
    group: {
      required: true,
      type: String,
    },
  },
  render: 'Picker',
  selfClosing: true,
};

const installationWizardTag: Schema = {
  render: 'InstallationWizard',
  selfClosing: true,
};

const markdocConfig: Config = {
  nodes: {
    document,
    fence,
    heading,
  },
  tags: {
    callout,
    diagnostics,
    else: elseTag,
    'installation-wizard': installationWizardTag,
    only: onlyTag,
    picker: pickerTag,
    switch: switchTag,
    when: whenTag,
  },
};

type ParseLanguageLabelResult = {
  label?: string;
  language?: string;
  path?: string;
};

function parseLanguageLabel(raw: string | undefined): ParseLanguageLabelResult {
  if (raw === undefined || raw === '') {
    return {};
  }
  const match = raw.match(/^(\S*)\s*\[([^\]]+)\]$/);
  if (match === null) {
    return {
      language: raw,
    };
  }
  const bracket = match[2] ?? '';
  const language = match[1];
  const result: ParseLanguageLabelResult = {};
  if (language !== undefined && language !== '') {
    result.language = language;
  }
  if (isPathLike(bracket)) {
    result.path = bracket;
  } else {
    result.label = bracket;
  }
  return result;
}

function isPathLike(value: string): boolean {
  return /^\.[a-z][\w-]*$/i.test(value) || /^[\w./-]+\.[a-z]\w*$/i.test(value);
}

function extractText(children: unknown[]) {
  const parts: string[] = [];
  for (const child of children) {
    if (typeof child === 'string') {
      parts.push(child);
    } else if (Markdoc.Tag.isTag(child)) {
      parts.push(extractText(child.children));
    }
  }
  return parts.join('');
}

function parseFrontmatter(raw: string): Record<string, MetaValue> {
  const result: Record<string, MetaValue> = {};
  for (const line of raw.split('\n')) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!key) {
      continue;
    }
    const numeric = Number(value);
    result[key] = value && Number.isFinite(numeric) ? numeric : value;
  }
  return result;
}

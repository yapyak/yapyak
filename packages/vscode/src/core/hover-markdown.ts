import type { TranslationItem } from './translation';

export type HoverMarkdownInput = {
  context?: string;
  fileId: string;
  localesDir: string;
  root: string;
  rows: TranslationItem[];
  source: string;
};

export type LocaleHoverMarkdownInput = HoverMarkdownInput & {
  locale: string;
  translator: boolean;
  value: string;
};

export function buildHoverMarkdown(input: HoverMarkdownInput): string {
  const { context, rows, source } = input;
  const header =
    context === undefined ? `**${source}**` : `**${source}** · \`${context}\``;
  const sections = [
    header,
  ];
  if (rows.length > 0) {
    const lines = rows.map((row) => {
      const value =
        row.value === undefined
          ? `\`${row.locale}\` _untranslated_`
          : `\`${row.locale}\` ${row.value}`;
      return `${value} · [$(go-to-file)](${buildOpenTranslationLink(input, row.locale)} "Go to ${row.locale}.json")`;
    });
    sections.push(lines.join('  \n'));
  }
  return sections.join('\n\n');
}

export function buildLocaleHoverMarkdown(
  input: LocaleHoverMarkdownInput,
): string {
  const { context, fileId, locale, source, translator } = input;
  const header =
    context === undefined ? `**${source}**` : `**${source}** · \`${context}\``;
  const sections = [
    header,
  ];
  const others = input.rows.filter((row) => row.locale !== locale);
  if (others.length > 0) {
    sections.push(
      others
        .map((row) =>
          row.value === undefined
            ? `\`${row.locale}\` _untranslated_`
            : `\`${row.locale}\` ${row.value}`,
        )
        .join('  \n'),
    );
  }
  const links = [
    `[$(go-to-file) Go to source](${buildOpenSourceLink(input)})`,
  ];
  if (translator) {
    links.push(`[${toTranslateLabel(input)}](${buildRetranslateLink(input)})`);
  }
  sections.push(links.join('  \n'));
  sections.push(`_${fileId}_`);
  return sections.join('\n\n');
}

function toTranslateLabel(input: LocaleHoverMarkdownInput): string {
  return input.value.trim() === ''
    ? '$(sparkle) Translate'
    : '$(refresh) Retranslate';
}

function buildRetranslateLink(input: LocaleHoverMarkdownInput): string {
  const request = {
    ...(input.context === undefined
      ? {}
      : {
          context: input.context,
        }),
    fileId: input.fileId,
    locale: input.locale,
    root: input.root,
    source: input.source,
    translated: input.value.trim() !== '',
  };
  return `command:yapyak.retranslate?${encodeURIComponent(
    JSON.stringify(request),
  )}`;
}

function buildOpenSourceLink(input: HoverMarkdownInput): string {
  const request = {
    ...(input.context === undefined
      ? {}
      : {
          context: input.context,
        }),
    fileId: input.fileId,
    root: input.root,
    source: input.source,
  };
  return `command:yapyak.openSource?${encodeURIComponent(
    JSON.stringify(request),
  )}`;
}

function buildOpenTranslationLink(
  input: HoverMarkdownInput,
  locale: string,
): string {
  const request = {
    fileId: input.fileId,
    locale,
    localesDir: input.localesDir,
    root: input.root,
    source: input.source,
  };
  return `command:yapyak.openTranslation?${encodeURIComponent(
    JSON.stringify(request),
  )}`;
}

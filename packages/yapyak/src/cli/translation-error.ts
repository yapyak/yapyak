import { color, symbol } from './tui';

export type TranslationErrorEntry = {
  error: unknown;
  fileId: string;
  locale: string;
  source: string;
};

export function renderTranslationErrors(
  entries: readonly TranslationErrorEntry[],
): string {
  if (entries.length === 0) {
    return '';
  }
  const grouped = new Map<string, TranslationErrorEntry[]>();
  for (const entry of entries) {
    const message = toMessage(entry.error);
    const bucket = grouped.get(message);
    if (bucket) {
      bucket.push(entry);
    } else {
      grouped.set(message, [
        entry,
      ]);
    }
  }
  const total = entries.length;
  const lines: string[] = [
    `\n  ${symbol.cross} ${color.red(`${total} failed`)}\n`,
  ];
  for (const [message, group] of grouped) {
    lines.push(`\n    ${color.red(message)}\n`);
    for (const item of group) {
      lines.push(
        `      ${color.dim(item.locale)} ${color.dim('·')} ${color.dim(item.fileId)} ${color.dim('·')} ${color.bold(`"${item.source}"`)}\n`,
      );
    }
  }
  lines.push('\n');
  return lines.join('');
}

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// biome-ignore lint/suspicious/noControlCharactersInRegex: yap yap yap
const stripAnsi = (value: string): string => value.replace(/\x1b\[\d+m/g, '');

const getVisualLength = (value: string): number => stripAnsi(value).length;

const padEndVisual = (value: string, width: number): string => {
  const length = getVisualLength(value);
  return length >= width ? value : value + ' '.repeat(width - length);
};

export type RenderTableOptions = {
  align?: ('left' | 'right')[];
};

export function renderTable(
  headers: string[],
  rows: string[][],
  options?: RenderTableOptions,
): string {
  const align = options?.align ?? [];
  const widths = headers.map((header, columnIndex) => {
    const headerWidth = getVisualLength(header);
    const maxRowWidth = rows.reduce(
      (max, row) => Math.max(max, getVisualLength(row[columnIndex] ?? '')),
      0,
    );
    return Math.max(headerWidth, maxRowWidth);
  });

  function renderRow(cells: string[]): string {
    const padded = cells.map((cell, columnIndex) => {
      const width = widths[columnIndex] ?? 0;
      const alignment = align[columnIndex] ?? 'left';
      const length = getVisualLength(cell);
      if (alignment === 'right') {
        return ' '.repeat(Math.max(0, width - length)) + cell;
      }
      return padEndVisual(cell, width);
    });
    return `│ ${padded.join(' │ ')} │`;
  }

  const top = `┌${widths.map((width) => '─'.repeat(width + 2)).join('┬')}┐`;
  const separator = `├${widths.map((width) => '─'.repeat(width + 2)).join('┼')}┤`;
  const bottom = `└${widths.map((width) => '─'.repeat(width + 2)).join('┴')}┘`;

  const lines = [
    top,
    renderRow(headers),
    separator,
  ];
  for (const row of rows) {
    lines.push(renderRow(row));
  }
  lines.push(bottom);
  return lines.join('\n');
}

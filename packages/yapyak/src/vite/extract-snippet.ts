export interface ExtractSnippetOptions {
  code: string;
  line: number;
  radius?: number;
}

export function extractSnippet(options: ExtractSnippetOptions): string {
  const { code, line, radius = 3 } = options;
  const lines = code.split('\n');
  const start = Math.max(0, line - 1 - radius);
  const end = Math.min(lines.length, line + radius);
  const slice = lines.slice(start, end);
  const indent = minimumIndent(slice);
  return slice.map((row) => row.slice(indent)).join('\n');
}

function minimumIndent(rows: string[]): number {
  let min = Number.POSITIVE_INFINITY;
  for (const row of rows) {
    if (row.trim() === '') {
      continue;
    }
    const match = row.match(/^[ \t]*/);
    const width = match ? match[0].length : 0;
    if (width < min) {
      min = width;
    }
  }
  return Number.isFinite(min) ? min : 0;
}

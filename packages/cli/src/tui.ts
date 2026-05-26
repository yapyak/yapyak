const ESC = '\x1b[';

interface ColorPalette {
  bold(text: string): string;
  cyan(text: string): string;
  dim(text: string): string;
  green(text: string): string;
  red(text: string): string;
  yellow(text: string): string;
}

export const color: ColorPalette = {
  bold: (s) => `${ESC}1m${s}${ESC}0m`,
  cyan: (s) => `${ESC}36m${s}${ESC}0m`,
  dim: (s) => `${ESC}2m${s}${ESC}0m`,
  green: (s) => `${ESC}32m${s}${ESC}0m`,
  red: (s) => `${ESC}31m${s}${ESC}0m`,
  yellow: (s) => `${ESC}33m${s}${ESC}0m`,
};

interface SymbolSet {
  arrow: string;
  bullet: string;
  check: string;
  cross: string;
  question: string;
  warn: string;
}

export const symbol: SymbolSet = {
  arrow: color.cyan('▸'),
  bullet: color.dim('·'),
  check: color.green('✔'),
  cross: color.red('✗'),
  question: color.cyan('?'),
  warn: color.yellow('⚠'),
};

// biome-ignore lint/suspicious/noControlCharactersInRegex: yap yap yap
const stripAnsi = (value: string): string => value.replace(/\x1b\[\d+m/g, '');

const visualLength = (value: string): number => stripAnsi(value).length;

const padEndVisual = (value: string, width: number): string => {
  const len = visualLength(value);
  return len >= width ? value : value + ' '.repeat(width - len);
};

interface Spinner {
  fail(text: string): void;
  succeed(text: string): void;
  update(text: string): void;
}

export function spinner(initial: string): Spinner {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let message = initial;
  let frameIndex = 0;
  process.stdout.write(`  ${color.cyan(frames[0] ?? '')} ${message}`);
  const id = setInterval(() => {
    frameIndex = (frameIndex + 1) % frames.length;
    process.stdout.write(
      `\r\x1b[K  ${color.cyan(frames[frameIndex] ?? '')} ${message}`,
    );
  }, 80);
  return {
    fail(text) {
      clearInterval(id);
      process.stdout.write(`\r\x1b[K  ${symbol.cross} ${text}\n`);
    },
    succeed(text) {
      clearInterval(id);
      process.stdout.write(`\r\x1b[K  ${symbol.check} ${text}\n`);
    },
    update(text) {
      message = text;
    },
  };
}

export function progressBar(
  current: number,
  total: number,
  width = 28,
): string {
  const ratio = total === 0 ? 0 : current / total;
  const filled = Math.round(ratio * width);
  return `${color.cyan('█'.repeat(filled))}${color.dim(
    '░'.repeat(width - filled),
  )} ${current}/${total}`;
}

export async function prompt(
  question: string,
  defaultValue = '',
): Promise<string> {
  const { createInterface } = await import('node:readline/promises');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const hint = defaultValue !== '' ? color.dim(` (${defaultValue})`) : '';
  const answer = await rl.question(
    `  ${symbol.question} ${question}${hint} ${symbol.arrow} `,
  );
  rl.close();
  return answer.trim() === '' ? defaultValue : answer.trim();
}

export async function confirm(
  question: string,
  defaultValue = false,
): Promise<boolean> {
  const hint = defaultValue ? '[Y/n]' : '[y/N]';
  const answer = await prompt(`${question} ${color.dim(hint)}`);
  if (answer === '') {
    return defaultValue;
  }
  return /^y(es)?$/i.test(answer);
}

interface TableOptions {
  align?: Array<'left' | 'right'>;
  headers: string[];
  rows: string[][];
}

export function renderTable(options: TableOptions): string {
  const { headers, rows, align = [] } = options;
  const widths = headers.map((header, columnIndex) => {
    const headerWidth = visualLength(header);
    const maxRowWidth = rows.reduce(
      (max, row) => Math.max(max, visualLength(row[columnIndex] ?? '')),
      0,
    );
    return Math.max(headerWidth, maxRowWidth);
  });

  function renderRow(cells: string[]): string {
    const padded = cells.map((cell, columnIndex) => {
      const width = widths[columnIndex] ?? 0;
      const alignment = align[columnIndex] ?? 'left';
      const len = visualLength(cell);
      if (alignment === 'right') {
        return ' '.repeat(Math.max(0, width - len)) + cell;
      }
      return padEndVisual(cell, width);
    });
    return `│ ${padded.join(' │ ')} │`;
  }

  const top = `┌${widths.map((width) => '─'.repeat(width + 2)).join('┬')}┐`;
  const sep = `├${widths.map((width) => '─'.repeat(width + 2)).join('┼')}┤`;
  const bottom = `└${widths.map((width) => '─'.repeat(width + 2)).join('┴')}┘`;

  const lines = [top, renderRow(headers), sep];
  for (const row of rows) {
    lines.push(renderRow(row));
  }
  lines.push(bottom);
  return lines.join('\n');
}

export function header(title: string, subtitle?: string): string {
  const lines = [color.bold(title)];
  if (subtitle) {
    lines.push(color.dim(subtitle));
  }
  return `\n  ${lines.join('  ')}\n`;
}

export function indent(text: string, spaces = 2): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => `${pad}${line}`)
    .join('\n');
}

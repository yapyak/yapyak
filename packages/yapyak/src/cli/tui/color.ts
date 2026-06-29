const ESCAPE = '\x1b[';

type ColorPalette = {
  bold(text: string): string;
  cyan(text: string): string;
  dim(text: string): string;
  green(text: string): string;
  red(text: string): string;
  yellow(text: string): string;
};

function isColorEnabled(): boolean {
  if (process.env.NO_COLOR !== undefined) {
    return false;
  }
  if (process.env.CI !== undefined) {
    return false;
  }
  return process.stdout.isTTY === true;
}

function wrap(code: string, text: string): string {
  if (!isColorEnabled()) {
    return text;
  }
  return `${ESCAPE}${code}m${text}${ESCAPE}0m`;
}

export const color: ColorPalette = {
  bold: (text) => wrap('1', text),
  cyan: (text) => wrap('36', text),
  dim: (text) => wrap('2', text),
  green: (text) => wrap('32', text),
  red: (text) => wrap('31', text),
  yellow: (text) => wrap('33', text),
};

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

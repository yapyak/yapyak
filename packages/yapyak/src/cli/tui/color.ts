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
  bold: (text) => `${ESC}1m${text}${ESC}0m`,
  cyan: (text) => `${ESC}36m${text}${ESC}0m`,
  dim: (text) => `${ESC}2m${text}${ESC}0m`,
  green: (text) => `${ESC}32m${text}${ESC}0m`,
  red: (text) => `${ESC}31m${text}${ESC}0m`,
  yellow: (text) => `${ESC}33m${text}${ESC}0m`,
};

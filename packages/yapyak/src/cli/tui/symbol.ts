import { color } from './color';

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

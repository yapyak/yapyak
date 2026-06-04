import { color } from './color';
import { symbol } from './symbol';

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

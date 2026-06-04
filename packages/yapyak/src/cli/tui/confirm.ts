import { color } from './color';
import { prompt } from './prompt';

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

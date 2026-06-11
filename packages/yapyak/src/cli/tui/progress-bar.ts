import { color } from './color';

export function progressBar(
  current: number,
  total: number,
  width = 28,
): string {
  const ratio = total === 0 ? 0 : current / total;
  const filled = Math.max(0, Math.min(width, Math.round(ratio * width)));
  return `${color.cyan('█'.repeat(filled))}${color.dim(
    '░'.repeat(width - filled),
  )} ${current}/${total}`;
}

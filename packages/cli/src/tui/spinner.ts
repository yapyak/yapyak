import { color } from './color';
import { symbol } from './symbol';

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

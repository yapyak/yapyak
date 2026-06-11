import { color } from './color';
import { symbol } from './symbol';

type Spinner = {
  fail(text: string): void;
  succeed(text: string): void;
  update(text: string): void;
};

const FRAMES = [
  '⠋',
  '⠙',
  '⠹',
  '⠸',
  '⠼',
  '⠴',
  '⠦',
  '⠧',
  '⠇',
  '⠏',
] as const;

export function spinner(initial: string): Spinner {
  if (!isInteractive()) {
    return makePlainSpinner(initial);
  }
  return makeAnimatedSpinner(initial);
}

function isInteractive(): boolean {
  if (process.env.CI !== undefined) {
    return false;
  }
  if (process.env.NO_COLOR !== undefined) {
    return false;
  }
  return process.stdout.isTTY === true;
}

function makePlainSpinner(initial: string): Spinner {
  process.stdout.write(`  ${initial}\n`);
  return {
    fail(text) {
      process.stdout.write(`  ${symbol.cross} ${text}\n`);
    },
    succeed(text) {
      process.stdout.write(`  ${symbol.check} ${text}\n`);
    },
    update() {},
  };
}

function makeAnimatedSpinner(initial: string): Spinner {
  let message = initial;
  let frameIndex = 0;
  process.stdout.write(`  ${color.cyan(FRAMES[0])} ${message}`);
  const id = setInterval(() => {
    frameIndex = (frameIndex + 1) % FRAMES.length;
    process.stdout.write(
      // biome-ignore lint/style/noNonNullAssertion: yap yap yap
      `\r\x1b[K  ${color.cyan(FRAMES[frameIndex]!)} ${message}`,
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

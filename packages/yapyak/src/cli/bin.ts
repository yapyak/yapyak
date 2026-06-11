#!/usr/bin/env node

import { run } from './run';
import { color, symbol } from './tui';

try {
  const code = await run(process.argv.slice(2));
  process.exit(code);
} catch (cause) {
  const message = cause instanceof Error ? cause.message : String(cause);
  process.stderr.write(`\n  ${symbol.cross} ${color.red(message)}\n\n`);
  process.exit(1);
}

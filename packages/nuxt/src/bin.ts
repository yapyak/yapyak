#!/usr/bin/env node

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const requireFromHere = createRequire(import.meta.url);
const distDir = dirname(requireFromHere.resolve('yapyak'));

await import(pathToFileURL(join(distDir, 'cli', 'bin.js')).href);

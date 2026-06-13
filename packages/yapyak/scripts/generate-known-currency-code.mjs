import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const target = join(here, '..', 'src', 'currency', 'known.ts');

const codes = Intl.supportedValuesOf('currency');
const union = codes.map((code) => `  | '${code}'`).join('\n');

const contents = `export type KnownCurrencyCode =
${union};
`;

writeFileSync(target, contents);
console.log(`Wrote ${codes.length} currency codes to ${target}`);

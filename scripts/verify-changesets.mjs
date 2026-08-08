import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BUMP_RX = /^['"]?[^'"]+['"]?:\s*(?<bump>patch|minor|major)\s*$/;

const violations = [];
for (const fileName of readdirSync('.changeset')) {
  if (!fileName.endsWith('.md') || fileName === 'README.md') {
    continue;
  }
  const frontmatter =
    readFileSync(join('.changeset', fileName), 'utf-8').split('---')[1] ?? '';
  for (const line of frontmatter.split('\n')) {
    const match = BUMP_RX.exec(line.trim());
    if (match && match.groups.bump !== 'patch') {
      violations.push(`${fileName}: ${line.trim()}`);
    }
  }
}

if (violations.length > 0) {
  console.error(
    'Every changeset bump is patch. With `workspace:*` peers a minor escalates every peer dependent to major and the fixed group with it, at any version. Lift this guard only together with the graduation decision (ranged `yapyak` peer + `onlyUpdatePeerDependentsWhenOutOfRange`).',
  );
  for (const violation of violations) {
    console.error(`  ${violation}`);
  }
  process.exit(1);
}
console.log('Every changeset bump is patch.');

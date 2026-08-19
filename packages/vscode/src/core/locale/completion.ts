import type { Completion } from '../completion';
import type { CompilerModule } from '../project';

export type BuildLocaleCompletionsInput = {
  locale: string;
  source: string;
};

const CATEGORY_ORDER = [
  'zero',
  'one',
  'two',
  'few',
  'many',
  'other',
];

export function buildLocaleCompletions(
  compiler: Pick<CompilerModule, 'parsePlaceholders'>,
  input: BuildLocaleCompletionsInput,
): Completion[] {
  const kindByName = new Map(
    compiler.parsePlaceholders(input.source).placeholders.map((placeholder) => [
      placeholder.name,
      placeholder.kind,
    ]),
  );
  const completions: Completion[] = [];
  for (const group of collectBraceGroups(input.source)) {
    const name = toName(group);
    const kind = kindByName.get(name);
    if (kind === undefined) {
      continue;
    }
    completions.push(
      kind === 'plural' || kind === 'selectordinal'
        ? buildBranchCompletion({
            group,
            kind,
            locale: input.locale,
            name,
          })
        : {
            detail: `${kind} placeholder from the source`,
            insertText: group,
            label: group,
          },
    );
  }
  return completions;
}

type BuildBranchCompletionInput = {
  group: string;
  kind: 'plural' | 'selectordinal';
  locale: string;
  name: string;
};

function buildBranchCompletion(input: BuildBranchCompletionInput): Completion {
  const categories = [
    ...new Intl.PluralRules(input.locale, {
      type: input.kind === 'selectordinal' ? 'ordinal' : 'cardinal',
    }).resolvedOptions().pluralCategories,
  ].sort((a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b));
  const pound = input.group.includes('#') ? '# ' : '';
  const branches = categories
    .map((category, index) => `${category} {${pound}$${index + 1}}`)
    .join(' ');
  return {
    detail: `${input.kind} branches for ${input.locale}`,
    insertText: `{${input.name}, ${input.kind}, ${branches}}`,
    label: `{${input.name}, ${input.kind}, ${categories.join(' ')}}`,
  };
}

function toName(group: string): string {
  const inner = group.slice(1, -1);
  const comma = inner.indexOf(',');
  return (comma === -1 ? inner : inner.slice(0, comma)).trim();
}

function collectBraceGroups(source: string): string[] {
  const groups: string[] = [];
  let index = 0;
  while (index < source.length) {
    if (source[index] !== '{') {
      index += 1;
      continue;
    }
    const end = findGroupEnd(source, index);
    if (end === undefined) {
      return groups;
    }
    groups.push(source.slice(index, end));
    index = end;
  }
  return groups;
}

function findGroupEnd(source: string, start: number): number | undefined {
  let depth = 0;
  let index = start;
  while (index < source.length) {
    const character = source[index];
    if (character === '{') {
      depth += 1;
    } else if (character === '}') {
      depth -= 1;
      if (depth === 0) {
        return index + 1;
      }
    }
    index += 1;
  }
  return undefined;
}

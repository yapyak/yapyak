import type {
  ReferenceMember,
  ReferenceMethodMember,
  ReferencePropertyMember,
  ReferenceTag,
} from './type';

import { describe, expect, it } from 'vitest';

import { classifyExportKind, classifyMemberDisplayKind } from './classify';

const NO_TAGS: ReferenceTag[] = [];

function kindTag(text: string): ReferenceTag {
  return {
    name: 'kind',
    text,
  };
}

function methodMember(
  name: string,
  tags: ReferenceTag[],
): ReferenceMethodMember {
  return {
    deprecated: null,
    description: '',
    examples: [],
    kind: 'method',
    location: {
      column: 1,
      file: '/pkg/src/a.ts',
      line: 1,
    },
    name,
    optional: false,
    overloads: [],
    remarks: '',
    seeAlso: [],
    shape: '',
    tags,
    throws: [],
  };
}

function propertyMember(name: string): ReferencePropertyMember {
  return {
    defaultValue: null,
    description: '',
    kind: 'property',
    name,
    optional: false,
    type: [],
  };
}

describe('classifyExportKind', () => {
  it('returns the `@kind` override when valid', () => {
    expect(
      classifyExportKind('foo', 'variable', [
        kindTag('hook'),
      ]),
    ).toBe('hook');
  });

  it('returns baseKind when the `@kind` override is not a known kind', () => {
    expect(
      classifyExportKind('foo', 'variable', [
        kindTag('widget'),
      ]),
    ).toBe('variable');
  });

  it('returns `hook` when the name matches `use[A-Z]` and baseKind is `function`', () => {
    expect(classifyExportKind('useLocale', 'function', NO_TAGS)).toBe('hook');
  });

  it('returns `component` when the name matches `[A-Z][a-z]` and baseKind is `variable`', () => {
    expect(classifyExportKind('Button', 'variable', NO_TAGS)).toBe('component');
  });

  it('returns baseKind when the name matches neither pattern', () => {
    expect(classifyExportKind('foo', 'function', NO_TAGS)).toBe('function');
  });

  it('returns baseKind unchanged when baseKind is `interface`', () => {
    expect(classifyExportKind('UseLocale', 'interface', NO_TAGS)).toBe(
      'interface',
    );
  });
});

describe('classifyMemberDisplayKind', () => {
  it('returns the classification with `function` when member kind is `method`', () => {
    const member: ReferenceMember = methodMember('useFoo', NO_TAGS);
    expect(classifyMemberDisplayKind(member)).toBe('hook');
  });

  it('returns the classification with `variable` when member kind is `property`', () => {
    const member: ReferenceMember = propertyMember('Foo');
    expect(classifyMemberDisplayKind(member)).toBe('component');
  });
});

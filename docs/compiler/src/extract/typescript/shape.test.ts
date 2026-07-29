import type { ReferenceTag } from './type';

import { describe, expect, it } from 'vitest';

import { parseShapeTypeParameters } from './shape';

const NO_TAGS: ReferenceTag[] = [];

function typeParamTag(text: string): ReferenceTag {
  return {
    name: 'typeParam',
    text,
  };
}

describe('parseShapeTypeParameters', () => {
  it('returns no parameters when shape has no `<`', () => {
    expect(parseShapeTypeParameters('foo', NO_TAGS)).toEqual([]);
  });

  it('parses a single type parameter', () => {
    const result = parseShapeTypeParameters('foo<T>', NO_TAGS);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('T');
    expect(result[0]?.constraint).toBeNull();
    expect(result[0]?.defaultType).toBeNull();
  });

  it('parses every parameter when separated by depth-zero commas', () => {
    const result = parseShapeTypeParameters('foo<T, U, V>', NO_TAGS);
    expect(result.map((parameter) => parameter.name)).toEqual([
      'T',
      'U',
      'V',
    ]);
  });

  it('parses the `extends` constraint when present', () => {
    const result = parseShapeTypeParameters('foo<T extends string>', NO_TAGS);
    expect(result[0]?.name).toBe('T');
    expect(result[0]?.constraint).not.toBeNull();
  });

  it('parses the `=` default when present', () => {
    const result = parseShapeTypeParameters('foo<T = string>', NO_TAGS);
    expect(result[0]?.name).toBe('T');
    expect(result[0]?.defaultType).not.toBeNull();
    expect(result[0]?.constraint).toBeNull();
  });

  it('parses both the `extends` constraint and the `=` default when both are present', () => {
    const result = parseShapeTypeParameters(
      'foo<T extends string = "a">',
      NO_TAGS,
    );
    expect(result[0]?.name).toBe('T');
    expect(result[0]?.constraint).not.toBeNull();
    expect(result[0]?.defaultType).not.toBeNull();
  });

  it('preserves nested generics when splitting parameters', () => {
    const result = parseShapeTypeParameters(
      'foo<T extends Record<string, number>, U>',
      NO_TAGS,
    );
    expect(result.map((parameter) => parameter.name)).toEqual([
      'T',
      'U',
    ]);
  });

  it('returns the description from a matching `@typeParam` tag', () => {
    const result = parseShapeTypeParameters('foo<T>', [
      typeParamTag('T - the input type'),
    ]);
    expect(result[0]?.description).toBe('the input type');
  });

  it('parses a function-type default with parens', () => {
    const result = parseShapeTypeParameters(
      'foo<T = (x: number) => string>',
      NO_TAGS,
    );
    expect(result[0]?.name).toBe('T');
    expect(result[0]?.defaultType).not.toBeNull();
  });

  it('parses a literal-union constraint with a literal-type default', () => {
    const result = parseShapeTypeParameters(
      'foo<T extends "a" | "b" = "a">',
      NO_TAGS,
    );
    expect(result[0]?.name).toBe('T');
    expect(result[0]?.constraint).not.toBeNull();
    expect(result[0]?.defaultType).not.toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { parseIcu } from './parse-icu';

describe('parseIcu', () => {
  it('parses literal text', () => {
    expect(parseIcu('Hello world')).toEqual([
      { type: 'literal', value: 'Hello world' },
    ]);
  });

  it('parses placeholder', () => {
    expect(parseIcu('Hello, {name}!')).toEqual([
      { type: 'literal', value: 'Hello, ' },
      { type: 'placeholder', name: 'name' },
      { type: 'literal', value: '!' },
    ]);
  });

  it('parses multiple placeholders', () => {
    expect(parseIcu('{a} and {b}')).toEqual([
      { type: 'placeholder', name: 'a' },
      { type: 'literal', value: ' and ' },
      { type: 'placeholder', name: 'b' },
    ]);
  });

  it('parses simple plural', () => {
    const result = parseIcu(
      '{count, plural, =0 {No items} =1 {One item} other {# items}}',
    );
    expect(result).toHaveLength(1);
    const node = result[0];
    expect(node?.type).toBe('plural');
    if (node?.type !== 'plural') {
      throw new Error('expected plural');
    }
    expect(node.argument).toBe('count');
    expect(Object.keys(node.cases)).toEqual(['=0', '=1', 'other']);
  });

  it('parses select', () => {
    const result = parseIcu(
      '{gender, select, female {She} male {He} other {They}}',
    );
    expect(result).toHaveLength(1);
    const node = result[0];
    expect(node?.type).toBe('select');
    if (node?.type !== 'select') {
      throw new Error('expected select');
    }
    expect(node.argument).toBe('gender');
    expect(Object.keys(node.cases)).toEqual(['female', 'male', 'other']);
  });

  it('parses pound inside plural', () => {
    const result = parseIcu('{count, plural, other {You have # messages}}');
    const node = result[0];
    if (node?.type !== 'plural') {
      throw new Error('expected plural');
    }
    const otherCase = node.cases.other;
    expect(otherCase).toEqual([
      { type: 'literal', value: 'You have ' },
      { type: 'pound' },
      { type: 'literal', value: ' messages' },
    ]);
  });
});

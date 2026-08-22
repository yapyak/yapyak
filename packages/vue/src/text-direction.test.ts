import type { TextDirection } from 'yapyak';

import { afterEach, describe, expect, it } from 'vitest';
import { effect } from 'vue';
import { setLocale } from 'yapyak';

import { textDirection } from './text-direction';

afterEach(() => {
  setLocale('en');
});

describe('textDirection', () => {
  it('returns the text direction on `value` read', () => {
    setLocale('sv');
    expect(textDirection.value).toBe('ltr');
  });

  it('notifies effects reading `textDirection` when the locale changes', () => {
    let observed: TextDirection | undefined;
    effect(() => {
      observed = textDirection.value;
    });
    setLocale('ar');

    expect(observed).toBe('rtl');
  });
});

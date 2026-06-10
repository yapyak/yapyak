import type { Translator } from '../translator';

import { describe, expect, it, vi } from 'vitest';

import { withProgress } from './progress';

function makeTranslator(): Translator {
  return Object.assign(async () => 'Spara', {
    id: 'fake',
  });
}

describe('withProgress', () => {
  it('preserves the underlying translator `id`', () => {
    const wrapped = withProgress(makeTranslator(), () => {});
    expect(wrapped.id).toBe('fake');
  });

  it('notifies `onProgress` with `1` after every single translation', async () => {
    const onProgress = vi.fn();
    const wrapped = withProgress(makeTranslator(), onProgress);
    await wrapped({
      fileId: 'src/a.ts',
      source: 'Save',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
    expect(onProgress).toHaveBeenCalledWith(1);
  });

  it('writes every chunk count through `onChunk` when batching', async () => {
    const onProgress = vi.fn();
    const innerBatch = vi.fn(async (_requests, options) => {
      options?.onChunk?.(3);
      return [];
    });
    const base: Translator = Object.assign(async () => '', {
      batch: innerBatch,
      id: 'batchy',
    });
    const wrapped = withProgress(base, onProgress);
    await wrapped.batch?.([]);
    expect(onProgress).toHaveBeenCalledWith(3);
  });
});

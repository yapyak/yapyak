import type { TranslateRequest, Translator } from '@yapyak/translator';

export function wrapWithProgress(
  base: Translator,
  onProgress: (count: number) => void,
): Translator {
  const wrapped: Translator = Object.assign(
    async (request: TranslateRequest) => {
      const value = await base(request);
      onProgress(1);
      return value;
    },
    { id: base.id },
  );
  if (typeof base.batch === 'function') {
    const batchFn = base.batch.bind(base);
    wrapped.batch = async (requests) => {
      const results = await batchFn(requests);
      onProgress(results.length);
      return results;
    };
  }
  return wrapped;
}

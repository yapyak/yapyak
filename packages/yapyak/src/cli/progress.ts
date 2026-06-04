import type {
  TranslateBatchOptions,
  TranslateRequest,
  Translator,
} from '../translator';

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
    wrapped.batch = (
      requests: TranslateRequest[],
      options?: TranslateBatchOptions,
    ) =>
      batchFn(requests, {
        ...options,
        onChunk: (count) => {
          onProgress(count);
          options?.onChunk?.(count);
        },
      });
  }
  return wrapped;
}

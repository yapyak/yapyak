import type { LocaleTranslations } from './type';

import { TranslatorInvalidResponseError } from './error';
import { stripCodeFence } from './prompt';

const PREVIEW_LENGTH = 200;

export function parseTranslationsBatch(
  raw: string,
  vendor: string,
): LocaleTranslations[] {
  const unwrapped = stripCodeFence(raw.trim());
  let parsed: unknown;
  try {
    parsed = JSON.parse(unwrapped);
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    throw new TranslatorInvalidResponseError(
      `yapyak ${vendor}: model response is not valid JSON (${reason}). Preview: ${JSON.stringify(preview(unwrapped))}`,
      {
        cause,
        vendor,
      },
    );
  }
  if (!Array.isArray(parsed)) {
    throw new TranslatorInvalidResponseError(
      `yapyak ${vendor}: model returned ${getShapeDescription(parsed)}, expected an array. Preview: ${JSON.stringify(preview(unwrapped))}`,
      {
        vendor,
      },
    );
  }
  return parsed as LocaleTranslations[];
}

export async function parseResponseBody<T>(
  response: Response,
  vendor: string,
  signal: AbortSignal | undefined,
): Promise<T> {
  let raw: string;
  try {
    raw = await readBody(response, signal);
  } catch (cause) {
    if (signal?.aborted) {
      throw cause;
    }
    const reason = cause instanceof Error ? cause.message : String(cause);
    throw new TranslatorInvalidResponseError(
      `yapyak ${vendor}: response body could not be read (${reason}).`,
      {
        cause,
        vendor,
      },
    );
  }
  try {
    return JSON.parse(raw) as T;
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    throw new TranslatorInvalidResponseError(
      `yapyak ${vendor}: response is not valid JSON (${reason}). Preview: ${JSON.stringify(preview(raw))}`,
      {
        cause,
        vendor,
      },
    );
  }
}

function preview(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= PREVIEW_LENGTH) {
    return trimmed;
  }
  return `${trimmed.slice(0, PREVIEW_LENGTH)}…`;
}

function getShapeDescription(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'an array';
  }
  if (typeof value === 'object') {
    return 'an object';
  }
  return `a ${typeof value}`;
}

async function readBody(
  response: Response,
  signal: AbortSignal | undefined,
): Promise<string> {
  const body = response.body;
  if (signal === undefined || body === null) {
    return response.text();
  }
  if (signal.aborted) {
    await body.cancel();
    throw signal.reason ?? new Error('Aborted');
  }
  const reader = body.getReader();
  const onAbort = (): void => {
    void reader.cancel();
  };
  signal.addEventListener('abort', onAbort, {
    once: true,
  });
  const decoder = new TextDecoder();
  let raw = '';
  try {
    let chunk = await reader.read();
    while (!chunk.done) {
      raw += decoder.decode(chunk.value, {
        stream: true,
      });
      chunk = await reader.read();
    }
    raw += decoder.decode();
  } catch (cause) {
    if (signal.aborted) {
      throw signal.reason ?? new Error('Aborted');
    }
    throw cause;
  } finally {
    signal.removeEventListener('abort', onAbort);
  }
  if (signal.aborted) {
    throw signal.reason ?? new Error('Aborted');
  }
  return raw;
}

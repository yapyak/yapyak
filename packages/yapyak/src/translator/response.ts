import type { LocaleTranslations } from './type';

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
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `yapyak ${vendor}: model response is not valid JSON (${reason}). Preview: ${JSON.stringify(preview(unwrapped))}`,
    );
  }
  if (!Array.isArray(parsed)) {
    throw new Error(
      `yapyak ${vendor}: model returned ${getShapeDescription(parsed)}, expected an array. Preview: ${JSON.stringify(preview(unwrapped))}`,
    );
  }
  return parsed as LocaleTranslations[];
}

export async function parseResponseBody<T>(
  response: Response,
  vendor: string,
): Promise<T> {
  let raw: string;
  try {
    raw = await response.text();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `yapyak ${vendor}: response body could not be read (${reason}).`,
    );
  }
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `yapyak ${vendor}: response is not valid JSON (${reason}). Preview: ${JSON.stringify(preview(raw))}`,
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

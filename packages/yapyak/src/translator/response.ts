import type { LocaleTranslations } from './type';

const PREVIEW_LENGTH = 200;

export function parseResponse(
  raw: string,
  vendor: string,
): LocaleTranslations[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `yapyak ${vendor}: model response is not valid JSON (${reason}). Preview: ${JSON.stringify(preview(raw))}`,
    );
  }
  if (!Array.isArray(parsed)) {
    throw new Error(
      `yapyak ${vendor}: model returned ${describeShape(parsed)}, expected an array. Preview: ${JSON.stringify(preview(raw))}`,
    );
  }
  return parsed as LocaleTranslations[];
}

function preview(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= PREVIEW_LENGTH) {
    return trimmed;
  }
  return `${trimmed.slice(0, PREVIEW_LENGTH)}…`;
}

function describeShape(value: unknown): string {
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

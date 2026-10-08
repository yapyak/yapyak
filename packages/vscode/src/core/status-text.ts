export type StatusTextInput = {
  failed: number;
  missing: number;
  translating?: number;
};

export function buildStatusText(input: StatusTextInput): string {
  const { failed, missing, translating } = input;
  if (translating !== undefined) {
    return `$(sync~spin) Translating (${translating})`;
  }
  if (failed > 0) {
    return `$(warning) Failed (${failed})`;
  }
  return missing === 0
    ? '$(check) yapyak'
    : `$(globe) Untranslated (${missing})`;
}

export function buildUnsupportedStatusText(
  found: string,
  required: string,
): string {
  return `$(warning) yapyak ${found} · needs ${required}`;
}

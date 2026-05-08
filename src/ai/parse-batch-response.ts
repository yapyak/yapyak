export function parseBatchResponse(
  raw: string,
  expectedLength: number,
): string[] {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    throw new Error(
      `Failed to parse batch response as JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Batch response is not a JSON array');
  }

  if (parsed.length !== expectedLength) {
    throw new Error(
      `Batch response length mismatch: expected ${expectedLength}, got ${parsed.length}`,
    );
  }

  for (let i = 0; i < parsed.length; i++) {
    if (typeof parsed[i] !== 'string') {
      throw new Error(`Batch response item ${i} is not a string`);
    }
  }

  return parsed as string[];
}

import { describe, expect, it } from 'vitest';

import { parseResponseBody, parseTranslationsBatch } from './response';

describe('parseTranslationsBatch', () => {
  it('returns the parsed array for a well-formed response', () => {
    expect(parseTranslationsBatch('[{"sv":"Hej"}]', 'openai')).toEqual([
      {
        sv: 'Hej',
      },
    ]);
  });

  it('returns an empty array when the response is `[]`', () => {
    expect(parseTranslationsBatch('[]', 'openai')).toEqual([]);
  });

  describe('invalid JSON', () => {
    it('throws an Error tagged with the vendor name', () => {
      expect(() => parseTranslationsBatch('not json', 'openai')).toThrow(
        /yapyak openai: model response is not valid JSON/,
      );
    });

    it('throws an Error that includes the underlying SyntaxError reason', () => {
      expect(() => parseTranslationsBatch('{"sv":', 'anthropic')).toThrow(
        /yapyak anthropic: model response is not valid JSON \(.+\)/,
      );
    });

    it('throws an Error that includes a JSON-encoded preview of the response', () => {
      expect(() => parseTranslationsBatch('garbage payload', 'gemini')).toThrow(
        /Preview: "garbage payload"/,
      );
    });

    it('throws an Error whose preview is truncated past 200 characters with `…`', () => {
      const long = `not_json_${'x'.repeat(300)}`;
      expect(() => parseTranslationsBatch(long, 'ollama')).toThrow(/…/);
      expect(() => parseTranslationsBatch(long, 'ollama')).not.toThrow(
        new RegExp('x'.repeat(250)),
      );
    });
  });

  describe('non-array result', () => {
    it('throws when the response is an object', () => {
      expect(() => parseTranslationsBatch('{"sv":"Hej"}', 'openai')).toThrow(
        /yapyak openai: model returned an object, expected an array/,
      );
    });

    it('throws when the response is a string', () => {
      expect(() => parseTranslationsBatch('"Hej"', 'anthropic')).toThrow(
        /yapyak anthropic: model returned a string, expected an array/,
      );
    });

    it('throws when the response is a number', () => {
      expect(() => parseTranslationsBatch('42', 'gemini')).toThrow(
        /yapyak gemini: model returned a number, expected an array/,
      );
    });

    it('throws when the response is `null`', () => {
      expect(() => parseTranslationsBatch('null', 'ollama')).toThrow(
        /yapyak ollama: model returned null, expected an array/,
      );
    });

    it('throws when the response is a boolean', () => {
      expect(() => parseTranslationsBatch('true', 'openai')).toThrow(
        /yapyak openai: model returned a boolean, expected an array/,
      );
    });

    it('throws an Error that includes a JSON-encoded preview of the response', () => {
      expect(() => parseTranslationsBatch('{"sv":"Hej"}', 'openai')).toThrow(
        /Preview: "{\\"sv\\":\\"Hej\\"}"/,
      );
    });
  });
});

describe('parseResponseBody', () => {
  it('returns the parsed body for a well-formed JSON response', async () => {
    const response = new Response(
      JSON.stringify({
        ok: true,
      }),
      {
        status: 200,
      },
    );
    const result = await parseResponseBody<{
      ok: boolean;
    }>(response, 'openai');
    expect(result.ok).toBe(true);
  });

  it('throws a vendor-tagged Error when the body is HTML with a 200 status', async () => {
    const response = new Response('<html><body>nope</body></html>', {
      status: 200,
    });
    await expect(parseResponseBody(response, 'openai')).rejects.toThrow(
      /yapyak openai: response is not valid JSON/,
    );
  });

  it('throws an Error whose preview is truncated past 200 characters with `…`', async () => {
    const long = `<html>${'x'.repeat(300)}</html>`;
    const response = new Response(long, {
      status: 200,
    });
    await expect(parseResponseBody(response, 'gemini')).rejects.toThrow(/…/);
  });

  it('throws a vendor-tagged Error when the body stream errors mid-read', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.error(new Error('connection reset'));
      },
    });
    const response = new Response(stream, {
      status: 200,
    });
    await expect(parseResponseBody(response, 'anthropic')).rejects.toThrow(
      /yapyak anthropic: response body could not be read \(connection reset\)/,
    );
  });

  it('throws a vendor-tagged Error when the body stream errors with a non-Error value', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.error('connection reset');
      },
    });
    const response = new Response(stream, {
      status: 200,
    });
    await expect(parseResponseBody(response, 'gemini')).rejects.toThrow(
      /yapyak gemini: response body could not be read \(connection reset\)/,
    );
  });
});

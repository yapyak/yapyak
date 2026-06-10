import { describe, expect, it } from 'vitest';

import { parseResponse } from './response';

describe('parseResponse', () => {
  it('returns the parsed array for a well-formed response', () => {
    expect(parseResponse('[{"sv":"Hej"}]', 'openai')).toEqual([
      {
        sv: 'Hej',
      },
    ]);
  });

  it('returns an empty array when the response is `[]`', () => {
    expect(parseResponse('[]', 'openai')).toEqual([]);
  });

  describe('invalid JSON', () => {
    it('throws an Error tagged with the vendor name', () => {
      expect(() => parseResponse('not json', 'openai')).toThrow(
        /yapyak openai: model response is not valid JSON/,
      );
    });

    it('throws an Error that includes the underlying SyntaxError reason', () => {
      expect(() => parseResponse('{"sv":', 'anthropic')).toThrow(
        /yapyak anthropic: model response is not valid JSON \(.+\)/,
      );
    });

    it('throws an Error that includes a JSON-encoded preview of the response', () => {
      expect(() => parseResponse('garbage payload', 'gemini')).toThrow(
        /Preview: "garbage payload"/,
      );
    });

    it('throws an Error whose preview is truncated past 200 characters with `…`', () => {
      const long = `not_json_${'x'.repeat(300)}`;
      expect(() => parseResponse(long, 'ollama')).toThrow(/…/);
      expect(() => parseResponse(long, 'ollama')).not.toThrow(
        new RegExp('x'.repeat(250)),
      );
    });
  });

  describe('non-array result', () => {
    it('throws when the response is an object', () => {
      expect(() => parseResponse('{"sv":"Hej"}', 'openai')).toThrow(
        /yapyak openai: model returned an object, expected an array/,
      );
    });

    it('throws when the response is a string', () => {
      expect(() => parseResponse('"Hej"', 'anthropic')).toThrow(
        /yapyak anthropic: model returned a string, expected an array/,
      );
    });

    it('throws when the response is a number', () => {
      expect(() => parseResponse('42', 'gemini')).toThrow(
        /yapyak gemini: model returned a number, expected an array/,
      );
    });

    it('throws when the response is `null`', () => {
      expect(() => parseResponse('null', 'ollama')).toThrow(
        /yapyak ollama: model returned null, expected an array/,
      );
    });

    it('throws when the response is a boolean', () => {
      expect(() => parseResponse('true', 'openai')).toThrow(
        /yapyak openai: model returned a boolean, expected an array/,
      );
    });

    it('throws an Error that includes a JSON-encoded preview of the response', () => {
      expect(() => parseResponse('{"sv":"Hej"}', 'openai')).toThrow(
        /Preview: "{\\"sv\\":\\"Hej\\"}"/,
      );
    });
  });
});

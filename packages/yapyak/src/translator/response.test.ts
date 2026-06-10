import { describe, expect, it } from 'vitest';

import { parseResponse } from './response';

describe('parseResponse', () => {
  it('returns the parsed array for a well-formed response', () => {
    const result = parseResponse('[{"sv":"Hej"}]', 'openai');
    expect(result).toEqual([
      {
        sv: 'Hej',
      },
    ]);
  });

  it('returns an empty array when the response is `[]`', () => {
    expect(parseResponse('[]', 'openai')).toEqual([]);
  });

  describe('invalid JSON', () => {
    it('throws a vendor-tagged error', () => {
      expect(() => parseResponse('not json', 'openai')).toThrow(
        /yapyak openai: model response is not valid JSON/,
      );
    });

    it('includes the underlying syntax error reason', () => {
      let captured: unknown;
      try {
        parseResponse('{"sv":', 'anthropic');
      } catch (error) {
        captured = error;
      }
      expect(captured).toBeInstanceOf(Error);
      expect((captured as Error).message).toMatch(/anthropic/);
      expect((captured as Error).message).toMatch(/not valid JSON/);
    });

    it('includes a truncated preview of the raw response', () => {
      let captured: unknown;
      try {
        parseResponse('garbage payload', 'gemini');
      } catch (error) {
        captured = error;
      }
      expect((captured as Error).message).toMatch(/"garbage payload"/);
    });

    it('truncates previews longer than 200 characters with `…`', () => {
      const long = `not_json_${'x'.repeat(300)}`;
      let captured: unknown;
      try {
        parseResponse(long, 'ollama');
      } catch (error) {
        captured = error;
      }
      const message = (captured as Error).message;
      expect(message).toMatch(/…/);
      expect(message).not.toContain('x'.repeat(250));
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

    it('throws when the response is `true`', () => {
      expect(() => parseResponse('true', 'openai')).toThrow(
        /yapyak openai: model returned a boolean, expected an array/,
      );
    });

    it('includes the response preview in the error', () => {
      expect(() => parseResponse('{"sv":"Hej"}', 'openai')).toThrow(
        /Preview: "{\\"sv\\":\\"Hej\\"}"/,
      );
    });
  });
});

import { describe, expect, it } from 'vitest';

import { buildSystem, stripCodeFence } from './prompt';

describe('buildSystem', () => {
  it('builds a system prompt listing every target locale', () => {
    const result = buildSystem({}, 'en', ['sv', 'de']);
    expect(result).toContain('from en into every one of these target locales');
    expect(result).toContain('sv, de');
  });

  it('returns a prompt without a voice line when no voice is given', () => {
    const result = buildSystem({}, 'en', ['sv']);
    expect(result).not.toMatch(/^Voice: /m);
  });

  it('appends a `Voice:` line when a voice is given', () => {
    const result = buildSystem({ voice: 'formal' }, 'en', ['sv']);
    expect(result).toContain('Voice: formal');
  });

  it('appends a glossary section when entries match a target locale', () => {
    const result = buildSystem(
      { glossary: { Save: { de: 'Speichern', sv: 'Spara' } } },
      'en',
      ['sv', 'de'],
    );
    expect(result).toContain('Use these glossary terms');
    expect(result).toContain('"Save" → sv="Spara", de="Speichern"');
  });

  it('elides glossary entries with no translation for any target locale', () => {
    const result = buildSystem(
      { glossary: { Save: { fr: 'Enregistrer' } } },
      'en',
      ['sv'],
    );
    expect(result).not.toContain('Use these glossary terms');
  });
});

describe('stripCodeFence', () => {
  it('returns the text unchanged when it does not start with a fence', () => {
    expect(stripCodeFence('[{"sv": "Hej"}]')).toBe('[{"sv": "Hej"}]');
  });

  it('strips a plain ``` fence wrapping the payload', () => {
    expect(stripCodeFence('```\n[1, 2]\n```')).toBe('[1, 2]');
  });

  it('strips a ```json fence wrapping the payload', () => {
    expect(stripCodeFence('```json\n[1, 2]\n```')).toBe('[1, 2]');
  });
});

import { describe, expect, it } from 'vitest';
import { detectRenames, type MessagePosition } from './detect-renames.js';

describe('detectRenames', () => {
  it('returns empty when nothing changed', () => {
    const entries: MessagePosition[] = [
      { source: 'Save', line: 12, column: 5 },
    ];
    expect(detectRenames(entries, entries)).toEqual([]);
  });

  it('detects a single rename at the same position', () => {
    const oldEntries: MessagePosition[] = [
      { source: 'Save changes', line: 12, column: 5 },
      { source: 'Cancel', line: 18, column: 5 },
    ];
    const newEntries: MessagePosition[] = [
      { source: 'Save', line: 12, column: 5 },
      { source: 'Cancel', line: 18, column: 5 },
    ];
    expect(detectRenames(oldEntries, newEntries)).toEqual([
      { from: 'Save changes', to: 'Save' },
    ]);
  });

  it('does not detect renames across different positions', () => {
    const oldEntries: MessagePosition[] = [
      { source: 'Save changes', line: 12, column: 5 },
    ];
    const newEntries: MessagePosition[] = [
      { source: 'Save', line: 30, column: 5 },
    ];
    expect(detectRenames(oldEntries, newEntries)).toEqual([]);
  });

  it('handles two strings on the same line, different columns', () => {
    const oldEntries: MessagePosition[] = [
      { source: 'Yes', line: 12, column: 5 },
      { source: 'No', line: 12, column: 30 },
    ];
    const newEntries: MessagePosition[] = [
      { source: 'OK', line: 12, column: 5 },
      { source: 'No', line: 12, column: 30 },
    ];
    expect(detectRenames(oldEntries, newEntries)).toEqual([
      { from: 'Yes', to: 'OK' },
    ]);
  });

  it('does not detect renames when sources are unchanged but positions shifted', () => {
    const oldEntries: MessagePosition[] = [
      { source: 'Save', line: 12, column: 5 },
      { source: 'Cancel', line: 18, column: 5 },
    ];
    const newEntries: MessagePosition[] = [
      { source: 'Save', line: 14, column: 5 },
      { source: 'Cancel', line: 22, column: 5 },
    ];
    expect(detectRenames(oldEntries, newEntries)).toEqual([]);
  });

  it('handles multiple renames at different positions', () => {
    const oldEntries: MessagePosition[] = [
      { source: 'Save changes', line: 12, column: 5 },
      { source: 'Discard', line: 18, column: 5 },
    ];
    const newEntries: MessagePosition[] = [
      { source: 'Save', line: 12, column: 5 },
      { source: 'Cancel', line: 18, column: 5 },
    ];
    const renames = detectRenames(oldEntries, newEntries);
    expect(renames).toHaveLength(2);
    expect(renames).toEqual(
      expect.arrayContaining([
        { from: 'Save changes', to: 'Save' },
        { from: 'Discard', to: 'Cancel' },
      ]),
    );
  });

  it('does not match a removed source to a new source if their positions differ', () => {
    const oldEntries: MessagePosition[] = [
      { source: 'Save changes', line: 12, column: 5 },
    ];
    const newEntries: MessagePosition[] = [
      { source: 'Save', line: 12, column: 10 },
    ];
    expect(detectRenames(oldEntries, newEntries)).toEqual([]);
  });

  it('returns empty when only additions happen (no removals)', () => {
    const oldEntries: MessagePosition[] = [
      { source: 'Save', line: 12, column: 5 },
    ];
    const newEntries: MessagePosition[] = [
      { source: 'Save', line: 12, column: 5 },
      { source: 'Cancel', line: 18, column: 5 },
    ];
    expect(detectRenames(oldEntries, newEntries)).toEqual([]);
  });

  it('returns empty when only removals happen (no additions)', () => {
    const oldEntries: MessagePosition[] = [
      { source: 'Save', line: 12, column: 5 },
      { source: 'Cancel', line: 18, column: 5 },
    ];
    const newEntries: MessagePosition[] = [
      { source: 'Save', line: 12, column: 5 },
    ];
    expect(detectRenames(oldEntries, newEntries)).toEqual([]);
  });
});

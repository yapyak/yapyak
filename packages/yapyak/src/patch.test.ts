import { describe, expect, it } from 'vitest';

import { buildPatches } from './patch';

describe('buildPatches', () => {
  it('returns no patches when before and after match', () => {
    const file = {
      'src/a.tsx': {
        Hello: 'Hej',
      },
    };
    expect(buildPatches(file, file, 'sv')).toEqual([]);
  });

  it('emits a patch when a simple value changes', () => {
    const patches = buildPatches(
      {
        'src/a.tsx': {
          Hello: 'Hej',
        },
      },
      {
        'src/a.tsx': {
          Hello: 'Hejsan',
        },
      },
      'sv',
    );
    expect(patches).toEqual([
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Hello',
          null,
        ]),
        locale: 'sv',
        value: 'Hejsan',
      },
    ]);
  });

  it('emits a patch when a source key is new', () => {
    const patches = buildPatches(
      {},
      {
        'src/a.tsx': {
          Save: 'Spara',
        },
      },
      'sv',
    );
    expect(patches).toEqual([
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Save',
          null,
        ]),
        locale: 'sv',
        value: 'Spara',
      },
    ]);
  });

  it('emits a context-keyed patch when a context-variant value changes', () => {
    const patches = buildPatches(
      {
        'src/a.tsx': {
          Save: {
            button: 'Spara',
          },
        },
      },
      {
        'src/a.tsx': {
          Save: {
            button: 'Spara nu',
          },
        },
      },
      'sv',
    );
    expect(patches).toEqual([
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Save',
          'button',
        ]),
        locale: 'sv',
        value: 'Spara nu',
      },
    ]);
  });

  it('emits a Template patch when the value holds an ICU placeholder', () => {
    const patches = buildPatches(
      {},
      {
        'src/a.tsx': {
          'Hi {name}': 'Hej {name}',
        },
      },
      'sv',
    );
    expect(patches).toHaveLength(1);
    expect(patches[0]).toMatchObject({
      fileId: 'src/a.tsx',
      id: JSON.stringify([
        'Hi {name}',
        null,
      ]),
      locale: 'sv',
    });
    expect(Array.isArray(patches[0]?.value)).toBe(true);
  });

  it('emits a context-keyed patch when a context map is new', () => {
    const patches = buildPatches(
      {},
      {
        'src/a.tsx': {
          Open: {
            button: 'Öppna',
          },
        },
      },
      'sv',
    );
    expect(patches).toEqual([
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Open',
          'button',
        ]),
        locale: 'sv',
        value: 'Öppna',
      },
    ]);
  });

  it('returns no patches when a context-variant value is unchanged', () => {
    const file = {
      'src/a.tsx': {
        Open: {
          button: 'Öppna',
        },
      },
    };
    expect(buildPatches(file, file, 'sv')).toEqual([]);
  });

  it('emits an empty-string patch when a context variant is removed', () => {
    const patches = buildPatches(
      {
        'src/a.tsx': {
          Open: {
            badge: 'Öppen',
            button: 'Öppna',
          },
        },
      },
      {
        'src/a.tsx': {
          Open: {
            button: 'Öppna',
          },
        },
      },
      'sv',
    );
    expect(patches).toEqual([
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Open',
          'badge',
        ]),
        locale: 'sv',
        value: '',
      },
    ]);
  });

  it('emits an empty-string patch when a context map is removed', () => {
    const patches = buildPatches(
      {
        'src/a.tsx': {
          Open: {
            button: 'Öppna',
          },
        },
      },
      {},
      'sv',
    );
    expect(patches).toEqual([
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Open',
          'button',
        ]),
        locale: 'sv',
        value: '',
      },
    ]);
  });

  it('emits an empty-string plain-key patch when an entry becomes a context map', () => {
    const patches = buildPatches(
      {
        'src/a.tsx': {
          Open: 'Öppna',
        },
      },
      {
        'src/a.tsx': {
          Open: {
            button: 'Öppna',
          },
        },
      },
      'sv',
    );
    expect(patches).toEqual([
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Open',
          null,
        ]),
        locale: 'sv',
        value: '',
      },
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Open',
          'button',
        ]),
        locale: 'sv',
        value: 'Öppna',
      },
    ]);
  });

  it('emits empty-string context patches when an entry becomes a plain string', () => {
    const patches = buildPatches(
      {
        'src/a.tsx': {
          Open: {
            badge: 'Öppen',
            button: 'Öppna',
          },
        },
      },
      {
        'src/a.tsx': {
          Open: 'Öppna',
        },
      },
      'sv',
    );
    expect(patches).toEqual([
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Open',
          'badge',
        ]),
        locale: 'sv',
        value: '',
      },
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Open',
          'button',
        ]),
        locale: 'sv',
        value: '',
      },
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Open',
          null,
        ]),
        locale: 'sv',
        value: 'Öppna',
      },
    ]);
  });

  it('emits an empty-string patch when the value is an empty stub', () => {
    const patches = buildPatches(
      {},
      {
        'src/a.tsx': {
          Hello: '',
        },
      },
      'sv',
    );
    expect(patches).toEqual([
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Hello',
          null,
        ]),
        locale: 'sv',
        value: '',
      },
    ]);
  });

  it('emits an empty-string patch when a source key is removed', () => {
    const patches = buildPatches(
      {
        'src/a.tsx': {
          Save: 'Spara',
        },
      },
      {},
      'sv',
    );
    expect(patches).toEqual([
      {
        fileId: 'src/a.tsx',
        id: JSON.stringify([
          'Save',
          null,
        ]),
        locale: 'sv',
        value: '',
      },
    ]);
  });
});

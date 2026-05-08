export type IcuNode =
  | { type: 'literal'; value: string }
  | { type: 'placeholder'; name: string }
  | { type: 'pound' }
  | {
      type: 'plural';
      argument: string;
      cases: Record<string, IcuNode[]>;
    }
  | {
      type: 'select';
      argument: string;
      cases: Record<string, IcuNode[]>;
    };

export class IcuParseError extends Error {
  input: string;
  position: number;

  constructor(message: string, input: string, position: number) {
    super(
      `ICU parse error at column ${position}: ${message}\n  input: ${input}`,
    );
    this.input = input;
    this.position = position;
  }
}

interface State {
  input: string;
  pos: number;
}

export function parseIcu(input: string): IcuNode[] {
  const state: State = { input, pos: 0 };
  const nodes = parseMessage(state, new Set(), false);
  if (state.pos < state.input.length) {
    throw new IcuParseError(`unexpected character`, input, state.pos);
  }
  return nodes;
}

function parseMessage(
  state: State,
  stop: Set<string>,
  inPlural: boolean,
): IcuNode[] {
  const nodes: IcuNode[] = [];
  while (state.pos < state.input.length) {
    const ch = state.input[state.pos];
    if (ch && stop.has(ch)) {
      break;
    }
    if (ch === '{') {
      nodes.push(parseExpression(state));
    } else if (ch === '#' && inPlural) {
      nodes.push({ type: 'pound' });
      state.pos++;
    } else {
      nodes.push(parseLiteral(state, stop, inPlural));
    }
  }
  return nodes;
}

function parseLiteral(
  state: State,
  stop: Set<string>,
  inPlural: boolean,
): IcuNode {
  const start = state.pos;
  while (state.pos < state.input.length) {
    const ch = state.input[state.pos];
    if (!ch) {
      break;
    }
    if (ch === '{' || (ch === '#' && inPlural) || stop.has(ch)) {
      break;
    }
    state.pos++;
  }
  return { type: 'literal', value: state.input.slice(start, state.pos) };
}

function parseExpression(state: State): IcuNode {
  expect(state, '{');
  skipWhitespace(state);
  const name = parseIdentifier(state);
  skipWhitespace(state);

  if (state.input[state.pos] === '}') {
    state.pos++;
    return { type: 'placeholder', name };
  }

  expect(state, ',');
  skipWhitespace(state);
  const formatType = parseIdentifier(state);
  skipWhitespace(state);

  if (formatType === 'plural') {
    expect(state, ',');
    const cases = parseCases(state, true);
    expect(state, '}');
    return { type: 'plural', argument: name, cases };
  }

  if (formatType === 'select') {
    expect(state, ',');
    const cases = parseCases(state, false);
    expect(state, '}');
    return { type: 'select', argument: name, cases };
  }

  throw new IcuParseError(
    `unsupported format type "${formatType}"`,
    state.input,
    state.pos,
  );
}

function parseCases(
  state: State,
  inPlural: boolean,
): Record<string, IcuNode[]> {
  const cases: Record<string, IcuNode[]> = {};
  skipWhitespace(state);
  while (state.pos < state.input.length && state.input[state.pos] !== '}') {
    const key = parseCaseKey(state);
    skipWhitespace(state);
    expect(state, '{');
    const body = parseMessage(state, new Set(['}']), inPlural);
    expect(state, '}');
    skipWhitespace(state);
    cases[key] = body;
  }
  return cases;
}

function parseCaseKey(state: State): string {
  const start = state.pos;
  if (state.input[state.pos] === '=') {
    state.pos++;
    while (
      state.pos < state.input.length &&
      /\d/.test(state.input[state.pos] ?? '')
    ) {
      state.pos++;
    }
    return state.input.slice(start, state.pos);
  }
  while (state.pos < state.input.length) {
    const ch = state.input[state.pos] ?? '';
    if (!/[a-zA-Z0-9_]/.test(ch)) {
      break;
    }
    state.pos++;
  }
  return state.input.slice(start, state.pos);
}

function parseIdentifier(state: State): string {
  const start = state.pos;
  while (state.pos < state.input.length) {
    const ch = state.input[state.pos] ?? '';
    if (!/[a-zA-Z0-9_]/.test(ch)) {
      break;
    }
    state.pos++;
  }
  if (state.pos === start) {
    throw new IcuParseError('expected identifier', state.input, state.pos);
  }
  return state.input.slice(start, state.pos);
}

function expect(state: State, ch: string): void {
  if (state.input[state.pos] !== ch) {
    throw new IcuParseError(
      `expected "${ch}" but got "${state.input[state.pos] ?? 'end of input'}"`,
      state.input,
      state.pos,
    );
  }
  state.pos++;
}

function skipWhitespace(state: State): void {
  while (
    state.pos < state.input.length &&
    /\s/.test(state.input[state.pos] ?? '')
  ) {
    state.pos++;
  }
}

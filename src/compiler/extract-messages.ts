export interface ExtractedMessage {
  column: number;
  fileId: string;
  line: number;
  source: string;
}

export interface ExtractMessagesOptions {
  bareNames?: ReadonlySet<string>;
  code: string;
  factoryNames: ReadonlySet<string>;
  fileId: string;
}

export function extractMessages(
  options: ExtractMessagesOptions,
): ExtractedMessage[] {
  const { bareNames, code, factoryNames, fileId } = options;
  const messages: ExtractedMessage[] = [];

  const factoryAlternatives = [...factoryNames]
    .map((name) => escapeRegExp(name))
    .join('|');

  if (factoryAlternatives) {
    const factoryPattern = new RegExp(
      `\\b(?:${factoryAlternatives})\\.t\\s*\\(\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1`,
      'g',
    );
    collect(code, factoryPattern, fileId, messages);
  }

  if (bareNames && bareNames.size > 0) {
    const bareAlternatives = [...bareNames].map(escapeRegExp).join('|');
    const barePattern = new RegExp(
      `(?:^|[^.\\w$])(?:${bareAlternatives})\\s*\\(\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1`,
      'g',
    );
    collect(code, barePattern, fileId, messages);
  }

  return messages;
}

function collect(
  code: string,
  pattern: RegExp,
  fileId: string,
  messages: ExtractedMessage[],
): void {
  let match: RegExpExecArray | null = pattern.exec(code);
  while (match !== null) {
    const quote = match[1];
    const raw = match[2];
    if (quote === undefined || raw === undefined) {
      match = pattern.exec(code);
      continue;
    }
    const source = unescapeString(raw, quote);
    const offset = match.index;
    const { line, column } = locate(code, offset);
    messages.push({
      column,
      fileId,
      line,
      source,
    });
    match = pattern.exec(code);
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function unescapeString(raw: string, quote: string): string {
  let out = '';
  let i = 0;
  while (i < raw.length) {
    const ch = raw[i];
    if (ch === '\\') {
      const next = raw[i + 1];
      if (next === undefined) {
        break;
      }
      if (next === 'n') {
        out += '\n';
      } else if (next === 't') {
        out += '\t';
      } else if (next === 'r') {
        out += '\r';
      } else if (next === '\\') {
        out += '\\';
      } else if (next === quote) {
        out += quote;
      } else {
        out += next;
      }
      i += 2;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

function locate(
  code: string,
  offset: number,
): { line: number; column: number } {
  let line = 1;
  let column = 1;
  for (let i = 0; i < offset; i++) {
    if (code[i] === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }
  return { line, column };
}

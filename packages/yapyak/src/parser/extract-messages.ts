import type { MessageContext } from '../translator';

import {
  DynamicSourceError,
  deriveComponentName,
  extractSnippet,
  findCallSites,
  locate,
  parseSourceArg,
  sliceArguments,
  splitTopLevelArgs,
} from './parser';

/** @internal */
export interface ExtractedMessage {
  column: number;
  context: MessageContext;
  fileId: string;
  line: number;
  source: string;
}

/** @internal */
export interface ExtractMessagesOptions {
  code: string;
  fileId: string;
}

/** @internal */
export class DynamicMessageError extends DynamicSourceError {}

/** @internal */
export function extractMessages(
  options: ExtractMessagesOptions,
): ExtractedMessage[] {
  const { code, fileId } = options;
  const callSites = findCallSites(code);
  if (callSites.length === 0) {
    return [];
  }
  const componentName = deriveComponentName(fileId);
  const messages: ExtractedMessage[] = [];

  for (const site of callSites) {
    const argsRange = sliceArguments(code, site.argsStart);
    if (argsRange === undefined) {
      continue;
    }
    const argList = splitTopLevelArgs(argsRange.args);
    const firstArg = argList[0];
    const position = locate(code, site.callStart);
    if (firstArg === undefined) {
      throw new DynamicSourceError(
        '$t() called with no arguments',
        fileId,
        position,
      );
    }
    let source: string;
    try {
      source = parseSourceArg(firstArg);
    } catch (error) {
      if (error instanceof DynamicSourceError) {
        throw new DynamicSourceError(error.message, fileId, position);
      }
      throw error;
    }
    messages.push({
      column: position.column,
      context: {
        componentName,
        enclosingElement: findEnclosingElement(code, site.callStart),
        snippet: extractSnippet({ code, line: position.line }),
      },
      fileId,
      line: position.line,
      source,
    });
  }
  return messages;
}

function findEnclosingElement(
  code: string,
  position: number,
): string | undefined {
  let depth = 0;
  let i = position;
  while (i > 0) {
    i--;
    const ch = code[i];
    if (ch === '>') {
      const prev = code[i - 1];
      if (prev === '/') {
        depth++;
      }
      continue;
    }
    if (ch === '<') {
      const next = code[i + 1];
      if (next === '/') {
        depth++;
        continue;
      }
      if (next === '!' || next === '?') {
        continue;
      }
      if (depth > 0) {
        depth--;
        continue;
      }
      const tag = readTagName(code, i + 1);
      if (tag !== null) {
        return tag;
      }
      return undefined;
    }
  }
  return undefined;
}

function readTagName(code: string, start: number): string | null {
  let i = start;
  let name = '';
  while (i < code.length) {
    const ch = code[i];
    if (ch === undefined) {
      break;
    }
    if (
      (ch >= 'a' && ch <= 'z') ||
      (ch >= 'A' && ch <= 'Z') ||
      (ch >= '0' && ch <= '9') ||
      ch === '-' ||
      ch === '_' ||
      ch === '.'
    ) {
      name += ch;
      i++;
      continue;
    }
    break;
  }
  return name === '' ? null : name;
}

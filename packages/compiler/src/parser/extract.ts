import type { PlaceholderInfo } from './plural';
import type {
  Diagnostic,
  ExtractedMessage,
  ExtractFileRequest,
  ExtractFileResult,
  Location,
  Placeholder,
} from './type';

import * as ts from 'typescript';

import { resolveCallSiteContext } from './call-site-context';
import { discoverCalls } from './discover-calls';
import { toMessageId } from './id';
import { parseArguments } from './parse-arguments';
import { parsePlaceholders } from './plural';
import { resolveBindings } from './resolve-bindings';

export function extractFile(request: ExtractFileRequest): ExtractFileResult {
  const sourceFile = createSourceFile(request.fileId, request.source);
  const bindings = resolveBindings(sourceFile);
  const callSites = discoverCalls(sourceFile, bindings);

  const diagnostics: Diagnostic[] = [];
  const messagesById = new Map<string, ExtractedMessage>();

  for (const callSite of callSites) {
    const parsed = parseArguments(callSite);
    diagnostics.push(...parsed.diagnostics);

    if (parsed.source === '') continue;

    const placeholderInfos = parsePlaceholders(parsed.source);
    const placeholders = placeholderInfos.map(toPublicPlaceholder);
    const id = toMessageId(parsed.source);

    const location: Location = {
      callSiteContext: resolveCallSiteContext(callSite.node, sourceFile),
      fileId: request.fileId,
      range: parsed.sourceRange,
    };

    const existing = messagesById.get(id);
    if (existing !== undefined) {
      existing.locations.push(location);
      continue;
    }

    messagesById.set(id, {
      id,
      locations: [location],
      placeholders,
      source: parsed.source,
    });
  }

  return {
    callSites,
    diagnostics,
    messages: Array.from(messagesById.values()),
  };
}

function createSourceFile(fileId: string, source: string): ts.SourceFile {
  return ts.createSourceFile(
    fileId,
    source,
    ts.ScriptTarget.ESNext,
    true,
    getScriptKind(fileId),
  );
}

function getScriptKind(fileId: string): ts.ScriptKind {
  if (fileId.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (fileId.endsWith('.jsx')) return ts.ScriptKind.JSX;
  if (
    fileId.endsWith('.js') ||
    fileId.endsWith('.mjs') ||
    fileId.endsWith('.cjs')
  ) {
    return ts.ScriptKind.JS;
  }
  return ts.ScriptKind.TS;
}

function toPublicPlaceholder(info: PlaceholderInfo): Placeholder {
  const result: Placeholder = { kind: info.kind, name: info.name };
  if (info.variants !== undefined) {
    result.variants = info.variants;
  }
  return result;
}

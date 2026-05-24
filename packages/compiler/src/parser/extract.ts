import type { PlaceholderInfo } from './plural';
import type {
  CallSite,
  Diagnostic,
  ExtractedMessage,
  ExtractFileRequest,
  ExtractFileResult,
  Fragment,
  Location,
  Placeholder,
} from './type';

import * as ts from 'typescript';

import { resolveCallSiteContext } from './call-site-context';
import { discoverCalls } from './discover-calls';
import { toMessageId } from './id';
import { parseArguments } from './parse-arguments';
import { parsePlaceholders } from './plural';
import { remapRange } from './position';
import { getProcessor, resolveFramework } from './processor';
import { resolveBindings } from './resolve-bindings';

export function extractFile(request: ExtractFileRequest): ExtractFileResult {
  const framework = request.framework ?? resolveFramework(request.fileId);
  const processor = getProcessor(framework);
  const fragments = processor.parseFragments(request.source);

  const diagnostics: Diagnostic[] = [];
  const callSites: CallSite[] = [];
  const messagesById = new Map<string, ExtractedMessage>();

  for (const fragment of fragments) {
    const sourceFile = createFragmentSourceFile(request.fileId, fragment);
    const bindings = resolveBindings(sourceFile);
    const fragmentCalls = discoverCalls(sourceFile, bindings);

    for (const fragmentCall of fragmentCalls) {
      const parsed = parseArguments(fragmentCall);
      for (const diagnostic of parsed.diagnostics) {
        diagnostics.push(remapDiagnostic(diagnostic, fragment, request.source));
      }

      const callSite: CallSite = {
        binding: fragmentCall.binding,
        node: fragmentCall.node,
        range: remapRange(fragmentCall.range, fragment, request.source),
      };
      callSites.push(callSite);

      if (parsed.source === '') continue;

      const placeholderInfos = parsePlaceholders(parsed.source);
      const placeholders = placeholderInfos.map(toPublicPlaceholder);
      const id = toMessageId(parsed.source);

      const location: Location = {
        callSiteContext: resolveCallSiteContext(fragmentCall.node, sourceFile),
        fileId: request.fileId,
        range: remapRange(parsed.sourceRange, fragment, request.source),
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
  }

  return {
    callSites,
    diagnostics,
    messages: Array.from(messagesById.values()),
  };
}

function createFragmentSourceFile(
  fileId: string,
  fragment: Fragment,
): ts.SourceFile {
  return ts.createSourceFile(
    fileId,
    fragment.code,
    ts.ScriptTarget.ESNext,
    true,
    getScriptKind(fileId, fragment.lang),
  );
}

function getScriptKind(fileId: string, lang: Fragment['lang']): ts.ScriptKind {
  if (fileId.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (fileId.endsWith('.jsx')) return ts.ScriptKind.JSX;
  if (lang === 'js') return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function toPublicPlaceholder(info: PlaceholderInfo): Placeholder {
  const result: Placeholder = { kind: info.kind, name: info.name };
  if (info.variants !== undefined) {
    result.variants = info.variants;
  }
  return result;
}

function remapDiagnostic(
  diagnostic: Diagnostic,
  fragment: Fragment,
  originalSource: string,
): Diagnostic {
  if (fragment.originalOffset === 0) return diagnostic;
  return {
    ...diagnostic,
    range: remapRange(diagnostic.range, fragment, originalSource),
    source: originalSource,
  };
}

import type { PlaceholderInfo } from './plural';
import type {
  Binding,
  CallSite,
  Diagnostic,
  ElisionContext,
  ExtractedMessage,
  ExtractFileRequest,
  ExtractFileResult,
  Fragment,
  Location,
  Placeholder,
  Scope,
} from './type';

import * as ts from 'typescript';

import { resolveCallSiteContext } from './call-site-context';
import { discoverCalls } from './discover-calls';
import { toMessageId } from './id';
import { parseArguments } from './parse-arguments';
import { parsePlaceholders } from './plural';
import { remapRange, toRange } from './position';
import { getProcessor, resolveProcessorKind } from './processor';
import { resolveBindings } from './resolve-bindings';
import { getScriptKind } from './script-kind';

export function extractFile(request: ExtractFileRequest): ExtractFileResult {
  const processorKind =
    request.processor ?? resolveProcessorKind(request.fileId);
  const processor = getProcessor(processorKind);
  const fragments = processor.parseFragments(request.source);

  const diagnostics: Diagnostic[] = [];
  const callSites: CallSite[] = [];
  const messagesById = new Map<string, ExtractedMessage>();

  const ambientBindings = new Map<string, Binding>();
  let ambientAnchor: ts.SourceFile | undefined;

  for (const fragment of fragments) {
    if (fragment.kind !== 'script') {
      continue;
    }
    const sourceFile = createFragmentSourceFile(request.fileId, fragment);
    if (!ambientAnchor) {
      ambientAnchor = sourceFile;
    }
    const bindings = resolveBindings(sourceFile);
    for (const [name, binding] of bindings.root.bindings) {
      ambientBindings.set(name, binding);
    }
    processFragment({
      bindings,
      callSites,
      diagnostics,
      fragment,
      messagesById,
      originalSource: request.source,
      request,
      sourceFile,
    });
  }

  const ambientParent =
    ambientBindings.size > 0 && ambientAnchor
      ? buildAmbientScope(ambientBindings, ambientAnchor)
      : undefined;

  for (const fragment of fragments) {
    if (fragment.kind === 'script') {
      continue;
    }
    const sourceFile = createFragmentSourceFile(request.fileId, fragment);
    const bindings = resolveBindings(sourceFile, { ambientParent });
    processFragment({
      bindings,
      callSites,
      diagnostics,
      fragment,
      messagesById,
      originalSource: request.source,
      request,
      sourceFile,
    });
  }

  return {
    callSites,
    diagnostics,
    messages: Array.from(messagesById.values()),
  };
}

interface ProcessFragmentInput {
  bindings: ReturnType<typeof resolveBindings>;
  callSites: CallSite[];
  diagnostics: Diagnostic[];
  fragment: Fragment;
  messagesById: Map<string, ExtractedMessage>;
  originalSource: string;
  request: ExtractFileRequest;
  sourceFile: ts.SourceFile;
}

function processFragment(input: ProcessFragmentInput): void {
  const {
    bindings,
    callSites,
    diagnostics,
    fragment,
    messagesById,
    originalSource,
    request,
    sourceFile,
  } = input;
  const fragmentCalls = discoverCalls(sourceFile, bindings);

  for (const fragmentCall of fragmentCalls) {
    const parsed = parseArguments(fragmentCall);
    for (const diagnostic of parsed.diagnostics) {
      diagnostics.push(remapDiagnostic(diagnostic, fragment, originalSource));
    }

    const callSite: CallSite = {
      binding: fragmentCall.binding,
      node: fragmentCall.node,
      range: remapRange(fragmentCall.range, fragment, originalSource),
    };
    const elision =
      fragment.elision ??
      detectJsxElision(fragmentCall.node, sourceFile, fragment, originalSource);
    if (elision) {
      callSite.elision = elision;
    }
    callSites.push(callSite);

    if (parsed.source === '') {
      continue;
    }

    const placeholderInfos = parsePlaceholders(parsed.source);
    const placeholders = placeholderInfos.map(toPublicPlaceholder);
    const id = toMessageId(parsed.source);

    const location: Location = {
      callSiteContext: resolveCallSiteContext(fragmentCall.node, sourceFile),
      fileId: request.fileId,
      range: remapRange(parsed.sourceRange, fragment, originalSource),
    };

    const existing = messagesById.get(id);
    if (existing) {
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

function buildAmbientScope(
  ambientBindings: Map<string, Binding>,
  anchor: ts.Node,
): Scope {
  return {
    bindings: ambientBindings,
    node: anchor,
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

function toPublicPlaceholder(info: PlaceholderInfo): Placeholder {
  const result: Placeholder = { kind: info.kind, name: info.name };
  if (info.variants) {
    result.variants = info.variants;
  }
  return result;
}

function detectJsxElision(
  node: ts.CallExpression,
  sourceFile: ts.SourceFile,
  fragment: Fragment,
  originalSource: string,
): ElisionContext | undefined {
  const parent = node.parent;
  if (!parent || !ts.isJsxExpression(parent)) {
    return undefined;
  }
  const grandparent = parent.parent;
  if (!grandparent) {
    return undefined;
  }
  if (ts.isJsxElement(grandparent) || ts.isJsxFragment(grandparent)) {
    return {
      mode: 'text',
      range: remapRange(toRange(parent, sourceFile), fragment, originalSource),
    };
  }
  if (ts.isJsxAttribute(grandparent) && ts.isIdentifier(grandparent.name)) {
    return {
      attrName: grandparent.name.text,
      mode: 'attribute',
      range: remapRange(
        toRange(grandparent, sourceFile),
        fragment,
        originalSource,
      ),
    };
  }
  return undefined;
}

function remapDiagnostic(
  diagnostic: Diagnostic,
  fragment: Fragment,
  originalSource: string,
): Diagnostic {
  if (fragment.originalOffset === 0) {
    return diagnostic;
  }
  return {
    ...diagnostic,
    range: remapRange(diagnostic.range, fragment, originalSource),
    source: originalSource,
  };
}

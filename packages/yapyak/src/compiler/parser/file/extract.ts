import type { Processor } from '../../../processor';
import type { Binding, Scope } from '../binding';
import type { CallSite } from '../call';
import type { CallSiteContext } from '../call-site-context';
import type { Diagnostic } from '../diagnostic';
import type { ElisionContext, Fragment } from '../fragment';
import type { Placeholder } from '../placeholder';
import type { Range } from '../range';

import * as ts from 'typescript';

import { parseArguments } from '../argument';
import { resolveBindings } from '../binding';
import { discoverCalls } from '../call';
import { resolveCallSiteContext } from '../call-site-context';
import { toMessageId } from '../message-id';
import { parsePlaceholders } from '../placeholder';
import { dispatchProcessor } from '../processor';
import { remapRange, toRange } from '../range';
import { getScriptKind } from '../script-kind';

export interface Location {
  callSiteContext: CallSiteContext;
  context?: string;
  fileId: string;
  range: Range;
}

export interface ExtractedMessage {
  context?: string;
  id: string;
  locations: Location[];
  placeholders: Placeholder[];
  source: string;
}

export interface ExtractFileRequest {
  fileId: string;
  locales: string[];
  processors?: Processor[];
  source: string;
}

export interface ExtractFileResult {
  callSites: CallSite[];
  diagnostics: Diagnostic[];
  messages: ExtractedMessage[];
}

export function extractFile(request: ExtractFileRequest): ExtractFileResult {
  const processor = dispatchProcessor(
    request.fileId,
    request.source,
    request.processors ?? [],
  );
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
    extractFromFragment({
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
    extractFromFragment({
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

interface ExtractFromFragmentInput {
  bindings: ReturnType<typeof resolveBindings>;
  callSites: CallSite[];
  diagnostics: Diagnostic[];
  fragment: Fragment;
  messagesById: Map<string, ExtractedMessage>;
  originalSource: string;
  request: ExtractFileRequest;
  sourceFile: ts.SourceFile;
}

function extractFromFragment(input: ExtractFromFragmentInput): void {
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
  const { callSites: fragmentCalls, diagnostics: fragmentDiagnostics } =
    discoverCalls(sourceFile, bindings);
  for (const diagnostic of fragmentDiagnostics) {
    diagnostics.push(remapDiagnostic(diagnostic, fragment, originalSource));
  }

  for (const fragmentCall of fragmentCalls) {
    const parsed = parseArguments(fragmentCall);
    for (const diagnostic of parsed.diagnostics) {
      diagnostics.push(remapDiagnostic(diagnostic, fragment, originalSource));
    }

    const callSite: CallSite = {
      binding: fragmentCall.binding,
      node: fragmentCall.node,
      range: remapRange(fragmentCall.range, fragment, originalSource),
      sourceArg: fragmentCall.sourceArg,
    };
    if (fragmentCall.contextArg) {
      callSite.contextArg = fragmentCall.contextArg;
    }
    if (fragmentCall.localeExpression) {
      callSite.localeExpression = fragmentCall.localeExpression;
    }
    if (fragmentCall.paramsArg) {
      callSite.paramsArg = fragmentCall.paramsArg;
    }
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

    const { placeholders } = parsePlaceholders(parsed.source);
    const id = toMessageId(parsed.source, parsed.context);

    const location: Location = {
      callSiteContext: resolveCallSiteContext(fragmentCall.node, sourceFile),
      fileId: request.fileId,
      range: remapRange(parsed.sourceRange, fragment, originalSource),
    };
    if (parsed.context !== undefined) {
      location.context = parsed.context;
    }

    const existing = messagesById.get(id);
    if (existing) {
      existing.locations.push(location);
      continue;
    }

    const message: ExtractedMessage = {
      id,
      locations: [location],
      placeholders,
      source: parsed.source,
    };
    if (parsed.context !== undefined) {
      message.context = parsed.context;
    }
    messagesById.set(id, message);
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
      attributeName: grandparent.name.text,
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

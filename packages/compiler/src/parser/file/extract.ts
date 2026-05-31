import type { Binding, Scope } from '../binding';
import type { CallSite } from '../call';
import type { CallSiteContext } from '../call-site-context';
import type { Diagnostic } from '../diagnostic';
import type { ElisionContext, Fragment } from '../fragment';
import type { Placeholder } from '../placeholder';
import type { ProcessorKind } from '../processor/kind';
import type { Range } from '../range';

import * as ts from 'typescript';

import { parseArguments } from '../argument';
import { resolveBindings } from '../binding';
import { discoverCalls } from '../call';
import { resolveCallSiteContext } from '../call-site-context';
import {
  detectOrphanChainables,
  getOuterChainableCall,
  parseChainables,
} from '../chainable';
import { toMessageId } from '../message-id';
import { parsePlaceholders } from '../placeholder';
import { getProcessor, resolveProcessorKind } from '../processor';
import { remapRange, toRange } from '../range';
import { getScriptKind } from '../script-kind';

export interface Location {
  callSiteContext: CallSiteContext;
  fileId: string;
  hint?: string;
  maxLength?: number;
  range: Range;
  tag?: string;
}

export interface ExtractedMessage {
  id: string;
  locations: Location[];
  placeholders: Placeholder[];
  source: string;
}

export interface ExtractFileRequest {
  fileId: string;
  locales: readonly string[];
  processor?: ProcessorKind;
  source: string;
}

export interface ExtractFileResult {
  callSites: CallSite[];
  diagnostics: Diagnostic[];
  messages: ExtractedMessage[];
}

export function extractFile(request: ExtractFileRequest): ExtractFileResult {
  const processorKind =
    request.processor ?? resolveProcessorKind(request.fileId, request.source);
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
  const validTCalls = new Set(fragmentCalls.map((call) => call.node));
  for (const diagnostic of detectOrphanChainables(sourceFile, validTCalls)) {
    diagnostics.push(remapDiagnostic(diagnostic, fragment, originalSource));
  }

  for (const fragmentCall of fragmentCalls) {
    const parsed = parseArguments(fragmentCall);
    for (const diagnostic of parsed.diagnostics) {
      diagnostics.push(remapDiagnostic(diagnostic, fragment, originalSource));
    }
    const chainables = parseChainables(fragmentCall);
    for (const diagnostic of chainables.diagnostics) {
      diagnostics.push(remapDiagnostic(diagnostic, fragment, originalSource));
    }

    const outerCall = getOuterChainableCall(fragmentCall.node);
    const outerRangeInFragment =
      outerCall === fragmentCall.node
        ? fragmentCall.range
        : toRange(outerCall, sourceFile);

    const callSite: CallSite = {
      binding: fragmentCall.binding,
      node: fragmentCall.node,
      range: remapRange(outerRangeInFragment, fragment, originalSource),
    };
    if (fragmentCall.localeExpression) {
      callSite.localeExpression = fragmentCall.localeExpression;
    }
    const elision =
      fragment.elision ??
      detectJsxElision(outerCall, sourceFile, fragment, originalSource);
    if (elision) {
      callSite.elision = elision;
    }
    callSites.push(callSite);

    if (parsed.source === '') {
      continue;
    }

    const { placeholders } = parsePlaceholders(parsed.source);
    const id = toMessageId(parsed.source);

    const location: Location = {
      callSiteContext: resolveCallSiteContext(fragmentCall.node, sourceFile),
      fileId: request.fileId,
      range: remapRange(parsed.sourceRange, fragment, originalSource),
    };
    if (chainables.hint !== undefined) {
      location.hint = chainables.hint;
    }
    if (chainables.maxLength !== undefined) {
      location.maxLength = chainables.maxLength;
    }
    if (chainables.tag !== undefined) {
      location.tag = chainables.tag;
    }

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

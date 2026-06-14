import type {
  ElisionContext,
  Fragment,
  ParseFragmentsFn,
  Processor,
  Range,
} from '../../../processor';
import type { Binding, Scope } from '../binding';
import type { CallSite } from '../call';
import type { CallSiteContext } from '../call-site-context';
import type { Diagnostic } from '../diagnostic';
import type { Placeholder } from '../placeholder';

import ts from 'typescript';

import { parseArguments } from '../argument';
import { resolveBindings } from '../binding';
import { discoverCalls } from '../call';
import { resolveCallSiteContext } from '../call-site-context';
import { toMessageKey } from '../message-key';
import { parsePlaceholders } from '../placeholder';
import { resolveProcessor } from '../processor';
import { remapRange, toRange } from '../range';
import { getScriptKind } from '../script-kind';

const DEFAULT_PARSE_FRAGMENTS: ParseFragmentsFn = (source) => [
  {
    code: source,
    kind: 'script',
    lang: 'ts',
    originalOffset: 0,
  },
];

export type Location = {
  callSiteContext: CallSiteContext;
  context?: string;
  fileId: string;
  range: Range;
};

export type ExtractedMessage = {
  context?: string;
  id: string;
  locations: Location[];
  placeholders: Placeholder[];
  source: string;
};

export type ExtractFileOptions = {
  processors?: Processor[];
};

export type ParsedCallSite = CallSite & {
  context?: string;
  fragmentOffset: number;
  id: string;
  placeholders: Placeholder[];
  source: string;
};

export type ExtractFileResult = {
  callSites: ParsedCallSite[];
  diagnostics: Diagnostic[];
  messages: ExtractedMessage[];
};

export function extractFile(
  fileId: string,
  source: string,
  options?: ExtractFileOptions,
): ExtractFileResult {
  const processor = resolveProcessor(fileId, source, options?.processors ?? []);
  const fragments = (processor.parseFragments ?? DEFAULT_PARSE_FRAGMENTS)(
    source,
  );

  const diagnostics: Diagnostic[] = [];
  const callSites: ParsedCallSite[] = [];
  const messagesById = new Map<string, ExtractedMessage>();

  const ambientBindings = new Map<string, Binding>();
  let ambientAnchor: ts.SourceFile | undefined;

  for (const fragment of fragments) {
    if (fragment.kind !== 'script') {
      continue;
    }
    const sourceFile = createFragmentSourceFile(fileId, fragment);
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
      fileId,
      fragment,
      messagesById,
      originalSource: source,
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
    const sourceFile = createFragmentSourceFile(fileId, fragment);
    const bindings = resolveBindings(sourceFile, {
      ambientParent,
    });
    extractFromFragment({
      bindings,
      callSites,
      diagnostics,
      fileId,
      fragment,
      messagesById,
      originalSource: source,
      sourceFile,
    });
  }

  return {
    callSites,
    diagnostics,
    messages: Array.from(messagesById.values()),
  };
}

type ExtractFromFragmentInput = {
  bindings: ReturnType<typeof resolveBindings>;
  callSites: ParsedCallSite[];
  diagnostics: Diagnostic[];
  fileId: string;
  fragment: Fragment;
  messagesById: Map<string, ExtractedMessage>;
  originalSource: string;
  sourceFile: ts.SourceFile;
};

function extractFromFragment(input: ExtractFromFragmentInput): void {
  const {
    bindings,
    callSites,
    diagnostics,
    fileId,
    fragment,
    messagesById,
    originalSource,
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

    const { placeholders } = parsePlaceholders(parsed.source);
    const id =
      parsed.source === '' ? '' : toMessageKey(parsed.source, parsed.context);

    const callSite: ParsedCallSite = {
      binding: fragmentCall.binding,
      fragmentOffset: fragment.originalOffset,
      id,
      node: fragmentCall.node,
      placeholders,
      range: remapRange(fragmentCall.range, fragment, originalSource),
      source: parsed.source,
      sourceExpression: fragmentCall.sourceExpression,
    };
    if (parsed.context !== undefined) {
      callSite.context = parsed.context;
    }
    if (fragmentCall.contextExpression) {
      callSite.contextExpression = fragmentCall.contextExpression;
    }
    if (fragmentCall.localeExpression) {
      callSite.localeExpression = fragmentCall.localeExpression;
    }
    if (fragmentCall.paramsExpression) {
      callSite.paramsExpression = fragmentCall.paramsExpression;
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

    const location: Location = {
      callSiteContext: resolveCallSiteContext(fragmentCall.node, sourceFile),
      fileId,
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
      locations: [
        location,
      ],
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

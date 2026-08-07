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

import ts from '@typescript/typescript6';

import { segmentsFromOffset } from '../../../processor';
import { parseArguments } from '../argument';
import { resolveBindings } from '../binding';
import { discoverCalls } from '../call';
import { resolveCallSiteContext } from '../call-site-context';
import { toMessageKey } from '../message-key';
import { parsePlaceholders } from '../placeholder';
import { resolveProcessor } from '../processor';
import { remapRange, toRange } from '../range';
import { getScriptKind } from '../script-kind';
import { basename, extname } from 'node:path';

const DEFAULT_PARSE_FRAGMENTS: ParseFragmentsFn = (source) => [
  {
    code: source,
    language: 'ts',
    segments: segmentsFromOffset(source, 0),
    type: 'script',
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
  fragment: Fragment;
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
    if (fragment.type !== 'script') {
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
    if (fragment.type === 'script') {
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

    const source = parsed.source.normalize();
    const context = parsed.context?.normalize();
    const { placeholders } = parsePlaceholders(source);
    const id = source === '' ? '' : toMessageKey(source, context);

    const callSite: ParsedCallSite = {
      binding: fragmentCall.binding,
      fragment,
      id,
      node: fragmentCall.node,
      placeholders,
      range: remapRange(fragmentCall.range, fragment, originalSource),
      source,
      sourceExpression: fragmentCall.sourceExpression,
    };
    if (context !== undefined) {
      callSite.context = context;
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
    const elisionContext =
      fragment.elisionContext ??
      detectJsxElision(fragmentCall.node, sourceFile, fragment, originalSource);
    if (elisionContext) {
      callSite.elisionContext = elisionContext;
    }
    callSites.push(callSite);

    if (source === '') {
      continue;
    }

    const location: Location = {
      callSiteContext: mergeCallSiteContext(
        resolveCallSiteContext(fragmentCall.node, sourceFile),
        fragment,
        fileId,
      ),
      fileId,
      range: remapRange(parsed.sourceRange, fragment, originalSource),
    };
    if (context !== undefined) {
      location.context = context;
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
      source,
    };
    if (context !== undefined) {
      message.context = context;
    }
    messagesById.set(id, message);
  }
}

function mergeCallSiteContext(
  context: CallSiteContext,
  fragment: Fragment,
  fileId: string,
): CallSiteContext {
  const result: CallSiteContext = {};
  const enclosingComponent =
    context.enclosingComponent ??
    (fragment.type === 'template-expression'
      ? componentNameFromFileId(fileId)
      : undefined);
  if (enclosingComponent !== undefined) {
    result.enclosingComponent = enclosingComponent;
  }
  const enclosingElement =
    context.enclosingElement ?? fragment.enclosingElement;
  if (enclosingElement !== undefined) {
    result.enclosingElement = enclosingElement;
  }
  const snippet = context.snippet ?? fragment.snippet;
  if (snippet !== undefined) {
    result.snippet = snippet;
  }
  return result;
}

const SEPARATOR_RX = /[-_]/;

function componentNameFromFileId(fileId: string): string | undefined {
  const stem = basename(fileId, extname(fileId));
  const name = stem
    .split(SEPARATOR_RX)
    .filter((segment) => segment !== '')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
  return name === '' ? undefined : name;
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
    getScriptKind(fileId, fragment.language),
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
  return {
    ...diagnostic,
    range: remapRange(diagnostic.range, fragment, originalSource),
  };
}

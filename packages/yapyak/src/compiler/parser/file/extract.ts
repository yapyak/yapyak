import type { CallExpression, Node } from 'oxc-parser';
import type {
  ElisionContext,
  Fragment,
  ParseSourceFn,
  Processor,
  Range,
} from '../../../processor';
import type { Placeholder } from '../../placeholder';
import type { ParsedParams } from '../argument';
import type { Binding, Scope } from '../binding';
import type { CallSiteContext } from '../call-site-context';
import type { Diagnostic } from '../diagnostic';
import type { SourceFile } from '../source-file';

import { YAP_COMPILE, buildDiagnostic } from '../../../diagnostic';
import { toMessageKey } from '../../../message-key';
import { segmentsFromOffset } from '../../../processor';
import { parsePlaceholders } from '../../placeholder';
import { parseArguments } from '../argument';
import { T_EXPORT, resolveBindings } from '../binding';
import { discoverCalls } from '../call';
import { resolveCallSiteContext } from '../call-site-context';
import { validateFragments } from '../fragment';
import { isFunctionLike } from '../function-like';
import { collectLineStarts } from '../position';
import { resolveProcessor } from '../processor';
import { remapRange, toRange } from '../range';
import { parseSourceFile } from '../source-file';
import { basename, extname } from 'node:path';

const DEFAULT_PARSE_SOURCE: ParseSourceFn = (source) => ({
  fragments: [
    {
      code: source,
      language: 'ts',
      scope: 'module',
      segments: segmentsFromOffset(source, 0),
      type: 'script',
    },
  ],
});

const FRAGMENT_START = {
  end: 0,
  start: 0,
};

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

export type ParsedCallSite = {
  binding: Binding;
  context?: string;
  elisionContext?: ElisionContext;
  id: string;
  localeRange?: Range;
  params?: ParsedParams;
  placeholders: Placeholder[];
  range: Range;
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
  const { diagnostics: parserDiagnostics, fragments } = (
    processor.parseSource ?? DEFAULT_PARSE_SOURCE
  )(source);
  validateFragments({
    fileId,
    fragments,
    processorId: processor.id,
    source,
  });

  const diagnostics: Diagnostic[] = [];
  if (parserDiagnostics) {
    for (const parserDiagnostic of parserDiagnostics) {
      diagnostics.push(
        buildDiagnostic(
          'PROCESSOR_PARSE_ERROR',
          {
            text: parserDiagnostic.message,
          },
          {
            fileId,
            range: parserDiagnostic.range,
            severity: 'error',
          },
        ),
      );
    }
  }
  const callSites: ParsedCallSite[] = [];
  const messagesById = new Map<string, ExtractedMessage>();
  const originalLineStarts = collectLineStarts(source);

  const processorAmbient = buildProcessorAmbient(processor);
  const ambientBindings = new Map<string, Binding>();

  for (const fragment of fragments) {
    if (fragment.type !== 'script') {
      continue;
    }
    const sourceFile = parseSourceFile(fileId, fragment);
    if (sourceFile.fatalError) {
      const [label] = sourceFile.fatalError.labels;
      diagnostics.push(
        buildDiagnostic(
          'PROCESSOR_PARSE_ERROR',
          {
            text: sourceFile.fatalError.message,
          },
          {
            fileId,
            range: remapRange(
              toRange(label ?? FRAGMENT_START, sourceFile),
              fragment,
              originalLineStarts,
            ),
            severity: 'error',
          },
        ),
      );
      continue;
    }
    const bindings = resolveBindings(sourceFile, T_EXPORT, {
      ambientParent: processorAmbient,
    });
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
      originalLineStarts,
      sourceFile,
    });
  }

  const ambientParent =
    ambientBindings.size === 0
      ? processorAmbient
      : buildAmbientScope(ambientBindings, processorAmbient);

  for (const fragment of fragments) {
    if (fragment.type === 'script') {
      continue;
    }
    const sourceFile = parseSourceFile(fileId, fragment);
    if (sourceFile.fatalError) {
      continue;
    }
    const bindings = resolveBindings(sourceFile, T_EXPORT, {
      ambientParent,
    });
    extractFromFragment({
      bindings,
      callSites,
      diagnostics,
      fileId,
      fragment,
      messagesById,
      originalLineStarts,
      sourceFile,
    });
  }

  return {
    callSites,
    diagnostics,
    messages: Array.from(messagesById.values()),
  };
}

export function hasParseFailure(
  result: Pick<ExtractFileResult, 'diagnostics'>,
): boolean {
  return result.diagnostics.some(
    (diagnostic) => diagnostic.code === YAP_COMPILE.PROCESSOR_PARSE_ERROR.code,
  );
}

type ExtractFromFragmentInput = {
  bindings: ReturnType<typeof resolveBindings>;
  callSites: ParsedCallSite[];
  diagnostics: Diagnostic[];
  fileId: string;
  fragment: Fragment;
  messagesById: Map<string, ExtractedMessage>;
  originalLineStarts: number[];
  sourceFile: SourceFile;
};

function extractFromFragment(input: ExtractFromFragmentInput): void {
  const {
    bindings,
    callSites,
    diagnostics,
    fileId,
    fragment,
    messagesById,
    originalLineStarts,
    sourceFile,
  } = input;
  const { callSites: fragmentCalls, diagnostics: fragmentDiagnostics } =
    discoverCalls(sourceFile, bindings);
  for (const diagnostic of fragmentDiagnostics) {
    diagnostics.push(remapDiagnostic(diagnostic, fragment, originalLineStarts));
  }

  for (const fragmentCall of fragmentCalls) {
    const parsed = parseArguments(fragmentCall, sourceFile);
    for (const diagnostic of parsed.diagnostics) {
      diagnostics.push(
        remapDiagnostic(diagnostic, fragment, originalLineStarts),
      );
    }

    const source = parsed.source.normalize();
    const context = parsed.context?.normalize();
    const { placeholders } = parsePlaceholders(source);
    const id = source === '' ? '' : toMessageKey(source, context);

    const callSite: ParsedCallSite = {
      binding: fragmentCall.binding,
      id,
      placeholders,
      range: remapRange(fragmentCall.range, fragment, originalLineStarts),
      source,
    };
    if (context !== undefined) {
      callSite.context = context;
    }
    if (fragmentCall.localeExpression) {
      callSite.localeRange = remapRange(
        toRange(fragmentCall.localeExpression, sourceFile),
        fragment,
        originalLineStarts,
      );
    }
    if (parsed.params) {
      callSite.params = remapParams(
        parsed.params,
        fragment,
        originalLineStarts,
      );
    }
    const elisionContext =
      (isWholeFragment(fragmentCall.node, fragment)
        ? fragment.elisionContext
        : undefined) ??
      detectJsxElision(
        fragmentCall.node,
        sourceFile,
        fragment,
        originalLineStarts,
      );
    if (elisionContext) {
      callSite.elisionContext = elisionContext;
    }
    callSites.push(callSite);

    if (fragment.scope === 'module' && isModuleScoped(fragmentCall.node)) {
      diagnostics.push(
        buildDiagnostic('PARSER_CALL_MODULE_SCOPED', undefined, {
          fileId,
          range: callSite.range,
          severity: 'warning',
        }),
      );
    }

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
      range: remapRange(parsed.sourceRange, fragment, originalLineStarts),
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

function remapParams(
  params: ParsedParams,
  fragment: Fragment,
  originalLineStarts: number[],
): ParsedParams {
  return {
    entries: params.entries.map((entry) => ({
      key: entry.key,
      valueRange: remapRange(entry.valueRange, fragment, originalLineStarts),
    })),
    kind: params.kind,
    range: remapRange(params.range, fragment, originalLineStarts),
  };
}

function isModuleScoped(node: Node): boolean {
  let current = node.parent;
  while (current) {
    if (isFunctionLike(current)) {
      return false;
    }
    current = current.parent;
  }
  return true;
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
  const enclosingAttribute =
    context.enclosingAttribute ?? fragment.enclosingAttribute;
  if (enclosingAttribute !== undefined) {
    result.enclosingAttribute = enclosingAttribute;
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
  parent?: Scope,
): Scope {
  return {
    bindings: ambientBindings,
    kind: 'module',
    ...(parent !== undefined && {
      parent,
    }),
  };
}

function buildProcessorAmbient(processor: Processor): Scope | undefined {
  const names = processor.ambientBindings;
  if (names === undefined || names.length === 0) {
    return undefined;
  }
  const bindings = new Map<string, Binding>();
  for (const name of names) {
    bindings.set(name, {
      kind: 'direct',
      localName: name,
    });
  }
  return {
    bindings,
    kind: 'module',
  };
}

const FRAGMENT_PREFIX_RX = /^[\s(]*$/;
const FRAGMENT_SUFFIX_RX = /^[\s)]*$/;

function isWholeFragment(node: Node, fragment: Fragment): boolean {
  return (
    FRAGMENT_PREFIX_RX.test(fragment.code.slice(0, node.start)) &&
    FRAGMENT_SUFFIX_RX.test(fragment.code.slice(node.end))
  );
}

function detectJsxElision(
  node: CallExpression,
  sourceFile: SourceFile,
  fragment: Fragment,
  originalLineStarts: number[],
): ElisionContext | undefined {
  const parent = node.parent;
  if (parent?.type !== 'JSXExpressionContainer') {
    return undefined;
  }
  const grandparent = parent.parent;
  if (!grandparent) {
    return undefined;
  }
  if (grandparent.type === 'JSXElement' || grandparent.type === 'JSXFragment') {
    return {
      mode: 'text',
      range: remapRange(
        toRange(parent, sourceFile),
        fragment,
        originalLineStarts,
      ),
    };
  }
  if (
    grandparent.type === 'JSXAttribute' &&
    grandparent.name.type === 'JSXIdentifier'
  ) {
    return {
      attributeName: grandparent.name.name,
      mode: 'attribute',
      range: remapRange(
        toRange(grandparent, sourceFile),
        fragment,
        originalLineStarts,
      ),
    };
  }
  return undefined;
}

function remapDiagnostic(
  diagnostic: Diagnostic,
  fragment: Fragment,
  originalLineStarts: number[],
): Diagnostic {
  return {
    ...diagnostic,
    range: remapRange(diagnostic.range, fragment, originalLineStarts),
  };
}

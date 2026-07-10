import type { SourceMap } from 'magic-string';
import type {
  ApplyImportFn,
  ParseFragmentsFn,
  Processor,
} from '../../../processor';
import type { Diagnostic } from '../diagnostic';
import type { ExtractFileResult, ParsedCallSite } from './extract';
import type {
  CallReplacement,
  NestedReplacement,
} from './transform/call-replacement';

import MagicString from 'magic-string';

import { YAPYAK_INTERNAL_MODULE } from '../binding';
import { resolveProcessor } from '../processor';
import { renderCallReplacement } from './transform/call-replacement';
import { injectComponentHooks } from './transform/component-hook';
import {
  buildContainmentTree,
  hasContainingParent,
} from './transform/containment-tree';
import { resolveDirectivePrologueEnd } from './transform/directive';
import { findFreeIdentifier, hasIdentifier } from './transform/identifier';
import { transformScriptImports } from './transform/script-import';

export type TransformFileRequest = {
  defaultLocale?: string;
  dev?: boolean;
  extracted: ExtractFileResult;
  fileId: string;
  locales: string[];
  processors?: Processor[];
  source: string;
  sourcePath?: string;
  translations: Record<string, Record<string, string>>;
};

export type TransformFileResult = {
  code: string;
  diagnostics: Diagnostic[];
  map: SourceMap;
};

const PICK_EXPORT = 'pick';
const PICK_LOCAL = '_pick';
const CATALOG_PREFIX = '_catalog';
const REGISTER_CATALOG_LOCAL = '_registerCatalog';
const INVALIDATE_FILE_LOCAL = '_invalidateFile';
const USE_YAPYAK_LOCAL = '_useYapyak';
const DEFAULT_APPLY_IMPORT: ApplyImportFn = (
  magicString,
  source,
  importStatement,
) => {
  const prologueEnd = resolveDirectivePrologueEnd(source);
  if (prologueEnd === 0) {
    magicString.prepend(`${importStatement}\n`);
    return;
  }
  magicString.appendRight(prologueEnd, `${importStatement}\n`);
};
const DEFAULT_PARSE_FRAGMENTS: ParseFragmentsFn = (source) => [
  {
    code: source,
    language: 'ts',
    originalOffset: 0,
    type: 'script',
  },
];
const FACTORY_ORDER = [
  'literal',
  'placeholder',
  'count',
  'plural',
  'select',
  'number',
  'date',
  'time',
] as const;

export function transformFile(
  request: TransformFileRequest,
): TransformFileResult {
  const defaultLocale = request.defaultLocale ?? request.locales[0];
  if (!defaultLocale) {
    return {
      code: request.source,
      diagnostics: [],
      map: new MagicString(request.source).generateMap({
        hires: true,
        source: request.sourcePath ?? request.fileId,
      }),
    };
  }
  const processor = resolveProcessor(
    request.fileId,
    request.source,
    request.processors ?? [],
  );
  const fragments = (processor.parseFragments ?? DEFAULT_PARSE_FRAGMENTS)(
    request.source,
  );
  const isSingleLocale = request.locales.length === 1;
  const isDev = request.dev === true;
  const runtime = processor.runtime;
  const componentHook = runtime?.componentHook;
  const magicString = new MagicString(request.source);

  const pickLocal = findFreePickLocal(request.source);
  const localsByFactory = findFreeFactoryLocals(request.source);
  const registerCatalogLocal = isDev
    ? findFreeIdentifier(request.source, REGISTER_CATALOG_LOCAL)
    : '';
  const invalidateFileLocal = isDev
    ? findFreeIdentifier(request.source, INVALIDATE_FILE_LOCAL)
    : '';
  const componentHookLocal = componentHook
    ? findFreeIdentifier(request.source, USE_YAPYAK_LOCAL)
    : '';
  const runtimeRegisterLocal = runtime?.register
    ? findFreeIdentifier(request.source, `_${runtime.register}`)
    : '';

  let hasUsedPick = false;
  const usedFactories = new Set<string>();
  const catalogsByKey = new Map<string, CatalogEntry>();
  let nextCatalogIndex = 0;
  const registerCatalog = (literal: string, id: string): string => {
    const key = isDev ? id : literal;
    const existing = catalogsByKey.get(key);
    if (existing) {
      return existing.identifier;
    }
    while (
      hasIdentifier(request.source, `${CATALOG_PREFIX}_$${nextCatalogIndex}`)
    ) {
      nextCatalogIndex += 1;
    }
    const identifier = `${CATALOG_PREFIX}_$${nextCatalogIndex}`;
    nextCatalogIndex += 1;
    catalogsByKey.set(key, {
      id,
      identifier,
      literal,
    });
    return identifier;
  };
  const callSites = request.extracted.callSites;
  const childrenByParent = buildContainmentTree(callSites);
  const replacementsByCallSite = new Map<ParsedCallSite, CallReplacement>();
  const renderInOrder = (callSite: ParsedCallSite): void => {
    for (const child of childrenByParent.get(callSite) ?? []) {
      renderInOrder(child);
    }
    const nestedReplacements: NestedReplacement[] = [];
    for (const child of childrenByParent.get(callSite) ?? []) {
      const childReplacement = replacementsByCallSite.get(child);
      if (!childReplacement) {
        continue;
      }
      const range = childReplacement.range ?? child.range;
      nestedReplacements.push({
        code: childReplacement.code,
        end: range.end.offset,
        start: range.start.offset,
      });
    }
    const replacement = renderCallReplacement({
      callSite,
      defaultLocale,
      locales: request.locales,
      localsByFactory,
      nestedReplacements,
      pickLocal,
      registerCatalog,
      singleLocale: isSingleLocale,
      translations: request.translations,
    });
    if (replacement) {
      replacementsByCallSite.set(callSite, replacement);
    }
  };
  const topLevelCallSites = callSites.filter(
    (callSite) => !hasContainingParent(callSite, callSites),
  );
  for (const callSite of topLevelCallSites) {
    renderInOrder(callSite);
  }
  for (const callSite of topLevelCallSites) {
    const replacement = replacementsByCallSite.get(callSite);
    if (!replacement) {
      continue;
    }
    const range = replacement.range ?? callSite.range;
    magicString.overwrite(
      range.start.offset,
      range.end.offset,
      replacement.code,
    );
  }
  for (const replacement of replacementsByCallSite.values()) {
    if (replacement.usesPick) {
      hasUsedPick = true;
    }
    for (const factory of replacement.usedFactories) {
      usedFactories.add(factory);
    }
  }

  transformScriptImports({
    fileId: request.fileId,
    fragments,
    magicString,
  });

  const importSpecs: string[] = [];
  if (hasUsedPick) {
    importSpecs.push(
      pickLocal === PICK_EXPORT
        ? PICK_EXPORT
        : `${PICK_EXPORT} as ${pickLocal}`,
    );
  }
  for (const factory of FACTORY_ORDER) {
    if (usedFactories.has(factory)) {
      const local = localsByFactory.get(factory) ?? `_${factory}`;
      importSpecs.push(`${factory} as ${local}`);
    }
  }
  const injectionLines: string[] = [];
  const skipHmrCallback = processor.skipHmrCallback === true;
  const allImportSpecs = importSpecs.slice();
  if (isDev) {
    allImportSpecs.push(`registerCatalog as ${registerCatalogLocal}`);
    if (!skipHmrCallback) {
      allImportSpecs.push(`invalidateFile as ${invalidateFileLocal}`);
    }
  }
  if (allImportSpecs.length > 0) {
    injectionLines.push(
      `import { ${allImportSpecs.join(', ')} } from '${YAPYAK_INTERNAL_MODULE}';`,
    );
  }
  if (runtime?.componentHook !== undefined) {
    injectionLines.push(
      `import { ${runtime.componentHook.invoke} as ${componentHookLocal} } from '${runtime.module}';`,
    );
  } else if (runtime?.register !== undefined && (isDev || hasUsedPick)) {
    injectionLines.push(
      `import { ${runtime.register} as ${runtimeRegisterLocal} } from '${runtime.module}';`,
      `${runtimeRegisterLocal}();`,
    );
  } else if (runtime !== undefined && isDev) {
    injectionLines.push(`import '${runtime.module}';`);
  }
  for (const entry of catalogsByKey.values()) {
    if (isDev) {
      injectionLines.push(
        `const ${entry.identifier} = ${registerCatalogLocal}(${JSON.stringify(request.fileId)}, ${JSON.stringify(entry.id)}, ${entry.literal});`,
      );
    } else {
      injectionLines.push(`const ${entry.identifier} = ${entry.literal};`);
    }
  }
  if (isDev && !skipHmrCallback) {
    injectionLines.push(
      `if (import.meta.hot) import.meta.hot.dispose(() => ${invalidateFileLocal}(${JSON.stringify(request.fileId)}));`,
    );
  }
  if (injectionLines.length > 0) {
    (processor.applyImport ?? DEFAULT_APPLY_IMPORT)(
      magicString,
      request.source,
      injectionLines.join('\n'),
    );
  }
  if (componentHook !== undefined) {
    injectComponentHooks({
      callSites,
      componentHook,
      fileId: request.fileId,
      fragments,
      invocation: componentHookLocal,
      magicString,
      source: request.source,
    });
  }

  return {
    code: magicString.toString(),
    diagnostics: request.extracted.diagnostics,
    map: magicString.generateMap({
      hires: true,
      source: request.sourcePath ?? request.fileId,
    }),
  };
}

type CatalogEntry = {
  id: string;
  identifier: string;
  literal: string;
};

function findFreePickLocal(source: string): string {
  return findFreeIdentifier(source, PICK_LOCAL);
}

function findFreeFactoryLocals(source: string): Map<string, string> {
  const locals = new Map<string, string>();
  for (const factory of FACTORY_ORDER) {
    locals.set(factory, findFreeIdentifier(source, `_${factory}`));
  }
  return locals;
}

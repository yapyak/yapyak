import type { Diagnostic } from '../parser/diagnostic';
import type { ExtractedMessage, Location } from '../parser/file/extract';

import { createDiagnostic } from '../parser/diagnostic';

export function detectHomonyms(
  messages: readonly ExtractedMessage[],
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const message of messages) {
    const locationsByFile = groupByFile(message.locations);
    for (const [fileId, locations] of locationsByFile) {
      if (locations.length < 2) {
        continue;
      }
      const tagged = locations.filter((loc) => loc.tag !== undefined);
      const untagged = locations.filter((loc) => loc.tag === undefined);

      if (untagged.length > 0) {
        diagnostics.push(
          buildUntaggedHomonymDiagnostic(fileId, message.source, untagged),
        );
        continue;
      }

      const grouped = new Map<string, Location[]>();
      for (const location of tagged) {
        // biome-ignore lint/style/noNonNullAssertion: location.tag is defined for every entry in tagged
        const tag = location.tag!;
        let list = grouped.get(tag);
        if (!list) {
          list = [];
          grouped.set(tag, list);
        }
        list.push(location);
      }
      for (const [tag, locationsForTag] of grouped) {
        diagnostics.push(
          ...findMetadataConflicts(
            fileId,
            message.source,
            tag,
            locationsForTag,
          ),
        );
      }
    }
  }
  return diagnostics;
}

function findMetadataConflicts(
  fileId: string,
  source: string,
  tag: string,
  locations: readonly Location[],
): Diagnostic[] {
  if (locations.length < 2) {
    return [];
  }
  const diagnostics: Diagnostic[] = [];
  const hints = new Set<string>();
  for (const location of locations) {
    if (location.hint !== undefined) {
      hints.add(location.hint);
    }
  }
  if (hints.size > 1) {
    diagnostics.push(
      buildConflictDiagnostic({
        chainable: 'hint',
        fileId,
        locations,
        source,
        tag,
        values: [...hints],
      }),
    );
  }
  const maxLengths = new Set<number>();
  for (const location of locations) {
    if (location.maxLength !== undefined) {
      maxLengths.add(location.maxLength);
    }
  }
  if (maxLengths.size > 1) {
    diagnostics.push(
      buildConflictDiagnostic({
        chainable: 'maxLength',
        fileId,
        locations,
        source,
        tag,
        values: [...maxLengths].map(String),
      }),
    );
  }
  return diagnostics;
}

function buildConflictDiagnostic(input: {
  chainable: 'hint' | 'maxLength';
  fileId: string;
  locations: readonly Location[];
  source: string;
  tag: string;
  values: readonly string[];
}): Diagnostic {
  const first = input.locations[0];
  // biome-ignore lint/style/noNonNullAssertion: locations is guaranteed non-empty by caller
  const range = first!.range;
  const formattedValues = input.values
    .map((value) =>
      input.chainable === 'hint' ? `\`'${value}'\`` : `\`${value}\``,
    )
    .join(', ');
  return createDiagnostic({
    code: 'YPK406',
    fileId: input.fileId,
    hint: `Align the \`.${input.chainable}()\` values, or separate the call sites with distinct \`.tag()\` values.`,
    message: `Conflicting \`.${input.chainable}()\` for "${input.source}".${input.tag} in ${input.fileId}: ${formattedValues}.`,
    range,
    severity: 'error',
    source: '',
  });
}

function groupByFile(locations: readonly Location[]): Map<string, Location[]> {
  const grouped = new Map<string, Location[]>();
  for (const location of locations) {
    let list = grouped.get(location.fileId);
    if (!list) {
      list = [];
      grouped.set(location.fileId, list);
    }
    list.push(location);
  }
  return grouped;
}

function buildUntaggedHomonymDiagnostic(
  fileId: string,
  source: string,
  untagged: readonly Location[],
): Diagnostic {
  const first = untagged[0];
  // biome-ignore lint/style/noNonNullAssertion: untagged is guaranteed non-empty by caller
  const range = first!.range;
  return createDiagnostic({
    code: 'YPK404',
    fileId,
    hint: "Disambiguate each occurrence with `.tag('name')` — every call with the same source must carry a distinct tag.",
    message: `Untagged homonym for "${source}" in ${fileId}: ${untagged.length} occurrence(s) without \`.tag()\`. Either all occurrences must be tagged with distinct tags, or there must be a single occurrence.`,
    range,
    severity: 'error',
    source: '',
  });
}

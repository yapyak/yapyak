import type { Diagnostic, ExtractedMessage, Location } from '../parser';

import { buildDiagnostic } from '../../diagnostic';
import { toLocationKey } from './location-key';

export function findContextDiagnostics(
  messages: ExtractedMessage[],
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const groups = new Map<string, ExtractedMessage[]>();
  for (const message of messages) {
    for (const location of message.locations) {
      const key = toLocationKey(location.fileId, message.source);
      let list = groups.get(key);
      if (!list) {
        list = [];
        groups.set(key, list);
      }
      if (!list.includes(message)) {
        list.push(message);
      }
    }
  }

  for (const messagesForSource of groups.values()) {
    const tagged = messagesForSource.filter(
      (message) => message.context !== undefined,
    );
    const untagged = messagesForSource.filter(
      (message) => message.context === undefined,
    );

    if (tagged.length > 0 && untagged.length > 0) {
      const allLocations: Location[] = [];
      for (const message of messagesForSource) {
        for (const location of message.locations) {
          allLocations.push(location);
        }
      }
      // biome-ignore lint/style/noNonNullAssertion: yap yap yap
      const first = messagesForSource[0]!;
      // biome-ignore lint/style/noNonNullAssertion: yap yap yap
      const firstLocation = first.locations[0]!;
      diagnostics.push(
        buildDiagnostic(
          'CONTEXT_MIXED_USAGE',
          {
            fileId: firstLocation.fileId,
            source: first.source,
          },
          {
            fileId: firstLocation.fileId,
            range: firstLocation.range,
            severity: 'error',
          },
        ),
      );
      continue;
    }

    if (tagged.length === 1) {
      // biome-ignore lint/style/noNonNullAssertion: yap yap yap
      const onlyMessage = tagged[0]!;
      // biome-ignore lint/style/noNonNullAssertion: yap yap yap
      const firstLocation = onlyMessage.locations[0]!;
      diagnostics.push(
        buildDiagnostic(
          'CONTEXT_UNUSED',
          {
            context: onlyMessage.context as string,
            fileId: firstLocation.fileId,
            source: onlyMessage.source,
          },
          {
            fileId: firstLocation.fileId,
            range: firstLocation.range,
            severity: 'warning',
          },
        ),
      );
    }
  }

  return diagnostics;
}

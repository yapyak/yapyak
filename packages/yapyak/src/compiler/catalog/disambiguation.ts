import type { Diagnostic } from '../parser/diagnostic';
import type { ExtractedMessage, Location } from '../parser/file/extract';

import { createDiagnostic } from '../parser/diagnostic';
import { toLocationKey } from './location-key';

export function detectAtIssues(messages: ExtractedMessage[]): Diagnostic[] {
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
    const tagged = messagesForSource.filter((m) => m.context !== undefined);
    const untagged = messagesForSource.filter((m) => m.context === undefined);

    if (tagged.length > 0 && untagged.length > 0) {
      const allLocations: Location[] = [];
      for (const message of messagesForSource) {
        for (const location of message.locations) {
          allLocations.push(location);
        }
      }
      // biome-ignore lint/style/noNonNullAssertion: messagesForSource is guaranteed non-empty
      const first = messagesForSource[0]!;
      // biome-ignore lint/style/noNonNullAssertion: locations of a message are guaranteed non-empty
      const firstLocation = first.locations[0]!;
      diagnostics.push(
        createDiagnostic({
          code: 'YPK403',
          fileId: firstLocation.fileId,
          hint: 'Either use `t.as(context, ...)` for every occurrence, or remove `t.as` from all of them.',
          message: `Source "${first.source}" is used with both \`t()\` and \`t.as()\` in ${firstLocation.fileId}. Choose one form for every occurrence.`,
          range: firstLocation.range,
          severity: 'error',
          source: '',
        }),
      );
      continue;
    }

    if (tagged.length === 1) {
      // biome-ignore lint/style/noNonNullAssertion: tagged.length === 1 guarantees this exists
      const onlyMessage = tagged[0]!;
      // biome-ignore lint/style/noNonNullAssertion: a message's locations array is non-empty
      const firstLocation = onlyMessage.locations[0]!;
      diagnostics.push(
        createDiagnostic({
          code: 'YPK404',
          fileId: firstLocation.fileId,
          hint: `Drop \`.as('${onlyMessage.context}', ...)\` — without another context for "${onlyMessage.source}", it has no effect.`,
          message: `\`t.as('${onlyMessage.context}', '${onlyMessage.source}')\` in ${firstLocation.fileId} has no other context to disambiguate from.`,
          range: firstLocation.range,
          severity: 'warning',
          source: '',
        }),
      );
    }
  }

  return diagnostics;
}

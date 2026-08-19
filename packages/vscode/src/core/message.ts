import type { ExtractedMessage } from 'yapyak/compiler/internal';

type MessageLocation = ExtractedMessage['locations'][number];

export type FoundMessage = {
  location: MessageLocation;
  message: ExtractedMessage;
};

export function findMessageAt(
  messages: ExtractedMessage[],
  offset: number,
): FoundMessage | undefined {
  for (const message of messages) {
    for (const location of message.locations) {
      if (
        offset >= location.range.start.offset &&
        offset <= location.range.end.offset
      ) {
        return {
          location,
          message,
        };
      }
    }
  }
  return undefined;
}

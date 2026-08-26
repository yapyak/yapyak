import { readSharedStorage } from './shared-storage';

export function writePendingResponseHeader(
  name: string,
  value: string,
): boolean {
  const responseHeaders = readSharedStorage()?.headers.getStore();
  if (responseHeaders === undefined) {
    return false;
  }
  responseHeaders.append(name, value);
  return true;
}

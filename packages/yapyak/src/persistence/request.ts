import { readSharedStorage } from './shared-storage';

export function readRequest(): Request | undefined {
  return readSharedStorage()?.requests.getStore();
}

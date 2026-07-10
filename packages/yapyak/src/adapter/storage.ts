import { setRequestReader, setResponseHeaderWriter } from '../locale';
import { AsyncLocalStorage } from 'node:async_hooks';

type Storage = {
  headers: AsyncLocalStorage<Headers>;
  requests: AsyncLocalStorage<Request>;
};

let storage: Storage | undefined;

export function createStorage(): Storage {
  if (storage) {
    return storage;
  }
  const requests = new AsyncLocalStorage<Request>();
  const headers = new AsyncLocalStorage<Headers>();
  storage = {
    headers,
    requests,
  };
  setRequestReader(() => requests.getStore());
  setResponseHeaderWriter((name, value) => {
    const responseHeaders = headers.getStore();
    if (responseHeaders === undefined) {
      return false;
    }
    responseHeaders.append(name, value);
    return true;
  });
  return storage;
}

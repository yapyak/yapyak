type RequestReader = () => Request | undefined;

let requestReader: RequestReader | undefined;

export function setRequestReader(reader: RequestReader): void {
  requestReader = reader;
}

export function resetRequestReader(): void {
  requestReader = undefined;
}

export function readRequest(): Request | undefined {
  return requestReader?.();
}

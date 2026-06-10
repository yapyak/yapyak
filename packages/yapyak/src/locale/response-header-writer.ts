type ResponseHeaderWriter = (name: string, value: string) => void;

let responseHeaderWriter: ResponseHeaderWriter | undefined;

export function setResponseHeaderWriter(writer: ResponseHeaderWriter): void {
  responseHeaderWriter = writer;
}

export function resetResponseHeaderWriter(): void {
  responseHeaderWriter = undefined;
}

export function appendResponseHeader(name: string, value: string): boolean {
  if (responseHeaderWriter === undefined) {
    return false;
  }
  responseHeaderWriter(name, value);
  return true;
}

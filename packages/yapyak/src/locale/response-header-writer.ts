type ResponseHeaderWriter = (name: string, value: string) => void;

let responseHeaderWriter: ResponseHeaderWriter | null = null;

export function setResponseHeaderWriter(
  writer: ResponseHeaderWriter | null,
): void {
  responseHeaderWriter = writer;
}

export function appendResponseHeader(name: string, value: string): boolean {
  if (responseHeaderWriter === null) {
    return false;
  }
  responseHeaderWriter(name, value);
  return true;
}

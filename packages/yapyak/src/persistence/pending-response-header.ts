type ResponseHeaderWriter = (name: string, value: string) => boolean;

let responseHeaderWriter: ResponseHeaderWriter | undefined;

export function setResponseHeaderWriter(writer: ResponseHeaderWriter): void {
  responseHeaderWriter = writer;
}

export function resetResponseHeaderWriter(): void {
  responseHeaderWriter = undefined;
}

export function writePendingResponseHeader(
  name: string,
  value: string,
): boolean {
  if (responseHeaderWriter === undefined) {
    return false;
  }
  return responseHeaderWriter(name, value);
}

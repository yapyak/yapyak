export interface RequestHeadersLike {
  get(name: string): string | null | undefined;
}

let _source: (() => RequestHeadersLike | undefined) | undefined;

export function setRequestSource(
  source: () => RequestHeadersLike | undefined,
): void {
  _source = source;
}

export function getRequestSource(): RequestHeadersLike | undefined {
  if (!_source) {
    return undefined;
  }
  try {
    return _source();
  } catch {
    return undefined;
  }
}

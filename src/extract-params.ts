type ExtractFromBraces<T extends string> =
  T extends `${string}{${infer Inner}}${infer Rest}`
    ?
        | (Inner extends `${infer Name},${string}` ? Name : Inner)
        | ExtractFromBraces<Rest>
    : never;

export type ExtractParams<T extends string> = {
  [K in ExtractFromBraces<T>]: string | number | Date;
};

export type MessageParams<T extends string> =
  ExtractParams<T> extends Record<string, never>
    ? []
    : [params: ExtractParams<T>];

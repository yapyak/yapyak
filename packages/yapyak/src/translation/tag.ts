type IsTagName<T extends string> = T extends ''
  ? false
  : T extends `${string}${'/' | ' ' | '=' | '<'}${string}`
    ? false
    : true;

export type ExtractTags<T extends string> =
  T extends `${string}<${infer Tag}>${infer Rest}`
    ? IsTagName<Tag> extends true
      ? Tag | ExtractTags<Rest>
      : ExtractTags<Rest>
    : never;

type IsTagName<T extends string> = T extends ''
  ? false
  : T extends `${string}${'/' | ' ' | '=' | '<'}${string}`
    ? false
    : true;

type TrimTrailingSpace<T extends string> = T extends `${infer S} `
  ? TrimTrailingSpace<S>
  : T;

export type ExtractPairTags<T extends string> =
  T extends `${string}<${infer Tag}>${infer Rest}`
    ? IsTagName<Tag> extends true
      ? Tag | ExtractPairTags<Rest>
      : ExtractPairTags<Rest>
    : never;

export type ExtractVoidTags<T extends string> =
  T extends `${string}<${infer Tag}>${infer Rest}`
    ? Tag extends `${infer Name}/`
      ? IsTagName<TrimTrailingSpace<Name>> extends true
        ? TrimTrailingSpace<Name> | ExtractVoidTags<Rest>
        : ExtractVoidTags<Rest>
      : ExtractVoidTags<Rest>
    : never;

type IsTagName<T extends string> = T extends ''
  ? false
  : T extends `${string}${'/' | ' ' | '=' | '<'}${string}`
    ? false
    : true;

type TrimTrailingSpace<T extends string> = T extends `${infer TBody} `
  ? TrimTrailingSpace<TBody>
  : T;

export type ExtractPairTags<T extends string> =
  T extends `${string}<${infer TTag}>${infer TRest}`
    ? IsTagName<TTag> extends true
      ? TTag | ExtractPairTags<TRest>
      : ExtractPairTags<TRest>
    : never;

export type ExtractVoidTags<T extends string> =
  T extends `${string}<${infer TTag}>${infer TRest}`
    ? TTag extends `${infer TName}/`
      ? IsTagName<TrimTrailingSpace<TName>> extends true
        ? TrimTrailingSpace<TName> | ExtractVoidTags<TRest>
        : ExtractVoidTags<TRest>
      : ExtractVoidTags<TRest>
    : never;

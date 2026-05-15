type Trim<Source extends string> = Source extends ` ${infer Rest}`
  ? Trim<Rest>
  : Source extends `${infer Rest} `
    ? Trim<Rest>
    : Source;

type SimpleParam<Placeholder extends string> =
  Trim<Placeholder> extends ''
    ? Record<string, never>
    : { [Key in Trim<Placeholder>]: string | number };

type IcuType<Format extends string> = Format extends
  | 'plural'
  | 'selectordinal'
  | 'number'
  ? number
  : Format extends 'select'
    ? string
    : Format extends `date${string}` | `time${string}`
      ? Date | number
      : unknown;

type ResolveIcuPattern<
  Source extends string,
  Accumulated,
> = Source extends `${string}{${infer Name}, ${infer Format},${string}}${infer Rest}`
  ? ExtractParams<Rest, Accumulated & { [Key in Trim<Name>]: IcuType<Format> }>
  : Source extends `${string}{${infer Name},${string}}${infer Rest}`
    ? ExtractParams<Rest, Accumulated & { [Key in Trim<Name>]: unknown }>
    : Accumulated extends unknown
      ? { [Key in keyof Accumulated]: Accumulated[Key] }
      : Accumulated;

export type ExtractParams<
  Source extends string,
  Accumulated = unknown,
> = Source extends `${string}{${infer Placeholder}}${infer Rest}`
  ? Placeholder extends `${string},${string}`
    ? ResolveIcuPattern<Source, Accumulated>
    : ExtractParams<Rest, Accumulated & SimpleParam<Placeholder>>
  : Accumulated extends unknown
    ? { [Key in keyof Accumulated]: Accumulated[Key] }
    : Accumulated;

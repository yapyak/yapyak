type Trim<Source extends string> = Source extends ` ${infer Rest}`
  ? Trim<Rest>
  : Source extends `${infer Rest} `
    ? Trim<Rest>
    : Source;

type SimpleParam<Placeholder extends string> =
  Trim<Placeholder> extends ''
    ? unknown
    : Placeholder extends `${string}{${string}`
      ? unknown
      : { [Key in Trim<Placeholder>]: string | number };

type IcuValueType<Format extends string> =
  Trim<Format> extends 'plural' | 'selectordinal' | 'number'
    ? number
    : Trim<Format> extends 'date' | 'time'
      ? Date | number
      : Trim<Format> extends 'select'
        ? string
        : string | number | Date;

type IcuParam<Name extends string, Format extends string = ''> = {
  [Key in Trim<Name>]: IcuValueType<Format>;
} & Record<string, unknown>;

type ResolveIcuPattern<
  Source extends string,
  Accumulated,
> = Source extends `${string}{${infer Name},${infer Format},${string}}}${infer Rest}`
  ? ExtractParams<Rest, Accumulated & IcuParam<Name, Format>>
  : Source extends `${string}{${infer Name},${infer Format},${string}}${infer Rest}`
    ? ExtractParams<Rest, Accumulated & IcuParam<Name, Format>>
    : Source extends `${string}{${infer Name},${string}}${infer Rest}`
      ? ExtractParams<Rest, Accumulated & IcuParam<Name>>
      : Accumulated;

export type ExtractParams<
  Source extends string,
  Accumulated = unknown,
> = Source extends `${string}{${infer Placeholder}}${infer Rest}`
  ? Placeholder extends `${string},${string}`
    ? ResolveIcuPattern<Source, Accumulated>
    : ExtractParams<Rest, Accumulated & SimpleParam<Placeholder>>
  : Accumulated;

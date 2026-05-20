type Trim<S extends string> = S extends ` ${infer Rest}`
  ? Trim<Rest>
  : S extends `${infer Rest} `
    ? Trim<Rest>
    : S;

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
  S extends string,
  Accumulated,
> = S extends `${string}{${infer Name},${infer Format},${string}}}${infer Rest}`
  ? ExtractParamDict<Rest, Accumulated & IcuParam<Name, Format>>
  : S extends `${string}{${infer Name},${infer Format},${string}}${infer Rest}`
    ? ExtractParamDict<Rest, Accumulated & IcuParam<Name, Format>>
    : S extends `${string}{${infer Name},${string}}${infer Rest}`
      ? ExtractParamDict<Rest, Accumulated & IcuParam<Name>>
      : Accumulated;

export type ExtractParamDict<
  S extends string,
  Accumulated = unknown,
> = S extends `${string}{${infer Placeholder}}${infer Rest}`
  ? Placeholder extends `${string},${string}`
    ? ResolveIcuPattern<S, Accumulated>
    : ExtractParamDict<Rest, Accumulated & SimpleParam<Placeholder>>
  : Accumulated;

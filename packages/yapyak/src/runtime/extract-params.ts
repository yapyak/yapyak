type Trim<T extends string> = T extends ` ${infer Rest}`
  ? Trim<Rest>
  : T extends `${infer Rest} `
    ? Trim<Rest>
    : T;

type SimpleParam<T extends string> =
  Trim<T> extends ''
    ? unknown
    : T extends `${string}{${string}`
      ? unknown
      : { [Key in Trim<T>]: string | number };

type IcuValueType<T extends string> =
  Trim<T> extends 'plural' | 'selectordinal' | 'number'
    ? number
    : Trim<T> extends 'date' | 'time'
      ? Date | number
      : Trim<T> extends 'select'
        ? string
        : string | number | Date;

type IcuParam<TName extends string, TFormat extends string = ''> = {
  [Key in Trim<TName>]: IcuValueType<TFormat>;
} & Record<string, unknown>;

type ResolveIcuPattern<
  TSource extends string,
  TAccumulator,
> = TSource extends `${string}{${infer Name},${infer Format},${string}}}${infer Rest}`
  ? ExtractParamDict<Rest, TAccumulator & IcuParam<Name, Format>>
  : TSource extends `${string}{${infer Name},${infer Format},${string}}${infer Rest}`
    ? ExtractParamDict<Rest, TAccumulator & IcuParam<Name, Format>>
    : TSource extends `${string}{${infer Name},${string}}${infer Rest}`
      ? ExtractParamDict<Rest, TAccumulator & IcuParam<Name>>
      : TAccumulator;

export type ExtractParamDict<
  TSource extends string,
  TAccumulator = unknown,
> = TSource extends `${string}{${infer Placeholder}}${infer Rest}`
  ? Placeholder extends `${string},${string}`
    ? ResolveIcuPattern<TSource, TAccumulator>
    : ExtractParamDict<Rest, TAccumulator & SimpleParam<Placeholder>>
  : TAccumulator;

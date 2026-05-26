type Trim<T extends string> = T extends ` ${infer Rest}`
  ? Trim<Rest>
  : T extends `${infer Rest} `
    ? Trim<Rest>
    : T;

type NonIdentifierChar =
  | ' '
  | '.'
  | ','
  | '!'
  | '?'
  | "'"
  | '"'
  | ':'
  | ';'
  | '-'
  | '/'
  | '\\'
  | '('
  | ')'
  | '['
  | ']';

type SimpleParam<T extends string> =
  Trim<T> extends ''
    ? unknown
    : T extends `${string}{${string}`
      ? unknown
      : Trim<T> extends `${string}${NonIdentifierChar}${string}`
        ? unknown
        : Trim<T> extends `#${string}`
          ? unknown
          : Trim<T> extends `${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}${string}`
            ? unknown
            : { [Key in Trim<T>]: string | number };

type ExtractSelectBranches<
  TBody extends string,
  TAccumulator extends string = never,
> =
  Trim<TBody> extends `${infer Key} {${string}}${infer Rest}`
    ? ExtractSelectBranches<Trim<Rest>, TAccumulator | Trim<Key>>
    : Trim<TBody> extends `${infer Key} {${string}`
      ? TAccumulator | Trim<Key>
      : TAccumulator;

type SelectValueType<TBody extends string> = [
  ExtractSelectBranches<TBody>,
] extends [never]
  ? string
  : 'other' extends ExtractSelectBranches<TBody>
    ? Exclude<ExtractSelectBranches<TBody>, 'other'> | (string & {})
    : ExtractSelectBranches<TBody>;

type IcuValueType<TFormat extends string, TBody extends string = ''> =
  Trim<TFormat> extends 'plural' | 'selectordinal' | 'number'
    ? number
    : Trim<TFormat> extends 'date' | 'time'
      ? Date | number
      : Trim<TFormat> extends 'select'
        ? SelectValueType<TBody>
        : string | number | Date;

type IcuParam<
  TName extends string,
  TFormat extends string = '',
  TBody extends string = '',
> = {
  [Key in Trim<TName>]: IcuValueType<TFormat, TBody>;
};

type ResolveIcuPattern<
  TSource extends string,
  TAccumulator,
> = TSource extends `${string}{${infer Name},${infer Format},${infer Body}}}${infer Rest}`
  ? ExtractTParams<
      Rest,
      TAccumulator & IcuParam<Name, Format, Body> & ExtractTParams<Body>
    >
  : TSource extends `${string}{${infer Name},${infer Format},${infer Body}}${infer Rest}`
    ? ExtractTParams<
        Rest,
        TAccumulator & IcuParam<Name, Format, Body> & ExtractTParams<Body>
      >
    : TSource extends `${string}{${infer Name},${string}}${infer Rest}`
      ? ExtractTParams<Rest, TAccumulator & IcuParam<Name>>
      : TAccumulator;

export type ExtractTParams<
  TSource extends string,
  TAccumulator = unknown,
> = TSource extends `${string}{${infer Placeholder}}${infer Rest}`
  ? Placeholder extends `${string},${string}`
    ? ResolveIcuPattern<TSource, TAccumulator>
    : Placeholder extends `${string}{${infer Tail}`
      ? ExtractTParams<`{${Tail}}${Rest}`, TAccumulator>
      : ExtractTParams<Rest, TAccumulator & SimpleParam<Placeholder>>
  : TAccumulator;

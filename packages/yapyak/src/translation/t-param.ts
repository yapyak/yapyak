export type Trim<T extends string> = T extends ` ${infer TRest}`
  ? Trim<TRest>
  : T extends `${infer TRest} `
    ? Trim<TRest>
    : T;

export type NonIdentifierChar =
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

export type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

type SimpleParam<T extends string> =
  Trim<T> extends ''
    ? never
    : T extends `${string}{${string}`
      ? never
      : Trim<T> extends `${string}${NonIdentifierChar}${string}`
        ? never
        : Trim<T> extends `#${string}`
          ? never
          : Trim<T> extends `${Digit}${string}`
            ? never
            : { [Key in Trim<T>]: string | number };

type ExtractSelectBranches<
  TBody extends string,
  TAccumulator extends string = never,
> =
  Trim<TBody> extends `${infer TKey} {${infer TAfterOpen}`
    ? BalancedSplit<TAfterOpen> extends [
        string,
        infer TRest extends string,
      ]
      ? ExtractSelectBranches<TRest, TAccumulator | Trim<TKey>>
      : TAccumulator | Trim<TKey>
    : TAccumulator;

type SelectValue<TBody extends string> = [
  ExtractSelectBranches<TBody>,
] extends [
  never,
]
  ? string
  : 'other' extends ExtractSelectBranches<TBody>
    ? Exclude<ExtractSelectBranches<TBody>, 'other'> | (string & {})
    : ExtractSelectBranches<TBody>;

type IcuValue<TFormat extends string, TBody extends string = ''> =
  Trim<TFormat> extends 'plural' | 'selectordinal' | 'number'
    ? number
    : Trim<TFormat> extends 'date' | 'time'
      ? Date | number
      : Trim<TFormat> extends 'select'
        ? SelectValue<TBody>
        : string | number | Date;

type IcuParam<
  TName extends string,
  TFormat extends string = '',
  TBody extends string = '',
> = {
  [Key in Trim<TName>]: IcuValue<TFormat, TBody>;
};

type ExtractBranchParams<TBody extends string, TAccumulator = unknown> =
  Trim<TBody> extends `${string} {${infer TAfterOpen}`
    ? BalancedSplit<TAfterOpen> extends [
        infer TBranchContent extends string,
        infer TRest extends string,
      ]
      ? ExtractBranchParams<
          TRest,
          TAccumulator & ExtractTParams<TBranchContent>
        >
      : TAccumulator
    : TAccumulator;

export type BalancedSplit<
  TSource extends string,
  TDepth extends unknown[] = [
    unknown,
  ],
  TAccumulator extends string = '',
  TGuard extends unknown[] = [],
> = TGuard['length'] extends 200
  ? [
      TAccumulator,
      TSource,
    ]
  : TSource extends `${infer TPre}{${infer TAfterOpen}`
    ? TPre extends `${string}}${string}`
      ? TSource extends `${infer TPreClose}}${infer TAfterClose}`
        ? TDepth extends [
            unknown,
            ...infer TDepthTail,
          ]
          ? TDepthTail extends []
            ? [
                `${TAccumulator}${TPreClose}`,
                TAfterClose,
              ]
            : BalancedSplit<
                TAfterClose,
                TDepthTail,
                `${TAccumulator}${TPreClose}}`,
                [
                  unknown,
                  ...TGuard,
                ]
              >
          : never
        : never
      : BalancedSplit<
          TAfterOpen,
          [
            unknown,
            ...TDepth,
          ],
          `${TAccumulator}${TPre}{`,
          [
            unknown,
            ...TGuard,
          ]
        >
    : TSource extends `${infer TPreClose}}${infer TAfterClose}`
      ? TDepth extends [
          unknown,
          ...infer TDepthTail,
        ]
        ? TDepthTail extends []
          ? [
              `${TAccumulator}${TPreClose}`,
              TAfterClose,
            ]
          : BalancedSplit<
              TAfterClose,
              TDepthTail,
              `${TAccumulator}${TPreClose}}`,
              [
                unknown,
                ...TGuard,
              ]
            >
        : never
      : never;

type ResolveIcuPattern<
  TSource extends string,
  TAccumulator,
> = TSource extends `${string}{${infer TInner}`
  ? BalancedSplit<TInner> extends [
      infer TBody extends string,
      infer TRest extends string,
    ]
    ? TBody extends `${infer TName},${infer TFormat},${infer TInnerBody}`
      ? ExtractTParams<
          TRest,
          TAccumulator &
            IcuParam<TName, TFormat, TInnerBody> &
            ExtractBranchParams<TInnerBody>
        >
      : TBody extends `${infer TName},${infer TFormat}`
        ? ExtractTParams<TRest, TAccumulator & IcuParam<TName, TFormat>>
        : TAccumulator
    : TAccumulator
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

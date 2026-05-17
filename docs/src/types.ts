import type { CSSProperties, Ref } from 'react';

export type Falsy = 0 | '' | false | null | undefined;

export type ClassName = ClassName[] | Falsy | string;

export type Composable<T> = Composable<T>[] | T | undefined;

export type ComposableRef<T> = Composable<Ref<T>>;

export type Props = Record<string, unknown>;

export type Style =
  | (CSSProperties & Record<`--${string}`, number | string | undefined>)
  | Falsy
  | Style[];

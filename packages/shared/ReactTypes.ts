export type Type = any;
export type Key = any;
export type Ref = any;
export type Props = any;

export interface ReactElementType {
  $$typeof: symbol | number;
  key: Key;
  type: Type;
  ref: Ref;
  props: Props;
  __mark: string;
}

export type Action<T> = T | ((preState: T) => T);

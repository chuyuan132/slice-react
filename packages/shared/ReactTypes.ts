export type Type = any;
export type Key = any;
export type Ref = { current: any } | ((instance: any) => void);
export type Props = any;

export interface ReactElementType {
  $$typeof: symbol | number;
  key: Key;
  type: Type;
  ref: Ref;
  props: Props;
}

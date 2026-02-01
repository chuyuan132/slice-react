import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbol';
import { Key, Props, ReactElementType, Ref, Type } from 'shared/ReactTypes';

const ReactElement = (type: Type, key: Key, ref: Ref, props: Props) => {
  const element: ReactElementType = {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props
  };
  return element;
};

export const jsx = (type: ReactElementType, config: any, ...maybeChildren: any) => {
  let key: Key = null;
  const props: Props = {};
  let ref: Ref = null;

  for (const prop in config) {
    const val = config[prop];
    if (prop === 'key') {
      if (val !== undefined) {
        key = '' + val;
      }
      continue;
    }
    if (prop === 'ref') {
      if (val !== undefined) {
        ref = val;
      }
      continue;
    }
    if ({}.hasOwnProperty.call(config, prop)) {
      props[prop] = val;
    }
  }
  const maybeChildrenLength = maybeChildren.length;
  if (maybeChildrenLength) {
    if (maybeChildrenLength === 1) {
      props.children = maybeChildren[0];
    } else {
      props.children = maybeChildren;
    }
  }
  return ReactElement(type, key, ref, props);
};

export const jsxDEV = (type: Type, config: any, maybeKey: any): ReactElementType => {
  let key: Key = null;
  const props: Props = {};
  let ref: Ref = null;
  if (maybeKey) {
    key = '' + maybeKey;
  }
  for (const propName in config) {
    const val = config[propName];
    if (propName === 'key') {
      if (val !== undefined) {
        key = '' + val;
      }
      continue;
    }
    if (propName === 'ref') {
      if (val !== undefined) {
        ref = val;
      }
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(config, propName)) {
      props[propName] = val;
    }
  }
  return ReactElement(type, key, ref, props);
};

export function isValidElement(object: any) {
  return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
}

import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbol';
import { Key, Props, ReactElementType, Ref, Type } from 'shared/ReactTypes';

const ReactElement = (type: Type, key: Key, ref: Ref, props: Props) => {
  const element: ReactElementType = {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props,
  };
  return element;
};

export const jsx = (type: Type, config: any, ...maybeChildren: any): ReactElementType => {
  let key: Key = null;
  const props: Props = {};
  let ref: Ref = null;
  for (const propName in config) {
    if (propName === 'key') {
      if (config[propName] !== undefined) {
        key = config[propName];
      }
      continue;
    }
    if (propName === 'ref') {
      if (propName === 'ref') {
        ref = config[propName];
      }
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(config, propName)) {
      props[propName] = config[propName];
    }
    console.log('jsx maybeChildren is',maybeChildren)
    return ReactElement(type, key, ref, props);
  }
};

export const jsxDEV = (type: Type, config: any, ...maybeChildren: any): ReactElementType => {
  let key: Key = null;
  const props: Props = {};
  let ref: Ref = null;
  for (const propName in config) {
    if (propName === 'key') {
      if (config[propName] !== undefined) {
        key = config[propName];
      }
      continue;
    }
    if (propName === 'ref') {
      if (propName === 'ref') {
        ref = config[propName];
      }
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(config, propName)) {
      props[propName] = config[propName];
    }
    console.log('jsxDEV maybeChildren is',maybeChildren)
    return ReactElement(type, key, ref, props);
  }
};

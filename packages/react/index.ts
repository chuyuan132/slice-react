import { jsx as createElementFn, isValidElement as isValidElementFn } from './src/jsx';
import currentDispatcher, { Dispatcher, resolveDispatcher } from './src/currentDispatcher';

// 导出 useState 方法，具体实现是从共享数据层获取的
export const useState: Dispatcher['useState'] = initialState => {
  const disPatcher = resolveDispatcher();
  return disPatcher.useState(initialState);
};

// 对外导出 currentDispatcher 共享数据层
export const __SECRET_INTERNAL_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
  currentDispatcher
};
export const version = '0.0.0';

export const createElement = createElementFn;

export const isValidElement = isValidElementFn
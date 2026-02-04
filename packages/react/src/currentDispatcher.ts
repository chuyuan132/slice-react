// 内部数据共享层

import { Action } from 'shared/ReactTypes';

export type Dispatch<T> = (action: Action<T>) => void;

export interface Dispatcher {
  useState: <T>(initialState: T | (() => T)) => [T, Dispatch<T>];
  useEffect: (callback: () => void, deps: any[]) => void;
}

const currentDispatcher: { current: Dispatcher | null } = {
  current: null
};

export const resolveDispatcher = () => {
  const dispatcher = currentDispatcher.current;
  if (dispatcher === null) {
    throw new Error('dispatcher not found');
  }
  return dispatcher;
};

export default currentDispatcher;

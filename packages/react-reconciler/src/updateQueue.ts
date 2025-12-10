import { Action } from 'shared/ReactTypes';

export interface Update<T> {
  action: Action<T>
}

export interface UpdateQueue<T> {
  shared: {
    pending: Update<T> | null
  }
}

// 创建更新
export const createUpdate = <T>(action: Action<T>) => {
  return {
    action
  }
}

// 创建队列
export const createUpdateQueue = <T>():UpdateQueue<T> => {
  return {
    shared: {
      pending: null
    }
  }
}

// 加入队列
export const enUpdateQueue = <T>(updateQueue: UpdateQueue<T>, update: Update<T>) => {
  updateQueue.shared.pending = update
}

// 消费更新
export const processUpdateQueue = <T>(baseState: T, pendingUpdate: Update<T>): {memoizedState: T} => {
  let result:ReturnType<typeof processUpdateQueue<T>> = { memoizedState: baseState};
  const action = pendingUpdate.action
  if(action instanceof Function) {
    result.memoizedState = action(baseState)
  } else {
    result.memoizedState = action;
  }
  return result;
}


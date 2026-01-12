export type Action<T> = T | ((preState: T) => T);

export interface Update<T> {
  action: Action<T>;
}

export interface UpdateQueue<T> {
  share: {
    pending: Update<T> | null;
  };
}

// 创建update
export const createUpdate = <T>(action: Action<T>) => {
  return {
    action
  };
};

// 创建update queue
export const createUpdateQueue = () => {
  return {
    share: {
      pending: null
    }
  };
};

// 推入 update queue
export const enQueueUpdate = <T>(updateQueue: UpdateQueue<T>, update: Update<T>) => {
  updateQueue.share.pending = update;
};

// 消费update
export const processUpdateQueue = <T>(baseState: T, pendingUpdate: Update<T> | null): { memoizedState: T } => {
  const result: ReturnType<typeof processUpdateQueue<T>> = { memoizedState: baseState };
  if (!pendingUpdate) return result;
  if (pendingUpdate.action instanceof Function) {
    result.memoizedState = pendingUpdate.action(result.memoizedState);
  } else {
    result.memoizedState = pendingUpdate.action;
  }
  return result;
};

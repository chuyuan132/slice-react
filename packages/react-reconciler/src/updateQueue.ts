import { Action } from 'shared/ReactTypes';
import { Dispatch } from 'react/src/currentDispatcher';
import { Lane } from './fiberLanes';

export interface Update<T> {
  action: Action<T>;
  next: Update<T> | null;
  lane: Lane;
}

export interface UpdateQueue<T> {
  share: {
    pending: Update<T> | null;
  };
  dispatch: Dispatch<T> | null;
}

// 创建update
export const createUpdate = <T>(action: Action<T>, lane: Lane) => {
  return {
    action,
    lane,
    next: null
  };
};

// 创建update queue
export const createUpdateQueue = () => {
  return {
    share: {
      pending: null
    },
    dispatch: null
  };
};

// 推入 update queue
export const enQueueUpdate = <T>(updateQueue: UpdateQueue<T>, update: Update<T>) => {
  const pending = updateQueue.share.pending;
  if (pending === null) {
    // 第一个update，自身形成环状链表
    update.next = update;
  } else {
    // 第二个update
    update.next = pending.next; // 最后一个节点始终指向头节点
    pending.next = update; // 头节点的next指向下一个
  }
  updateQueue.share.pending = update;
};

// 消费update
export const processUpdateQueue = <T>(
  baseState: T,
  pendingUpdate: Update<T> | null,
  lane: Lane
): { memoizedState: T } => {
  const result: ReturnType<typeof processUpdateQueue<T>> = { memoizedState: baseState };
  if (!pendingUpdate) return result;
  const firstUpdate = pendingUpdate.next; // 头
  let update = pendingUpdate.next as Update<T>; // 当前指针，也指向头
  do {
    if (update.lane === lane) {
      if (update.action instanceof Function) {
        baseState = update.action(baseState);
      } else {
        baseState = update.action;
      }
    }
    update = update.next as Update<T>;
  } while (update !== firstUpdate);
  result.memoizedState = baseState;
  return result;
};

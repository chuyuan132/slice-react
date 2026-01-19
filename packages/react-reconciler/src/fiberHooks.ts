import { FiberNode } from './fiber';
import { internals } from 'shared/internals';
import { Dispatch } from 'react/src/currentDispatcher';
import { createUpdate, createUpdateQueue, enQueueUpdate, UpdateQueue } from './updateQueue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';

let currentlyRenderFiber: FiberNode | null = null; // 当前正在执行的fiber

let workInProgressHook: Hook<any> | null = null; // 当前执行的hook

interface Hook<T> {
  memoizedState: any;
  updateQueue: UpdateQueue<T> | null;
  next: Hook<T> | null;
}

export function renderWithHooks(fiber: FiberNode) {
  currentlyRenderFiber = fiber;
  currentlyRenderFiber.memoizedState = null;
  const current = fiber.alternate;
  if (current !== null) {
    // update
    internals.currentDispatcher.current = null;
  } else {
    // mount
    internals.currentDispatcher.current = HookDispatcherOnMount();
  }

  const pendingProps = fiber.pendingProps;
  const Component = fiber.type;
  const children = Component(pendingProps);
  currentlyRenderFiber = null;
  return children;
}

export function HookDispatcherOnMount() {
  return {
    useState: mountState
  };
}

export function dispatchSetState<T>(fiber: FiberNode, updateQueue: UpdateQueue<T>, action: Action<T>) {
  const update = createUpdate<T>(action);
  enQueueUpdate(updateQueue, update);
  scheduleUpdateOnFiber(fiber);
}

export function mountState<T>(initialState: T | (() => T)): [T, Dispatch<T>] {
  // 找到当前useState的hook数据
  const hook = mountWorkInProgressHook<T>();
  let memoizedState = null;
  if (initialState instanceof Function) {
    memoizedState = initialState();
  } else {
    memoizedState = initialState;
  }
  const queue = createUpdateQueue();
  const dispatch = dispatchSetState.bind(null, currentlyRenderFiber as FiberNode, queue);
  hook.updateQueue = queue;
  hook.updateQueue.dispatch = dispatch;
  return [memoizedState, dispatch];
}

export function mountWorkInProgressHook<T>(): Hook<T> {
  const Hook = {
    memoizedState: null,
    updateQueue: null,
    next: null
  };
  if (workInProgressHook == null) {
    if (currentlyRenderFiber === null) {
      throw new Error('useState must be called inside a function component');
    } else {
      // mount第一个hook
      workInProgressHook = Hook;
      currentlyRenderFiber.memoizedState = workInProgressHook;
    }
  } else {
    // mount后续的hook
    workInProgressHook.next = Hook;
    workInProgressHook = Hook;
  }
  return workInProgressHook;
}

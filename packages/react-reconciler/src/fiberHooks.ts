import { FiberNode } from './fiber';
import { internals } from 'shared/internals';
import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import { createUpdate, createUpdateQueue, enQueueUpdate, processUpdateQueue, UpdateQueue } from './updateQueue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';

let currentlyRenderFiber: FiberNode | null = null; // 当前正在执行的fiber
let workInProgressHook: Hook<any> | null = null;
let currentHook: Hook<any> | null = null;
interface Hook<T> {
  memoizedState: any;
  updateQueue: UpdateQueue<T> | null;
  next: Hook<T> | null;
}

function HookDispatcherOnMount(): Dispatcher {
  return {
    useState: mountState
  };
}

function HookDispatcherOnUpdate(): Dispatcher {
  return {
    useState: updateState
  };
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

export function updateWorkInProgressHook<T>(): Hook<T> {
  let nextCurrentHook: Hook<T> | null = null;
  if (currentHook === null) {
    // 第一个hook
    const current = currentlyRenderFiber?.alternate;
    if (current !== null) {
      nextCurrentHook = current?.memoizedState;
    } else {
      nextCurrentHook = null;
    }
  } else {
    nextCurrentHook = currentHook.next as Hook<T>;
  }

  if (nextCurrentHook === null) {
    throw new Error('Hooks num out of prev num');
  }
  currentHook = nextCurrentHook;
  const newHook: Hook<T> = {
    memoizedState: currentHook.memoizedState,
    updateQueue: currentHook.updateQueue,
    next: currentHook.next
  };

  if (workInProgressHook == null) {
    if (currentlyRenderFiber === null) {
      throw new Error('useState must be called inside a function component');
    } else {
      // update第一个hook
      workInProgressHook = newHook;
      currentlyRenderFiber.memoizedState = workInProgressHook;
    }
  } else {
    // update后续的hook
    workInProgressHook.next = newHook;
    workInProgressHook = newHook;
  }
  return workInProgressHook;
}

export function dispatchSetState<T>(fiber: FiberNode, updateQueue: UpdateQueue<T>, action: Action<T>) {
  const update = createUpdate<T>(action);
  enQueueUpdate(updateQueue, update);
  scheduleUpdateOnFiber(fiber);
}

function mountState<T>(initialState: T | (() => T)): [T, Dispatch<T>] {
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

function updateState<T>(): [T, Dispatch<T>] {
  const hook = updateWorkInProgressHook<T>();
  const queue = hook.updateQueue as UpdateQueue<T>;
  const pending = queue.share.pending;
  if (pending !== null) {
    const { memoizedState } = processUpdateQueue<T>(hook.memoizedState, queue.share.pending);
    hook.memoizedState = memoizedState;
  }

  return [hook.memoizedState, hook.updateQueue?.dispatch as Dispatch<T>];
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
  workInProgressHook = null;
  return children;
}

import { FiberNode } from './fiber';
import { internals } from 'shared/internals';
import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import { createUpdate, createUpdateQueue, enQueueUpdate, processUpdateQueue, UpdateQueue } from './updateQueue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';
import { Lane, NoLane, requestUpdateLane } from './fiberLanes';
import { Flag, PassiveEffect } from './fiberFlags';
import { HookHasEffect, Passive } from './effectHookTags';

let currentlyRenderFiber: FiberNode | null = null; // 当前正在执行的fiber
let workInProgressHook: Hook<any> | null = null;
let currentHook: Hook<any> | null = null;
let renderLane: Lane = NoLane;
interface Hook<T> {
  memoizedState: any;
  updateQueue: UpdateQueue<T> | null;
  next: Hook<T> | null;
}

export type EffectCallback = () => void;

export interface EffectHook {
  tag: Flag;
  create: EffectCallback;
  destroy: EffectCallback | null;
  deps: any[] | null;
  next: EffectHook | null;
}

export interface FCUpdateQueue<T> extends UpdateQueue<T> {
  lastEffect: EffectHook | null;
}

function HookDispatcherOnMount(): Dispatcher {
  return {
    useState: mountState,
    useEffect: mountEffect
  };
}

function HookDispatcherOnUpdate(): Dispatcher {
  return {
    useState: updateState,
    useEffect: updateEffect
  };
}

function updateEffect() {}

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
    next: null
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
  const lane = requestUpdateLane();
  const update = createUpdate<T>(action, lane);
  enQueueUpdate(updateQueue, update);
  scheduleUpdateOnFiber(fiber, lane);
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
  hook.memoizedState = memoizedState;
  hook.updateQueue = queue;
  hook.updateQueue.dispatch = dispatch;
  return [memoizedState, dispatch];
}

function createFCUpdateQueue<T>(): FCUpdateQueue<T> {
  const queue = createUpdateQueue() as FCUpdateQueue<T>;
  queue.lastEffect = null;
  return queue;
}

function mountEffect<T>(create: EffectCallback, deps: any[] | null | undefined) {
  if (!(create instanceof Function)) {
    throw new Error('Effect create must be a function');
  }
  const hook = mountWorkInProgressHook<T>();
  const nextDeps = deps === undefined ? null : deps;
  // 因为是mount流程，所以create肯定是要执行的，那么当前的fiber就一定是有副作用
  const fiber = currentlyRenderFiber as FiberNode;
  fiber.flags |= PassiveEffect;
  hook.memoizedState = pushEffect(Passive | HookHasEffect, create, null, nextDeps);
}

function pushEffect(hookFlags: Flag, create: EffectCallback, destroy: EffectCallback | null, deps: any[] | null) {
  const effect: EffectHook = {
    tag: hookFlags,
    create,
    destroy,
    deps,
    next: null
  };
  const fiber = currentlyRenderFiber as FiberNode;
  const updateQueue = fiber.updateQueue as FCUpdateQueue<any>;
  if (updateQueue === null) {
    const queue = createFCUpdateQueue();
    effect.next = effect;
    queue.lastEffect = effect;
    fiber.updateQueue = queue;
  } else {
    const lastEffect = updateQueue.lastEffect;
    if (lastEffect === null) {
      effect.next = effect;
    } else {
      effect.next = lastEffect.next;
      lastEffect.next = effect;
    }
    updateQueue.lastEffect = effect;
  }
  return effect;
}

function updateState<T>(): [T, Dispatch<T>] {
  const hook = updateWorkInProgressHook<T>();
  const queue = hook.updateQueue as UpdateQueue<T>;
  const pending = queue.share.pending;
  queue.share.pending = null;
  if (pending !== null) {
    const { memoizedState } = processUpdateQueue<T>(hook.memoizedState, pending, renderLane);
    hook.memoizedState = memoizedState;
  }
  return [hook.memoizedState, hook.updateQueue?.dispatch as Dispatch<T>];
}

export function renderWithHooks(fiber: FiberNode, lane: Lane) {
  currentlyRenderFiber = fiber;
  currentlyRenderFiber.memoizedState = null;
  const current = fiber.alternate;
  renderLane = lane;
  if (current !== null) {
    // update
    internals.currentDispatcher.current = HookDispatcherOnUpdate();
  } else {
    // mount
    internals.currentDispatcher.current = HookDispatcherOnMount();
  }

  const pendingProps = fiber.pendingProps;
  const Component = fiber.type;
  console.log('[首屏渲染]查看hook链表', currentlyRenderFiber);

  const children = Component(pendingProps);
  currentlyRenderFiber = null;
  workInProgressHook = null;
  currentHook = null;
  renderLane = NoLane;
  return children;
}

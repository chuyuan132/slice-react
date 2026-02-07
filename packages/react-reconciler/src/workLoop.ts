import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { HostRoot } from './workTags';
import { completeWork } from './comleteWork';
import { beginWork } from './beginWork';
import { commitRoot, flushPassiveEffects } from './commitWork';
import { getHighestPriorityLane, Lane, lanesToSchedulerPriority, mergeLanes, NoLane, SyncLane } from './fiberLanes';
import { flushSyncCallbacks, scheduleSyncTask } from './syncTaskQueue';
import { scheduleMicroTask } from 'hostConfig';
import { unstable_cancelCallback, unstable_scheduleCallback, unstable_shouldYield } from 'scheduler';

let workInProgress: FiberNode | null = null;
// 记录render的优先级
let wipRootRenderLane: Lane = NoLane;
// 并发中间状态
const RootInComplete = 1;
// 完成状态
const RootCompleted = 2;
function prepareFreshStack(root: FiberRootNode, lane: Lane) {
  workInProgress = createWorkInProgress(root.current, {});
  wipRootRenderLane = lane;
}

function completeUnitOfWork(fiber: FiberNode) {
  let node: FiberNode | null = fiber;
  do {
    completeWork(node);
    const sibling = node.sibling;
    if (sibling !== null) {
      workInProgress = sibling;
      return;
    }
    node = node.return;
    workInProgress = node;
  } while (node !== null);
}

function preformUnitOfWork(fiber: FiberNode) {
  const next = beginWork(fiber, wipRootRenderLane);
  fiber.memoizedProps = fiber.pendingProps;
  if (next !== null) {
    workInProgress = next;
  } else {
    completeUnitOfWork(fiber);
  }
}

// 不可中断的执行
function workLoopSync() {
  while (workInProgress !== null) {
    preformUnitOfWork(workInProgress);
  }
}

// 可中断的执行
function workLoopConcurrent() {
  while (workInProgress !== null && !unstable_shouldYield()) {
    preformUnitOfWork(workInProgress);
  }
}

// 调度更新
export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane) {
  const root = markUpdateFromFiberToRoot(fiber);
  markRootUpdated(root, lane);
  ensureRootIsScheduled(root);
}

export function ensureRootIsScheduled(root: FiberRootNode) {
  const updateLane = getHighestPriorityLane(root.pendingLanes);
  const cnode = root.callbackNode;
  // 如果取不到优先级了，直接return
  if (updateLane === NoLane) {
    if (cnode !== null) {
      unstable_cancelCallback(cnode);
    }
    root.callbackNode = null;
    root.callbackPriority = NoLane;
    return;
  }

  // 相同优先级
  if (root.callbackPriority === updateLane) {
    return;
  }

  // 更高优先级
  cnode && unstable_cancelCallback(cnode);
  let newCallbackNode = null;

  if (updateLane === SyncLane) {
    // 同步优先级，用微任务调度
    scheduleSyncTask(performSyncWorkOnRoot.bind(null, root));
    scheduleMicroTask(flushSyncCallbacks);
  } else {
    // 其他优先级，用宏任务调度
    const schedulerPriority = lanesToSchedulerPriority(updateLane);
    newCallbackNode = unstable_scheduleCallback(schedulerPriority, performConcurrentWorkOnRoot.bind(null, root, false));
  }
  root.callbackNode = newCallbackNode;
  root.callbackPriority = updateLane;
}

// render + commit 同步处理函数
function performSyncWorkOnRoot(root: FiberRootNode) {
  const updateLane = getHighestPriorityLane(root.pendingLanes);

  // todo: 有问题
  if (updateLane !== SyncLane) {
    ensureRootIsScheduled(root);
    return;
  }
  // 执行render
  const existStatus = renderRoot(root, updateLane, false);
  if (existStatus === RootCompleted) {
    // 执行render后的状态重置
    root.finishedWork = root.current.alternate;
    root.finishedLane = wipRootRenderLane;
    wipRootRenderLane = NoLane;

    // 进入commit阶段
    commitRoot(root);
  }
}

// render + commit 中断处理函数
function performConcurrentWorkOnRoot(root: FiberRootNode, didTimeout: boolean): any {
  // 执行effect
  const callbackNode = root.callbackNode;
  const didFlushPassiveEffects = flushPassiveEffects(root.pendingPassiveEffects);
  if (didFlushPassiveEffects) {
    if (root.callbackNode !== callbackNode) {
      return null;
    }
  }

  const updateLane = getHighestPriorityLane(root.pendingLanes);
  // 如果取不到优先级了，直接return
  if (updateLane === NoLane) {
    return;
  }
  // 执行render
  const needSync = updateLane === SyncLane || didTimeout;
  const existStatus = renderRoot(root, updateLane, !needSync);

  ensureRootIsScheduled(root);

  if (existStatus === RootInComplete) {
    if (callbackNode !== root.callbackNode) {
      return null;
    }
    return performConcurrentWorkOnRoot.bind(null, root, didTimeout);
  }
  if (existStatus === RootCompleted) {
    // 执行render后的状态重置
    root.finishedWork = root.current.alternate;
    root.finishedLane = updateLane;
    wipRootRenderLane = NoLane;

    // 进入commit阶段;
    commitRoot(root);
  }
}

function renderRoot(root: FiberRootNode, lane: Lane, shouldTimeSlice: boolean) {
  const nextLane = getHighestPriorityLane(root.pendingLanes);
  if (nextLane === NoLane) {
    return;
  }
  // 如果上一次执行的优先级与当前的优先级不一样才需要初始化
  if (wipRootRenderLane !== lane) {
    prepareFreshStack(root, lane);
  }

  try {
    shouldTimeSlice ? workLoopConcurrent() : workLoopSync();
  } catch (err) {
    if (__DEV__) {
      console.error('workLook failed', err);
    }
    workInProgress = null;
  }

  // 执行完成 || 被中断
  if (shouldTimeSlice && workInProgress !== null) {
    // 中断
    return RootInComplete;
  }
  if (!shouldTimeSlice && workInProgress !== null && __DEV__) {
    console.warn('非正常结束renderRoot');
  }
  return RootCompleted;
}

function markRootUpdated(root: FiberRootNode, lane: Lane) {
  root.pendingLanes = mergeLanes(root.pendingLanes, lane);
}

function markUpdateFromFiberToRoot(fiber: FiberNode) {
  let node = fiber;
  let parent = fiber.return;
  while (parent !== null) {
    node = parent;
    parent = parent.return;
  }
  if (node.tag === HostRoot) {
    return node.stateNode;
  }
  return null;
}

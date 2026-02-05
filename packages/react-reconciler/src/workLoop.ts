import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { HostRoot } from './workTags';
import { completeWork } from './comleteWork';
import { beginWork } from './beginWork';
import { commitRoot } from './commitWork';
import { getHighestPriorityLane, Lane, mergeLanes, NoLane, SyncLane } from './fiberLanes';
import { flushSyncCallbacks, scheduleSyncTask } from './syncTaskQueue';
import { scheduleMicroTask } from 'hostConfig';

let workInProgress: FiberNode | null = null;
let wipRootRenderLane: Lane = NoLane;
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

function workLook() {
  while (workInProgress !== null) {
    preformUnitOfWork(workInProgress);
  }
}

// 这个执行的渲染的函数由ensureRootIsScheduled调度执行的
function performSyncWorkOnRoot(root: FiberRootNode, lane: Lane) {
  const nextLane = getHighestPriorityLane(root.pendingLanes);

  // todo：临时处理：暂时只处理同步任务，由于第一次执行完已经移除SyncLane了，所以后面一定会被重新调度
  if (nextLane !== SyncLane) {
    ensureRootIsScheduled(root);
    return;
  }
  prepareFreshStack(root, lane);
  if (__DEV__) {
    console.log('performSyncWorkOnRoot start');
  }
  try {
    workLook();
    root.finishedWork = root.current.alternate;
    root.finishedLane = wipRootRenderLane;
    wipRootRenderLane = NoLane;
    commitRoot(root);
  } catch (err) {
    if (__DEV__) {
      console.error('workLook failed', err);
    }
  }
}

// 无论是什么地方调度了scheduleUpdateOnFiber这个函数，都会把对应的lane记录到root的pendingLanes中，然后根据算法取出最高优先级的lane
// 根据lane，执行宏微任务调度策略，如果重复执行performSyncWorkOnRoot，也要在performSyncWorkOnRoot里加一个逻辑，修复重复执行的问题，转而实现让ensureRootIsScheduled重新调度
export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane) {
  const root = markUpdateFromFiberToRoot(fiber);
  markRootUpdated(root, lane);
  ensureRootIsScheduled(root);
}

export function ensureRootIsScheduled(root: FiberRootNode) {
  const updateLane = getHighestPriorityLane(root.pendingLanes);
  if (updateLane === NoLane) {
    return;
  }
  if (updateLane === SyncLane) {
    // 推入微任务调度
    scheduleSyncTask(performSyncWorkOnRoot.bind(null, root, updateLane));
    scheduleMicroTask(flushSyncCallbacks);
  } else {
    // 推入宏任务调度
    console.warn('推入宏任务调度，未实现');
  }
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

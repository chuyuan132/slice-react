import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { HostRoot } from './workTags';
import { completeWork } from './comleteWork';
import { beginWork } from './beginWork';
import { commitRoot } from './commitWork';

let workInProgress: FiberNode | null = null;

function prepareFreshStack(root: FiberRootNode) {
  workInProgress = createWorkInProgress(root.current, {});
  if (__DEV__) {
    console.debug('prepareFreshStack: create/copy workInProgress complete!', workInProgress);
  }
}

function completeUnitOfWork(fiber: FiberNode) {
  let node = fiber;
  do {
    completeWork(node);
    const sibling = node.sibling;
    if (sibling !== null) {
      workInProgress = sibling;
      return;
    } else {
      node = node.return;
      workInProgress = node;
    }
  } while (node !== null);
}

function preformUnitOfWork(fiber: FiberNode) {
  const next = beginWork(fiber);
  fiber.memoizedProps = fiber.pendingProps;
  if (next !== null) {
    workInProgress = next;
  } else {
    completeUnitOfWork(fiber);
  }
}

function workLook() {
  if (__DEV__) {
    console.debug('workLook start');
  }
  while (workInProgress) {
    preformUnitOfWork(workInProgress);
  }
}

function renterRoot(root: FiberRootNode) {
  if (__DEV__) {
    console.debug('renterRoot start');
  }
  prepareFreshStack(root);
  try {
    workLook();
    root.finishedWork = root.current.alternate;
    if (__DEV__) {
      console.warn('workLook complete, finishedWork: ', root.finishedWork);
      console.warn('commitRoot start');
    }
    commitRoot(root);
  } catch (err) {
    console.log(err);
    if (__DEV__) {
      console.error('workLook失败');
    }
  }
}

export function scheduleUpdateOnFiber(fiber: FiberNode) {
  if (__DEV__) {
    console.debug('scheduleUpdateOnFiber start');
  }
  const root = markUpdateFromFiberToRoot(fiber);
  if (!root) {
    if (__DEV__) {
      console.error('scheduleUpdateOnFiber failed, root not exist');
    }
  }
  renterRoot(root);
}

function markUpdateFromFiberToRoot(fiber: FiberNode) {
  let node = fiber;
  let parent = fiber.return;
  while (parent) {
    node = parent;
    parent = parent.return;
  }
  if (node.tag === HostRoot) {
    return node.stateNode;
  }
  return null;
}

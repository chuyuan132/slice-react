import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { HostRoot } from './workTags';
import { completeWork } from './comleteWork';
import { beginWork } from './beginWork';
import { commitRoot } from './commitWork';

let workInProgress: FiberNode | null = null;

function prepareFreshStack(root: FiberRootNode) {
  workInProgress = createWorkInProgress(root.current, {});
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
  const next = beginWork(fiber);
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

function renterRoot(root: FiberRootNode) {
  prepareFreshStack(root);
  try {
    workLook();
    root.finishedWork = root.current.alternate;
    console.log('root.finishedWork', root.finishedWork);

    commitRoot(root);
  } catch (err) {
    if (__DEV__) {
      console.error('workLook failed', err);
    }
  }
}

export function scheduleUpdateOnFiber(fiber: FiberNode) {
  const root = markUpdateFromFiberToRoot(fiber);
  renterRoot(root);
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

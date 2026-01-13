import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { HostRoot } from './workTags';
import { comleteWork } from './comleteWork';
import { beginWork } from './beginWork';
import { commitRoot } from './commitWork';

let workInProgress: FiberNode | null = null;

function prepareFreshStack(root: FiberRootNode) {
  workInProgress = createWorkInProgress(root.current, {});
}

function completeUnitOfWork(fiber: FiberNode) {
  let node = fiber;
  do {
    comleteWork(node);
    const sibling = node.sibling;
    if(sibling !== null) {
      workInProgress = sibling
      return;
    } else {
      node = node.return;
      workInProgress = node;
    }
  } while(node !== null)
}

function preformUnitOfWork(fiber:FiberNode) {
  const next = beginWork(fiber)
  fiber.memoizedProps = fiber.pendingProps;
  if(next !== null) {
    workInProgress = next;
  } else {
    completeUnitOfWork(fiber)
  }
}

function workLook() {
  while(workInProgress) {
    preformUnitOfWork(workInProgress)
  }
}

function renterRoot(root: FiberRootNode) {
  prepareFreshStack(root);
  try {
    workLook()
    root.finishedWork = root.current.alternate
    commitRoot(root)
  } catch (error) {
    if(__DEV__) {
      console.error('workLook失败')
    }
  }
}

export function scheduleUpdateOnFiber(fiber: FiberNode) {
  const root = markUpdateFromFiberToRoot(fiber)
  if(!root) {
    if(__DEV__) {
      console.error('调度更新失败，root不存在')
    }
  }
  renterRoot(root)
}

function markUpdateFromFiberToRoot(fiber: FiberNode) {
  let node = fiber;
  let parent = fiber.return;
  while(parent) {
    node = parent;
    parent = parent.return
  }
  if(node.tag === HostRoot) {
    return node.stateNode
  }
  return null;
}

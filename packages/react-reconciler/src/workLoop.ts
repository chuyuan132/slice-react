import { FiberNode, FiberRootNode } from './fiber';
import { Props, ReactElementType } from 'shared/ReactTypes';
import { NotFlag } from './fiberFlags';
import { HostComponent, HostRoot, HostText } from './workTags';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import { mountReconcilerChildFibers, reconcilerChildFibers } from './childReconciler';
import { comleteWork } from './comleteWork';
import { beginWork } from './beginWork';

let workInProgress: FiberNode | null = null;

function prepareFreshStack(root: FiberRootNode) {
  workInProgress = createWorkInProgress(root.current, {});
}

function completeUnitOfWork(fiber: FiberNode) {
  comleteWork(fiber);
  const sibling = fiber.sibling;
  if(sibling) {
    workInProgress = sibling
  } else {
    workInProgress = fiber.return;
  }
}

function preformUnitOfWork(fiber:FiberNode) {
  const next = beginWork(fiber)
  fiber.memoizedProps = fiber.pendingProps;
  if(next) {
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

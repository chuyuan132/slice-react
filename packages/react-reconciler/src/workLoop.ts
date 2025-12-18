import { FiberNode, FiberRootNode } from './fiber';
import { Props, ReactElementType } from 'shared/ReactTypes';
import { NotFlag } from './fiberFlags';
import { HostComponent, HostRoot, HostText } from './workTags';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import { mountReconcilerChildFibers, reconcilerChildFibers } from './childReconciler';

let workInProgress: FiberNode | null = null;

export const scheduleUpdateOnFiber = (fiber: FiberNode) => {
  // todo: 处理调度
  const root = markUpdateFromFiberToRoot(fiber);
  renderRoot(root);
};

function markUpdateFromFiberToRoot(fiber: FiberNode) {
  let node = fiber;
  let parent = node.return;
  while (parent) {
    node = parent;
    parent = node.return;
  }
  return node;
}

const createWorkInProgress = (current: FiberNode, pendingProps: Props) => {
  let wip = current.alternate;
  if (!wip) {
    // 如果不存在alternate，说明是新创建的节点，需要创建，与current建立连接
    wip = new FiberNode(current.tag, pendingProps, current.key);
    current.alternate = wip;
    wip.alternate = current;
    wip.stateNode = current.stateNode;
  } else {
    // 如果存在alternate，说明是更新操作，需要更新
    wip.pendingProps = pendingProps;
    wip.flags = NotFlag;
  }
  wip.type = current.type;
  wip.updateQueue = current.updateQueue;
  wip.memoizedState = current.memoizedState;
  return wip;
};

const prepareFetchStack = (root: FiberRootNode) => {
  workInProgress = createWorkInProgress(root.current, {});
};

const completeWork = (fiber: FiberNode) => {};

const beginWork = (fiber: FiberNode) => {
  switch (fiber.tag) {
    case HostRoot:
      return updateHostRoot(fiber);
      break;
    case HostComponent:
      return updateHostComponent(fiber);
      break;
    case HostText:
      return null;
    default:
      if (__DEV__) {
        console.warn('beginWork未处理的类型', fiber.tag);
      }
      break;
  }
};

function updateHostRoot(fiber: FiberNode) {
  // 需要做2件事情：返回子fiber和计算状态的最新值
  const baseState = fiber.memoizedState;
  const pending = (fiber.updateQueue as UpdateQueue<ReactElementType>).share.pedding;
  const { memoizedState } = processUpdateQueue(baseState, pending);
  fiber.memoizedState = memoizedState;
  (fiber.updateQueue as UpdateQueue<ReactElementType>).share.pedding = null;
  reconcilerChildren(fiber, fiber.memoizedState);
  return fiber.child;
}

function updateHostComponent(fiber: FiberNode) {
  // 需要做一件事情，返回子fiber
  reconcilerChildren(fiber, fiber.pendingProps.children);
  return fiber.child;
}

function reconcilerChildren(fiber: FiberNode, children?: ReactElementType) {
  const current = fiber.alternate;
  if (current) {
    // 更新
    fiber.child = reconcilerChildFibers(fiber, current?.child, children);
  } else {
    // 挂载
    fiber.child = mountReconcilerChildFibers(fiber, current?.child, children);
  }
}

const completeUnitOfWork = (fiber: FiberNode) => {
  if (!fiber) return;
  completeWork(fiber);
  if (fiber.sibling) {
    workInProgress = fiber.sibling;
  } else {
    workInProgress = fiber.return;
  }
};

const performUnitOnWork = (fiber: FiberNode) => {
  const next = beginWork(fiber);
  fiber.memoizedProps = fiber.pendingProps;
  if (next) {
    workInProgress = next;
  } else {
    completeUnitOfWork(fiber);
  }
};

const workLoop = () => {
  while (workInProgress) {
    performUnitOnWork(workInProgress);
  }
};

// 更新机制
const renderRoot = (root: FiberRootNode) => {
  // 1、初始化workInProgress指向需要递归的节点
  prepareFetchStack(root);
  // 2、执行递归流程
  try {
    workLoop();
  } catch (error) {
    if (__DEV__) {
      console.error(error);
    }
    workInProgress = null;
  }
};

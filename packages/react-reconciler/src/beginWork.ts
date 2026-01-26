import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode } from './fiber';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import { FunctionComponent, HostComponent, HostRoot, HostText } from './workTags';
import { mountChildFibers, reconcilerChildFibers } from './childFiber';
import { renderWithHooks } from './fiberHooks';

/**
 * 递归中的递
 * 负责与reactElemnt对比，生成子fiber
 * 同时打上与结构相关的flags标记
 * @param fiber
 * @returns
 */
export function beginWork(fiber: FiberNode) {
  // 需要区分fiber的tag类型进行额外的处理
  switch (fiber.tag) {
    case HostRoot:
      return updateHostRoot(fiber);
    case HostComponent:
      return updateHostComponent(fiber);
    case HostText:
      return null;
    case FunctionComponent:
      return updateFunctionComponent(fiber);
    default:
      if (__DEV__) {
        console.log('beginWork未兼容的类型', fiber);
      }
      return null;
  }
}

function updateHostRoot(fiber: FiberNode) {
  // 计算状态的最新值
  const baseState = fiber.memoizedState;
  const updateQueue = fiber.updateQueue as UpdateQueue<ReactElementType>;
  const pending = updateQueue.share.pending;
  const { memoizedState } = processUpdateQueue(baseState, pending);
  fiber.memoizedState = memoizedState;
  updateQueue.share.pending = null;
  // 创造子fiber
  const nextChildren = fiber.memoizedState;
  reconclierChildren(fiber, nextChildren);
  return fiber.child;
}

function updateHostComponent(fiber: FiberNode) {
  // 创造子fiber
  const pendingProps = fiber.pendingProps;
  const nextChildren = pendingProps.children;
  reconclierChildren(fiber, nextChildren);
  return fiber.child;
}

function updateFunctionComponent(fiber: FiberNode) {
  // 创造子fiber
  const nextChildren = renderWithHooks(fiber);
  reconclierChildren(fiber, nextChildren);
  return fiber.child;
}

function reconclierChildren(wip: FiberNode, children: ReactElementType) {
  const current = wip.alternate;
  if (wip.alternate) {
    // update
    wip.child = reconcilerChildFibers(wip, current?.child || null, children);
  } else {
    // mount
    wip.child = mountChildFibers(wip, null, children);
  }
}

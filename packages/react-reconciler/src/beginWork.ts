import { ReactElementType } from "shared/ReactTypes";
import { FiberNode } from "./fiber";
import { processUpdateQueue, UpdateQueue } from "./updateQueue";
import { HostComponent, HostRoot, HostText } from "./workTags";
import { mountChildFibers, reconcilerChildFibers } from "./childFiber";

/**
 * 递归中的递
 * 负责与reactElemnt对比，生成子fiber
 * 同时打上与结构相关的flags标记
 * @param fiber
 * @returns
 */
export function beginWork(fiber:FiberNode) {
  // 需要区分fiber的tag类型进行额外的处理
  switch(fiber.tag) {
    case HostRoot:
      return updateHostRoot(fiber);
    case HostComponent:
      return updateHostComponent(fiber)
    case HostText:
      return null;
    default:
    if(__DEV__) {
      console.error('beginWork没处理的类型', fiber.tag)
    }
  }
}

function updateHostRoot(fiber: FiberNode) {
  // 计算状态的最新值
  const baseState = fiber.memoizedState;
  const updateQueue = fiber.updateQueue as UpdateQueue<ReactElementType>;
  const pending = updateQueue.share.pending;
  const { memoizedState } = processUpdateQueue(baseState, pending)
  fiber.memoizedState = memoizedState;
  updateQueue.share.pending = null;
  // 创造子fiber
  const nextChildren = fiber.memoizedState;
  reconclierChildren(fiber, nextChildren);
  return fiber.child;
}

function updateHostComponent(fiber:FiberNode) {
  // 创造子fiber
  const pendingProps = fiber.pendingProps;
  const nextChildren = pendingProps.child;
  reconclierChildren(fiber, nextChildren);
  return fiber.child;
}

function reconclierChildren(wip: FiberNode, children?: ReactElementType) {
  const current = wip.alternate;
  reconcilerChildFiber(wip, current?.child, children)
}

function reconcilerChildFiber(wip: FiberNode, current?:FiberNode, children?:ReactElementType) {
  if(current) {
    // update
    wip.child = reconcilerChildFibers(wip, current, children);
  } else {
    // mount
    wip.child = mountChildFibers(wip, null, children)
  }
}
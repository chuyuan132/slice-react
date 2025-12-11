import { beginWork } from "./beginWork";
import { completeWork } from "./completeWork";
import { createWorkInProgress, FiberNode, FiberRootNode } from "./fiber";
import { HostRoot } from "./ReactWorkTags";
let workInProgress: FiberNode | null = null;

function prepareFreshStack(fiber: FiberRootNode) {
  workInProgress = createWorkInProgress(fiber.current, {});
}

function workLoop() {
  while(workInProgress !== null) {
    performUnitOfWork(workInProgress)
  }
}

function performUnitOfWork(fiber: FiberNode) {
  const next = beginWork(fiber);
  fiber.memoizedProps = fiber.pendingProps;
  if(next === null) {
    completeUnitOfWork(fiber);
  } else {
    workInProgress = next;
  }
}

function completeUnitOfWork(fiber: FiberNode) {

  do {
    completeWork(fiber);
    const sibling: FiberNode | null = fiber.sibling;
    if(sibling !== null) {
      workInProgress = fiber.sibling;
      return;
    }
    workInProgress = fiber.return;
  } while(fiber !== null)
}


function renderRoot(root:FiberRootNode) {
  // 初始化fibeNode指向
  prepareFreshStack(root)
  do {
    try {
      workLoop()
      break;
    } catch (error) {
      console.warn('workLoop发生错误');
      workInProgress = null;
    }
  } while(true)
}

export function schedulerUpdateOnFiber(fiber: FiberNode) {
  const root = markUpdateFromFiberToRoot(fiber);
  renderRoot(root)

}

function markUpdateFromFiberToRoot(fiber: FiberNode) {
  let node = fiber;
  let parent = fiber.return;
  while(parent !== null) {
    node = parent;
    parent = node.return;
  }
  if(node.tag === HostRoot) {
    return node.stateNode
  }
  return null;
}
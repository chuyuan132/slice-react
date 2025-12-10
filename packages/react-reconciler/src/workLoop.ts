import { beginWork } from "./beginWork";
import { completeWork } from "./completeWork";
import { FiberNode } from "./fiber";
let workInProgress: FiberNode | null = null;

function prepareFreshStack(fiber: FiberNode) {
  workInProgress = fiber;
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


function renderRoot(root: FiberNode) {
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
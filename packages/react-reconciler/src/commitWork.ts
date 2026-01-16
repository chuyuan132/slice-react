import { appendChildToContainer, Container } from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import { ChildDeletion, MutationMark, NotFlag, Placement, Update } from './fiberFlags';
import { HostComponent, HostRoot, HostText } from './workTags';

/**
 * commit分三个子阶段
 * beforeMutation阶段
 * mutation阶段
 * layout阶段
 * @param root
 */
export function commitRoot(root: FiberRootNode) {
  const finishedWork = root.finishedWork;
  if (finishedWork == null) {
    return;
  }
  root.finishedWork = null;
  const rootHasEffect = (finishedWork.flags & MutationMark) !== NotFlag;
  const subTreeHasEffect = (finishedWork.subTreeFlags & MutationMark) !== NotFlag;
  if (rootHasEffect || subTreeHasEffect) {
    // beforeMutation阶段

    // mutation阶段
    commitMutationEffects(finishedWork);
    root.current = finishedWork;
    //layout阶段
  } else {
    root.current = finishedWork;
  }
}

let nextEffect: FiberNode | null = null;

function commitMutationEffects(finishedWork: FiberNode) {
  nextEffect = finishedWork;
  // dfs遍历fiber节点处理标记
  while (nextEffect !== null) {
    const child = nextEffect.child as any;
    // 如果子树被标记了，一直深入进去
    if ((nextEffect.subTreeFlags & MutationMark) !== NotFlag && child !== null) {
      nextEffect = child;
    } else {
      // 没有子节点或者没有subTreeFlags标记了
      // 处理好当前节点的flag，然后遍历兄弟节点
      while (nextEffect !== null) {
        commitMutationEffectsOnFiber(nextEffect);
        if (nextEffect.sibling !== null) {
          nextEffect = nextEffect.sibling;
          break;
        }
        // 没有兄弟节点，回溯父节点
        nextEffect = nextEffect.return;
      }
    }
  }
}

function commitMutationEffectsOnFiber(finishedWork: FiberNode) {
  const { flags } = finishedWork;
  if ((flags & Placement) !== NotFlag) {
    // 新增
    commitPlacement(finishedWork);
    finishedWork.flags &= ~Placement;
  }
  if ((flags & Update) !== NotFlag) {
    // 更新
    // finishedWork.flags &= ~Update;
  }
  if ((flags & ChildDeletion) !== NotFlag) {
    // 删除子节点
    // finishedWork.flags &= ~ChildDeletion;
  }
}

function commitPlacement(finishedWork: FiberNode) {
  // 获取parent和要插入的dom
  const parent = getHostParent(finishedWork);
  if (parent === null) {
    return;
  }
  appendPlacementNodeInToContainer(finishedWork, parent);
}

function getHostParent(fiber: FiberNode) {
  let parent = fiber.return;
  while (parent !== null) {
    if (parent.tag === HostComponent) {
      return parent.stateNode as Container;
    } else if (parent.tag === HostRoot) {
      return (parent.stateNode as FiberRootNode).container;
    }
    parent = parent.return;
  }
  return null;
}

function appendPlacementNodeInToContainer(finishedWork: FiberNode, hostParent: Container) {
  if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
    appendChildToContainer(hostParent, finishedWork.stateNode);
    return;
  }
  const child = finishedWork.child;
  if (child !== null) {
    appendPlacementNodeInToContainer(child, hostParent);
    let sibling = child.sibling;
    while (sibling !== null) {
      appendPlacementNodeInToContainer(sibling, hostParent);
      sibling = sibling.sibling;
    }
  }
}

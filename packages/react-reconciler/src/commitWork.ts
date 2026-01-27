import { appendInitialChild, commitUpdate, Container, removeChild } from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import { ChildDeletion, MutationMark, NotFlag, Placement, Update } from './fiberFlags';
import { FunctionComponent, HostComponent, HostRoot, HostText } from './workTags';

// 当进入commitWork流程的时候，说明beginWork和completeWork已经处理完成
// beginWork负责往下探测，根据reactElementType生成/复用fiber节点且打上与结构相关的flags
// 探测到底的时候，启动completeWork流程，处理本节点生成stateNode且打上更新的flags,然后判断是否有兄弟节点，有则重新启动beginWork流程，没有就返回上一层节点
// 当走到commitWork流程的时候，在内存中已经生成一颗fiber树，DOM之间也互相挂载了。

// 首屏渲染流程：
/**
 * beginWork -> create children fiber -> no children -> completeWork self fiber -> sibling beginWork -> sibling completeWork -> no sibling sibling -> parent completeWork
 * 生成了一颗fiber树，只有hostRootFiber的child fiber 有placement标记，其他fiber没有，且stateNode之间已经互相挂载了
 */
export function commitRoot(root: FiberRootNode) {
  const finishedWork = root.finishedWork;
  if (finishedWork == null) {
    if (__DEV__) {
      console.warn('commitWork: no finishedWork');
    }
    return;
  }
  const rootHasEffect = (finishedWork.flags & MutationMark) !== NotFlag;
  const subTreeHasEffect = (finishedWork.subTreeFlags & MutationMark) !== NotFlag;
  if (rootHasEffect || subTreeHasEffect) {
    // beforeMutation
    // mutation
    commitMutationEffects(finishedWork);
    root.current = finishedWork;
    // layout
  } else {
    root.current = finishedWork;
  }
}

let nextEffect: FiberNode | null = null;
function commitMutationEffects(finishedWork: FiberNode) {
  nextEffect = finishedWork;
  while (nextEffect !== null) {
    nextEffect = nextEffect.child;
    if (nextEffect && (nextEffect.subTreeFlags & MutationMark) !== NotFlag) {
      nextEffect = nextEffect.child;
    } else {
      // 如果没有子树或者子树上没有标记了，那就对当前节点处理标记
      while (nextEffect !== null) {
        commitMutationEffectsOnFiber(nextEffect);
        if (nextEffect?.sibling !== null) {
          nextEffect = nextEffect.sibling;
          break;
        }
        nextEffect = nextEffect?.return;
      }
    }
  }
}

function commitMutationEffectsOnFiber(finishedWork: FiberNode) {
  const flags = finishedWork.flags;
  if ((flags & Placement) !== NotFlag) {
    commitPlacement(finishedWork);
    finishedWork.flags &= ~Placement;
  }
  if ((flags & Update) !== NotFlag) {
    commitUpdate(finishedWork);
    finishedWork.flags &= ~Update;
  }
  if ((flags & ChildDeletion) !== NotFlag) {
    const deletions = finishedWork.deletions;
    if (deletions !== null) {
      deletions.forEach(item => {
        commitDeletion(item);
      });
    }
    finishedWork.flags &= ~ChildDeletion;
  }
}

function commitDeletion(fiber: FiberNode) {
  let rootHostNode: FiberNode | null = null;
  commitNestedComponent(fiber, unMountFiber => {
    switch (unMountFiber.tag) {
      case HostComponent:
        if (rootHostNode === null) {
          rootHostNode = unMountFiber;
        }
        // 解绑ref
        break;
      case HostText:
        if (rootHostNode === null) {
          rootHostNode = unMountFiber;
        }
        break;
      case FunctionComponent:
        // todo: unmount, useeffect, ref
        break;
      default:
        if (__DEV__) {
          console.warn('未处理的unMountFiber类型', unMountFiber);
        }
        break;
    }
  });
  if (rootHostNode !== null) {
    const parent = getHostParent(fiber);
    if (parent !== null) {
      removeChild(parent, (rootHostNode as FiberNode).stateNode);
    }
  }
  fiber.return = null;
  fiber.deletions = null;
}

function commitNestedComponent(fiber: FiberNode, onCommitUnount: (unMountFiber: FiberNode) => void) {
  let node = fiber;
  while (true) {
    onCommitUnount(node);
    if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === fiber) {
      return;
    }

    while (node.sibling === null) {
      if (node.return === null || node.return === fiber) {
        return;
      }
      node = node.return;
    }
    node.sibling.return = node;
    node = node.sibling;
  }
}

function commitPlacement(finishedWork: FiberNode) {
  const hostParent = getHostParent(finishedWork);
  if (hostParent !== null) {
    appendPlacementNodeInToContainer(finishedWork, hostParent);
  }
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
    appendInitialChild(hostParent, finishedWork.stateNode);
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

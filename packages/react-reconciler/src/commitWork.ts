import { appendInitialChild, commitUpdate, Container, insertChildToContainer, Instance, removeChild } from 'hostConfig';
import { FiberNode, FiberRootNode, PendingPassiveEffects } from './fiber';
import {
  ChildDeletion,
  Flag,
  MutationMark,
  NotFlag,
  PassiveEffect,
  PassiveMark,
  Placement,
  Update
} from './fiberFlags';
import { FunctionComponent, HostComponent, HostRoot, HostText } from './workTags';
import { markRootFinished, NoLane } from './fiberLanes';
import { EffectHook, FCUpdateQueue } from './fiberHooks';
import { unstable_scheduleCallback, unstable_NormalPriority } from 'scheduler';
import { ensureRootIsScheduled } from './workLoop';
import { HookHasEffect, Passive } from './effectHookTags';
import { flushSyncCallbacks } from './syncTaskQueue';

let rootDoesHasPassiveEffects = false;

// 不可中断的
export function commitRoot(root: FiberRootNode) {
  const finishedWork = root.finishedWork;
  const lane = root.finishedLane;

  if (finishedWork == null) {
    if (__DEV__) {
      console.warn('commitRoot: no finishedWork');
    }
    return;
  }
  if (lane === NoLane) {
    if (__DEV__) {
      console.warn('commitRoot: no lane');
    }
    return;
  }
  root.finishedWork = null;
  root.finishedLane = NoLane;
  markRootFinished(root, lane);

  // 这里先注册异步调度
  if ((finishedWork.flags & PassiveMark) !== NotFlag || (finishedWork.subTreeFlags & PassiveMark) !== NotFlag) {
    if (!rootDoesHasPassiveEffects) {
      rootDoesHasPassiveEffects = true;
      unstable_scheduleCallback(unstable_NormalPriority, () => {
        // 执行副作用
        flushPassiveEffects(root.pendingPassiveEffects);
        return;
      });
    }
  }

  // 以下是同步的，不允许被中断
  const rootHasEffect = (finishedWork.flags & MutationMark) !== NotFlag;
  const subTreeHasEffect = (finishedWork.subTreeFlags & MutationMark) !== NotFlag;
  if (rootHasEffect || subTreeHasEffect) {
    // beforeMutation
    // mutation
    commitMutationEffects(finishedWork, root);
    root.current = finishedWork;
    // layout
  } else {
    root.current = finishedWork;
  }
  rootDoesHasPassiveEffects = false;
  // 兜底，当前这轮更新完成后，再次调度，可以实现连续的更新
  ensureRootIsScheduled(root);
}

let nextEffect: FiberNode | null = null;

function flushPassiveEffects(pendingPassiveEffects: PendingPassiveEffects) {
  pendingPassiveEffects.unmount.forEach(effect => {
    commitHookEffectListUnmount(Passive, effect);
  });
  pendingPassiveEffects.unmount = [];
  pendingPassiveEffects.update.forEach(effect => {
    commitHookEffectListDestroy(Passive | HookHasEffect, effect);
  });
  pendingPassiveEffects.update.forEach(effect => {
    commitHookEffectListCreate(Passive | HookHasEffect, effect);
  });
  pendingPassiveEffects.update = [];
  flushSyncCallbacks();
}

function commitHookEffectListUnmount(flag: Flag, lastEffect: EffectHook) {
  commitHookEffectList(flag, lastEffect, (effect: EffectHook) => {
    effect?.destroy?.();
    effect.tag &= ~HookHasEffect;
  });
}

function commitHookEffectListDestroy(flag: Flag, lastEffect: EffectHook) {
  commitHookEffectList(flag, lastEffect, (effect: EffectHook) => {
    effect?.destroy?.();
  });
}

function commitHookEffectListCreate(flag: Flag, lastEffect: EffectHook) {
  commitHookEffectList(flag, lastEffect, (effect: EffectHook) => {
    const destroy = effect.create();
    destroy && (effect.destroy = destroy);
  });
}

// 新增一个遍历环形链表的处理函数
function commitHookEffectList(flags: Flag, lastEffect: EffectHook, callback: (effect: EffectHook) => void) {
  let headPointer = lastEffect.next;
  do {
    if (headPointer !== null) {
      if ((headPointer.tag & flags) === flags) {
        callback(headPointer);
      }
      headPointer = headPointer.next;
    }
  } while (headPointer !== lastEffect.next);
}

function commitMutationEffects(finishedWork: FiberNode, root: FiberRootNode) {
  nextEffect = finishedWork;
  while (nextEffect !== null) {
    const child: FiberNode | null = nextEffect.child;
    if (nextEffect && (nextEffect.subTreeFlags & (MutationMark | PassiveMark)) !== NotFlag) {
      nextEffect = child;
    } else {
      // 如果没有子树或者子树上没有标记了，那就对当前节点处理标记
      while (nextEffect !== null) {
        commitMutationEffectsOnFiber(nextEffect, root);
        if (nextEffect?.sibling !== null) {
          nextEffect = nextEffect.sibling;
          break;
        }
        nextEffect = nextEffect?.return;
      }
    }
  }
}

function commitMutationEffectsOnFiber(finishedWork: FiberNode, root: FiberRootNode) {
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
        commitDeletion(item, root);
      });
    }
    finishedWork.flags &= ~ChildDeletion;
  }
  if ((flags & PassiveEffect) !== NotFlag) {
    commitPassiveEffect(finishedWork, root, 'update');
    finishedWork.flags &= ~PassiveEffect;
  }
}

// update unmount
function commitPassiveEffect(finishedWork: FiberNode, root: FiberRootNode, type: keyof PendingPassiveEffects) {
  if (
    finishedWork.tag !== FunctionComponent ||
    (type === 'update' && (finishedWork.flags & PassiveEffect) === NotFlag)
  ) {
    return;
  }

  const updateQueue = finishedWork.updateQueue as FCUpdateQueue<any>;
  if (updateQueue !== null) {
    const lastEffect = updateQueue.lastEffect;
    if (lastEffect === null) {
      if (__DEV__) {
        console.warn('正在执行effect的收集，但是fiber updateQueue lastEffect is null');
      }
    } else {
      root.pendingPassiveEffects[type].push(lastEffect);
    }
  } else {
    if (__DEV__) {
      console.warn('正在执行effect的收集，但是fiber updateQueue is null');
    }
  }
}

function recordHostChildrenToDelete(childrenToDelete: FiberNode[], unMountFiber: FiberNode) {
  const lastOne = childrenToDelete[childrenToDelete.length - 1];
  if (!lastOne) {
    childrenToDelete.push(unMountFiber);
  } else {
    // 找到同级的兄弟记录进入
    let sibling = lastOne.sibling;
    while (sibling !== null) {
      if (sibling === unMountFiber) {
        childrenToDelete.push(sibling);
      }
      sibling = sibling.sibling;
    }
  }
}
function commitDeletion(fiber: FiberNode, root: FiberRootNode) {
  let childrenToDelete: FiberNode[] | null = [];
  commitNestedComponent(fiber, unMountFiber => {
    switch (unMountFiber.tag) {
      case HostComponent:
        recordHostChildrenToDelete(childrenToDelete, unMountFiber);
        // 解绑ref
        break;
      case HostText:
        recordHostChildrenToDelete(childrenToDelete, unMountFiber);
        break;
      case FunctionComponent:
        // todo: 解绑ref
        commitPassiveEffect(unMountFiber, root, 'unmount');
        break;
      default:
        if (__DEV__) {
          console.warn('未处理的unMountFiber类型', unMountFiber);
        }
        break;
    }
  });
  if (childrenToDelete.length) {
    const parent = getHostParent(fiber);
    if (parent !== null) {
      childrenToDelete.forEach(node => {
        removeChild(parent, node.stateNode);
      });
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
  const hostSibling = getHostSibling(finishedWork);
  if (hostParent !== null) {
    appendPlacementNodeInToContainer(finishedWork, hostParent, hostSibling);
  }
}

function getHostSibling(fiber: FiberNode) {
  let node: FiberNode = fiber;
  findSibling: while (true) {
    while (node.sibling === null) {
      // 如果当前节点没有sibling，则找他父级sibling
      const parent = node.return;
      if (parent === null || parent.tag === HostComponent || parent.tag === HostRoot) {
        // 没找到
        return null;
      }
      node = parent;
    }
    node.sibling.return = node.return;
    // 向同级sibling寻找
    node = node.sibling;

    while (node.tag !== HostText && node.tag !== HostComponent) {
      // 找到一个非Host fiber，向下找，直到找到第一个Host子孙
      if ((node.flags & Placement) !== NotFlag) {
        // 这个fiber不稳定，不能用
        continue findSibling;
      }
      if (node.child === null) {
        continue findSibling;
      } else {
        node.child.return = node;
        node = node.child;
      }
    }

    // 找到最有可能的fiber
    if ((node.flags & Placement) === NotFlag) {
      // 这是稳定的fiber，就他了
      return node.stateNode;
    }
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

function appendPlacementNodeInToContainer(finishedWork: FiberNode, hostParent: Container, before?: Instance) {
  if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
    if (before) {
      insertChildToContainer(finishedWork.stateNode, hostParent, before);
    } else {
      appendInitialChild(hostParent, finishedWork.stateNode);
    }
    return;
  }
  const child = finishedWork.child;
  if (child !== null) {
    appendPlacementNodeInToContainer(child, hostParent, before);
    let sibling = child.sibling;
    while (sibling !== null) {
      appendPlacementNodeInToContainer(sibling, hostParent, before);
      sibling = sibling.sibling;
    }
  }
}

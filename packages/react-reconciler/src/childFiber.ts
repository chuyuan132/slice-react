import { Props, ReactElementType } from 'shared/ReactTypes';
import { createFiberFromElement, createWorkInProgress, FiberNode } from './fiber';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbol';
import { HostText } from './workTags';
import { ChildDeletion, Placement } from './fiberFlags';
function ChildReconciler(shouldTrackEffect: boolean) {
  function deletionChild(returnFiber: FiberNode, childToDelete: FiberNode) {
    if (!shouldTrackEffect) {
      return;
    }
    const deletions = returnFiber.deletions;
    if (deletions === null) {
      returnFiber.deletions = [childToDelete];
      returnFiber.flags |= ChildDeletion;
    } else {
      deletions.push(childToDelete);
    }
  }

  function useFiber(currentFiber: FiberNode, props: Props) {
    const fiber = createWorkInProgress(currentFiber, props);
    fiber.index = 0;
    fiber.sibling = null;
    fiber.return = null;
    return fiber;
  }

  function deleteRemainingChildren(returnFiber: FiberNode, currentFiber: FiberNode | null) {
    if (!shouldTrackEffect) {
      return;
    }
    let childToDelete = currentFiber;
    while (childToDelete !== null) {
      deletionChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
  }
  function reconcilerSingleElement(returnFiber: FiberNode, currentFiber: FiberNode | null, element: ReactElementType) {
    while (currentFiber !== null) {
      // update
      if (currentFiber.key === element.key) {
        // key 相同
        if (element.$$typeof === REACT_ELEMENT_TYPE) {
          if (element.type === currentFiber.type) {
            // type相同
            const existFiber = useFiber(currentFiber, element.props);
            existFiber.return = returnFiber;
            deleteRemainingChildren(returnFiber, currentFiber.sibling);
            return existFiber;
          }
          // type 不相同，删掉所有旧的
          deleteRemainingChildren(returnFiber, currentFiber);
          break;
        } else {
          if (__DEV__) {
            console.warn('enter beginwork update process, element type no support', element);
          }
          break;
        }
      } else {
        // key不同，删掉当前，遍历兄弟节点
        deletionChild(returnFiber, currentFiber);
        currentFiber = currentFiber.sibling;
      }
    }
    const fiber = createFiberFromElement(element);
    fiber.return = returnFiber;
    return fiber;
  }

  function reconcilerSingleTextElement(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    content: string | number | null
  ) {
    while (currentFiber !== null) {
      if (currentFiber.tag === HostText) {
        // type相同
        const existing = useFiber(currentFiber, { content });
        existing.return = returnFiber;
        deleteRemainingChildren(returnFiber, currentFiber.sibling);
        return existing;
      }
      deletionChild(returnFiber, currentFiber);
      currentFiber = currentFiber.sibling;
    }

    const fiber = new FiberNode(HostText, { content }, null);
    fiber.return = returnFiber;
    return fiber;
  }

  function placeSingleElement(fiber: FiberNode) {
    if (shouldTrackEffect && fiber.alternate == null) {
      fiber.flags |= Placement;
    }
    return fiber;
  }

  function updateFromMap(wip: FiberNode, existingChildren: Map<string, FiberNode>, index: number, element: any) {
    const keyToUse = element.key !== null ? element.key : index;
    const before = existingChildren.get(keyToUse);
    // 文本节点
    if (typeof element === 'string' || typeof element === 'number') {
      if (before && before.tag === HostText) {
        return useFiber(before, { content: element + '' });
      } else {
        return new FiberNode(HostText, { content: element + '' }, null);
      }
    }
    // HostComponent节点
    if (typeof element === 'object' && element !== null) {
      switch (element.$$typeof) {
        case REACT_ELEMENT_TYPE:
          if (before && before.type === element.type) {
            const fiber = useFiber(before, element.props);
            existingChildren.delete(keyToUse);
            return fiber;
          }
          return createFiberFromElement(element);
        default:
          if (__DEV__) {
            console.warn('【beginWork的子fiber创建流程】无法识别reactElement类型，无法生成子fiber', element);
          }
      }
    }
    // todo：element可能又是一个数组
    return null;
  }

  function reconcilerChildrenArray(returnFiber: FiberNode, currentFirstChildren: FiberNode | null, newChildren: any[]) {
    /**
     * 1、收集current同级的fiber节点
     * 2、遍历newChildren
     *    1、map中存在fiber，是否可复用
     *    2、map不存在fiber，或不能复用
     * 3、判断插入还是移动flag
     * 4、给剩余的fiber打上删除标记
     */
    const existingChildren = new Map();
    let currentFiber = currentFirstChildren;
    let lastNewFiber = null;
    let firstNewFiber = null;
    let lastPlaceIndex = 0;
    // 1、收集current同级的fiber节点
    while (currentFiber !== null) {
      const keyToUse = currentFiber.key !== null ? currentFiber.key : currentFiber.index;
      existingChildren.set(keyToUse, currentFiber);
      currentFiber = currentFiber.sibling;
    }
    // 2、遍历newChildren
    for (let i = 0; i < newChildren.length; i++) {
      const fiber = updateFromMap(returnFiber, existingChildren, i, newChildren[i]);
      if (fiber === null) {
        continue;
      }

      // 构建兄弟之间的关系
      fiber.index = i;
      fiber.return = returnFiber;
      if (lastNewFiber === null) {
        lastNewFiber = fiber;
        firstNewFiber = fiber;
      } else {
        lastNewFiber.sibling = fiber;
        lastNewFiber = lastNewFiber.sibling;
      }
      if (!shouldTrackEffect) {
        continue;
      }
      // 判断插入还是移动flag
      const current = fiber.alternate;
      if (current !== null) {
        // update
        const oldIndex = current.index;
        if (oldIndex < lastPlaceIndex) {
          // 移动
          fiber.flags |= Placement;
        } else {
          // 保持
          lastPlaceIndex = oldIndex;
        }
      } else {
        // mount
        fiber.flags |= Placement;
      }
      existingChildren.forEach(fiber => {
        deletionChild(returnFiber, fiber);
      });
      return firstNewFiber;
    }
  }

  return (wip: FiberNode, currentFiber: FiberNode | null, newChildren: ReactElementType | string | number) => {
    // 单节点
    if (typeof newChildren === 'object' && newChildren !== null) {
      switch (newChildren.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleElement(reconcilerSingleElement(wip, currentFiber, newChildren));
        default:
          if (__DEV__) {
            console.log('【beginWork的子fiber创建流程】无法识别reactElement类型，无法生成子fiber', newChildren);
          }
      }
    }
    // 单文本节点
    if (typeof newChildren === 'string' || typeof newChildren === 'number') {
      return placeSingleElement(reconcilerSingleTextElement(wip, currentFiber, newChildren));
    }

    // 多节点
    if (Array.isArray(newChildren) && newChildren !== null) {
      return reconcilerChildrenArray(wip, currentFiber, newChildren);
    }

    if (__DEV__) {
      console.log('【beginWork的子fiber创建流程】非string或number，无法生成子fiber', newChildren);
    }

    // 兜底
    if (currentFiber !== null) {
      deletionChild(wip, currentFiber);
    }

    return null;
  };
}

export const reconcilerChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);

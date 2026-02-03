import { Props, ReactElementType, Key } from 'shared/ReactTypes';
import { createFiberFromElement, createFiberFromFragment, createWorkInProgress, FiberNode } from './fiber';
import { REACT_ELEMENT_TYPE, REACT_FRAGEMENT_TYPE } from 'shared/ReactSymbol';
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
    const clone = createWorkInProgress(currentFiber, props);
    clone.sibling = null;
    clone.index = 0;
    clone.child = null;
    clone.return = null;
    return clone;
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
            let props = element.props;
            // 考虑到可能是一个带key的fragment节点，所以需要拿到正确的props
            if (element.type === REACT_FRAGEMENT_TYPE) {
              props = element.props.children;
            }
            const existFiber = useFiber(currentFiber, props);
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
    let fiber;
    if (element.type === REACT_FRAGEMENT_TYPE) {
      fiber = createFiberFromFragment(element.props.children, element.key);
    } else {
      fiber = createFiberFromElement(element);
    }
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

  function updateFragment(
    currentFiber: FiberNode | null | undefined,
    elements: any[],
    key: Key,
    existingChildren: Map<string, FiberNode>
  ) {
    if (currentFiber === null || currentFiber?.type !== REACT_FRAGEMENT_TYPE) {
      return createFiberFromFragment(elements, key);
    }
    existingChildren.delete(key);
    const fiber = useFiber(currentFiber, elements);
    return fiber;
  }

  function updateFromMap(wip: FiberNode, existingChildren: Map<string, FiberNode>, index: number, element: any) {
    const keyToUse = element.key !== null ? element.key : index;
    // 前fiber节点
    const before = existingChildren.get(keyToUse);

    // 单节点
    if (typeof element === 'object' && element !== null) {
      switch (element.$$typeof) {
        case REACT_ELEMENT_TYPE:
          if (element.type === REACT_FRAGEMENT_TYPE) {
            return updateFragment(before, element.props.children, keyToUse, existingChildren);
          }
          if (before && before.type === element.type) {
            existingChildren.delete(keyToUse);
            const fiber = useFiber(before, element.props);

            return fiber;
          }
          return createFiberFromElement(element);
      }
    }

    // 文本节点类型
    if (typeof element === 'string' || typeof element === 'number') {
      if (before && before.tag === HostText) {
        existingChildren.delete(keyToUse);
        return useFiber(before, { content: element + '' });
      } else {
        return new FiberNode(HostText, { content: element + '' }, null);
      }
    }

    // element可能又是一个数组,当成fragment处理
    if (Array.isArray(element)) {
      return updateFragment(before, element, keyToUse, existingChildren);
    }
    return null;
  }

  function reconcilerChildrenArray(returnFiber: FiberNode, currentFirstChildren: FiberNode | null, element: any) {
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
    // 2、遍历element
    for (let i = 0; i < element.length; i++) {
      const currElement = element[i];
      const fiber = updateFromMap(returnFiber, existingChildren, i, currElement);

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
        lastNewFiber = fiber;
      }

      if (!shouldTrackEffect) {
        continue;
      }
      // 判断插入还是移动flag;
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
    }
    existingChildren.forEach(fiber => {
      deletionChild(returnFiber, fiber);
    });
    return firstNewFiber;
  }

  return (returnFiber: FiberNode, currentFiber: FiberNode | null, element: any) => {
    // 顶层fragment节点
    const isUnkeyedToTopLevelFragment =
      typeof element === 'object' && element !== null && element.type === REACT_FRAGEMENT_TYPE && element.key === null;
    if (isUnkeyedToTopLevelFragment) {
      element = element.props.children;
    }

    // 单文本节点
    if (typeof element === 'string' || typeof element === 'number') {
      return placeSingleElement(reconcilerSingleTextElement(returnFiber, currentFiber, element));
    }

    // 单节点
    if (typeof element === 'object' && element !== null) {
      switch (element.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleElement(reconcilerSingleElement(returnFiber, currentFiber, element));
      }
    }

    // 多节点
    if (Array.isArray(element) && element !== null) {
      return reconcilerChildrenArray(returnFiber, currentFiber, element);
    }

    if (__DEV__) {
      console.warn(
        '【beginWork】element未命中单节点，单文本节点，多节点逻辑，将进入兜底，删除所有旧的fiber节点，返回null',
        element
      );
    }

    // 兜底，删除所有旧的子节点，返回一个null的fiber节点
    if (currentFiber !== null) {
      deleteRemainingChildren(returnFiber, currentFiber);
    }

    return null;
  };
}

export const reconcilerChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);

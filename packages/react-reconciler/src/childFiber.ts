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
  function reconcilerSingleElement(returnFiber: FiberNode, currentFiber: FiberNode | null, element: ReactElementType) {
    work: if (currentFiber !== null) {
      // update
      if (currentFiber.key === element.key) {
        if (element.$$typeof === REACT_ELEMENT_TYPE) {
          if (element.type === currentFiber.type) {
            // 复用
            const existFiber = useFiber(currentFiber, element.props);
            existFiber.return = returnFiber;
            return existFiber;
          }
          deletionChild(returnFiber, currentFiber);
          break work;
        } else {
          if (__DEV__) {
            console.warn('enter beginwork update process, element type no support', element);
          }
          break work;
        }
      } else {
        deletionChild(returnFiber, currentFiber);
        break work;
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
    if (currentFiber !== null) {
      if (currentFiber.tag === HostText) {
        // 类型没变，可以复用
        const existing = useFiber(currentFiber, { content });
        existing.return = returnFiber;
        return existing;
      }
      deletionChild(returnFiber, currentFiber);
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

  return (wip: FiberNode, currentFiber: FiberNode | null, newChildren: ReactElementType | string | number) => {
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
    // todo: 多节点
    if (typeof newChildren === 'string' || typeof newChildren === 'number') {
      return placeSingleElement(reconcilerSingleTextElement(wip, currentFiber, newChildren));
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

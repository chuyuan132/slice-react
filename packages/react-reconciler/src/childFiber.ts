import { Props, ReactElementType } from 'shared/ReactTypes';
import { createFiberFromElement, createWorkInProgress, FiberNode } from './fiber';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbol';
import { HostText } from './workTags';
import { ChildDeletion, Placement } from './fiberFlags';

function ChildReconciler(shouldTrackEffect: boolean) {
  function reconcilerSingleElement(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    element: ReactElementType
  ) {
    work:if(currentFiber !== null) {
      // update
      // 可能会出现 增删 顺序变更
      if(element.key === currentFiber.key) {
        if(element.$$typeof === REACT_ELEMENT_TYPE) {
          if(element.type === currentFiber.type) {
            // 返回相同的节点
            const existing = useFiber(currentFiber, element.props)
            existing.return = returnFiber;
            return existing;
          }
          deletionChild(returnFiber, currentFiber)
          break work;
        } else {
          if(__DEV__) {
            console.log('未实现的类型', element);
          }
          break work;
        }
      } else {
        deletionChild(returnFiber, currentFiber)
        break work;
      }
    }
    const fiber = createFiberFromElement(element);
    fiber.return = returnFiber;
    return fiber;
  }

  function deletionChild(returnFiber:FiberNode, childToDelete:FiberNode) {
    if(!shouldTrackEffect) return;
    let deletions = returnFiber.deletion
    if(deletions === null) {
      deletions = [childToDelete]
      returnFiber.flags |= ChildDeletion
    } else {
      deletions.push(childToDelete)
    }
  }

  function useFiber(currentFiber:FiberNode, props: Props) {
    const fiber = createWorkInProgress(currentFiber, props)
    fiber.index = 0;
    fiber.sibling = null;
    fiber.return = null;
    return fiber;
  }

  function reconcilerSingleTextElement(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    content: string | number | null
  ) {
    if(currentFiber !== null) {
      // update
      if(currentFiber.tag === HostText) {
        // 类型没变
        const existing = useFiber(currentFiber, { content})
        existing.return = returnFiber;
        return existing
      }
      deletionChild(returnFiber,currentFiber)
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
    if (typeof newChildren === 'string' || typeof newChildren === 'number') {
      return placeSingleElement(reconcilerSingleTextElement(wip, currentFiber, newChildren));
    }
    if (__DEV__) {
      console.log('【beginWork的子fiber创建流程】非string或number，无法生成子fiber', newChildren);
    }

    return null;
  };
}

export const reconcilerChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);

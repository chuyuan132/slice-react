import { log } from "console";
import { ReactElementType } from "shared/ReactTypes";
import { createFiberFromElement, FiberNode } from "./fiber";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbol";
import { HostText } from "./workTags";
import { Placement } from "./fiberFlags";

function ChildReconciler(shouldTrackEffect: boolean) {

  function reconcilerSingleElement(returnFiber: FiberNode, currentFiber:FiberNode | null, newChildren?:ReactElementType) {
    const fiber = createFiberFromElement(newChildren);
    fiber.return = returnFiber;
    return fiber;
  }

  function reconcilerSingleTextElement(returnFiber: FiberNode, currentFiber:FiberNode | null, content: string | number | null) {
    const fiber = new FiberNode(HostText, { content}, null);
    fiber.return = returnFiber;
    return fiber;
  }


  function placeSingleElement(fiber: FiberNode) {
    if(shouldTrackEffect && !fiber.alternate) {
      fiber.flags |= Placement
    }
    return fiber;
  }


  return (wip: FiberNode, currentFiber:FiberNode | null, newChildren:ReactElementType | string | number | null) => {
    if(typeof newChildren === 'object' && newChildren) {
      switch(newChildren.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleElement(reconcilerSingleElement(wip, currentFiber, newChildren));
        default:
          if(__DEV__) {
            console.error('未实现的reconciler类型', newChildren);
          }
      }
    }
    if(typeof newChildren === 'string' || typeof newChildren === 'number') {
      return placeSingleElement(reconcilerSingleTextElement(wip, currentFiber, newChildren))
    }
    if(__DEV__) {
      console.error('未实现的reconciler类型', newChildren);
    }

    return wip;
  }
}

export const reconcilerChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
import { FiberNode } from './fiber';
import { ReactElementType } from 'shared/ReactTypes';

function ChildReconciler(shouldTrackSideEffects: boolean) {
  return function reconcileChildrenFibers(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    newChild?: ReactElementType
  ) {};
}

export const reconcilerChildFibers = ChildReconciler(true);
export const mountReconcilerChildFibers = ChildReconciler(false);

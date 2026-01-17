import { FiberNode } from './fiber';

let currentlyRenderFiber: FiberNode | null = null;

export function renderWithHooks(fiber: FiberNode) {
  currentlyRenderFiber = fiber;

  const pendingProps = fiber.pendingProps;
  const Component = fiber.type;
  return Component(pendingProps);

  currentlyRenderFiber = null;
}

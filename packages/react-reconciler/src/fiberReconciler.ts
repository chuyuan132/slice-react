import { Container } from "hostConfig"
import { FiberNode, FiberRootNode } from "./fiber"
import { HostRoot } from "./ReactWorkTags"
import { createUpdate, createUpdateQueue, enUpdateQueue, UpdateQueue } from "./updateQueue";
import { ReactElementType } from "shared/ReactTypes";
import { schedulerUpdateOnFiber } from "./workLoop";

export const createContainer = (container: Container) => {
  const hostRootFiber = new FiberNode(HostRoot, {}, null);
  const root = new FiberRootNode(container, hostRootFiber);
  hostRootFiber.stateNode = root;
  hostRootFiber.updateQueue = createUpdateQueue()
  return root;
}

export const updateContainer = (element: ReactElementType | null, root: FiberRootNode) => {
  const hostRootFiber = root.current;
  const update = createUpdate< ReactElementType | null>(element)
  enUpdateQueue(hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>, update)
  schedulerUpdateOnFiber(hostRootFiber);
  return element;
}
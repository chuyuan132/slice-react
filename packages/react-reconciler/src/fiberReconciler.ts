import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode, FiberRootNode } from './fiber';
import { Container } from 'hostConfig';
import { createUpdate, createUpdateQueue, enQueueUpdate, UpdateQueue } from './updateQueue';
import { HostRoot } from './workTags';
import { scheduleUpdateOnFiber } from './workLoop';

export const createContainer = (container: Container) => {

  const hostRootFiber = new FiberNode(HostRoot, {}, null);
  const root = new FiberRootNode(container, hostRootFiber);
  hostRootFiber.updateQueue = createUpdateQueue();
  if (__DEV__) {
    console.log('createContainer: create hostRootFiber and fiberRootNode complete!');
  }
  return root;
};

export const updateContainer = (element: ReactElementType, root: FiberRootNode) => {
  const hostRootFiber = root.current;
  const updateQueue = hostRootFiber.updateQueue as UpdateQueue<ReactElementType>;
  const update = createUpdate<ReactElementType>(element);
  enQueueUpdate(updateQueue, update);
  if (__DEV__) {
    console.log('updateContainer: update ReactElement in hostRootFiber updateQueue complete!');
  }
  scheduleUpdateOnFiber(hostRootFiber);
  return element;
};

import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode, FiberRootNode } from './fiber';
import { Container } from 'hostConfig';
import { createUpdate, createUpdateQueue, enQueueUpdate, UpdateQueue } from './updateQueue';
import { HostRoot } from './workTags';
import { scheduleUpdateOnFiber } from './workLoop';

// 对应ReactDDOM.createRoot
// root.current <-> fiberRootNode.alertnate
export const createContainer = (container: Container) => {
  const hostRootFiber = new FiberNode(HostRoot, {}, null);
  const root = new FiberRootNode(container, hostRootFiber);
  // 初始化fiberRootNode的更新队列
  hostRootFiber.updateQueue = createUpdateQueue();
  return root;
};

// 对应render方法
export const updateContainer = (element: ReactElementType, root: FiberRootNode) => {
  const hostRootFiber = root.current;
  // 把传入的FunctionComponent塞进fiberRootNode更新队列里
  const updateQueue = hostRootFiber.updateQueue as UpdateQueue<ReactElementType>;
  const update = createUpdate<ReactElementType | null>(element);
  enQueueUpdate(updateQueue, update);
  scheduleUpdateOnFiber(hostRootFiber);
  return element;
};

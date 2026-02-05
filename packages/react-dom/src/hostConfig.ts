import { FiberNode } from 'react-reconciler/src/fiber';
import { HostComponent, HostText } from 'react-reconciler/src/workTags';
import { updateFiberProps } from './syntheticEvent';
import { Props } from 'shared/ReactTypes';
export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;
export const createInstance = (type: string, props: Props) => {
  const instance = document.createElement(type);
  updateFiberProps(instance, props);
  return instance;
};

export const appendInitialChild = (parent: Instance, child: Instance) => {
  parent.appendChild(child);
};

export const createTextInstance = (content: string) => {
  return document.createTextNode(content);
};

export const appendChildToContainer = appendInitialChild;

export const commitUpdate = (fiber: FiberNode) => {
  switch (fiber.tag) {
    case HostText:
      const text = fiber.memoizedProps.content;
      commitTextUpdate(fiber.stateNode, text);
      break;
    case HostComponent:
      updateFiberProps(fiber.stateNode, fiber.memoizedProps);
    default:
      if (__DEV__) {
        console.warn('未实现的更新类型');
      }
  }
};

function commitTextUpdate(textInstance: TextInstance, content: string) {
  textInstance.textContent = content;
}

export const removeChild = (parentInstance: Container, child: Instance | TextInstance) => {
  parentInstance.removeChild(child);
};

export function insertChildToContainer(child: Instance, container: Container, before: Instance) {
  container.insertBefore(child, before);
}

export const scheduleMicroTask =
  typeof queueMicrotask === 'function'
    ? queueMicrotask
    : typeof Promise === 'function'
      ? (callback: (...args: any[]) => void) => Promise.resolve(null).then(callback)
      : setTimeout;

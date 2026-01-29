import { FiberNode } from 'react-reconciler/src/fiber';
import { HostText } from 'react-reconciler/src/workTags';
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

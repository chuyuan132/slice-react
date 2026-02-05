import { FiberNode } from 'react-reconciler/src/fiber';
import { HostText } from 'react-reconciler/src/workTags';
import { Props } from 'shared/ReactTypes';

let instanceCounter = 0;

export interface Container {
  rootId: number;
  children: (Instance | TextInstance)[];
}

export interface Instance {
  id: number;
  type: string;
  children: (Instance | TextInstance)[];
  parent: number;
  props: Props;
}

export interface TextInstance {
  text: string;
  id: number;
  parent: number;
}

export const createInstance = (type: string, props: Props) => {
  return {
    id: instanceCounter++,
    type,
    children: [],
    parent: -1,
    props
  };
};

export const appendInitialChild = (parent: Instance | Container, child: Instance) => {
  const prevParentId = child.parent;
  const parentId = 'rootId' in parent ? parent.rootId : parent.id;
  if (prevParentId !== -1 && parentId !== prevParentId) {
    throw new Error('child already appended to parent');
  }
  parent.children.push(child);
  child.parent = parentId;
};

export const createTextInstance = (content: string) => {
  return {
    text: content,
    id: instanceCounter++,
    parent: -1
  };
};

export const appendChildToContainer = (parent: Container, child: Instance) => {
  const prevParentId = child.parent;
  if (prevParentId !== -1 && parent.rootId !== prevParentId) {
    throw new Error('child already appended to parent');
  }
  parent.children.push(child);
  child.parent = parent.rootId;
};

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
  textInstance.text = content;
}

export const removeChild = (parentInstance: Container, child: Instance | TextInstance) => {
  const index = parentInstance.children.indexOf(child);
  if (index === -1) {
    throw new Error('child not found');
  }
  parentInstance.children.splice(index, 1);
};

export function insertChildToContainer(child: Instance, container: Container, before: Instance) {
  const beforeIndex = container.children.indexOf(before);
  if (beforeIndex === -1) {
    throw new Error('before node not found');
  }
  const index = container.children.indexOf(child);
  if (index !== -1) {
    container.children.splice(index, 1);
  }
  container.children.splice(beforeIndex, 0, child);
}

export const scheduleMicroTask =
  typeof queueMicrotask === 'function'
    ? queueMicrotask
    : typeof Promise === 'function'
      ? (callback: (...args: any[]) => void) => Promise.resolve(null).then(callback)
      : setTimeout;

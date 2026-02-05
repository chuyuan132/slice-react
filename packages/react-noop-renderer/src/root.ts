import { createContainer, updateContainer } from 'react-reconciler/src/fiberReconciler';
import { ReactElementType } from 'shared/ReactTypes';
import { Container, Instance } from './hostConfig';

let instanceCounter = 0;

function getChildren(instance: Container | Instance) {
  if (instance.children) {
    return instance.children;
  }
  return null;
}

export function createRoot() {
  const container = {
    rootId: instanceCounter,
    children: []
  };
  //@ts-ignore
  const root = createContainer(container);
  return {
    render(element: ReactElementType) {
      return updateContainer(element, root);
    },
    getChildren() {
      return getChildren(container);
    }
  };
}

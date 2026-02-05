import { createContainer, updateContainer } from 'react-reconciler/src/fiberReconciler';
import { ReactElementType } from 'shared/ReactTypes';
import { Container, Instance } from './hostConfig';
import { REACT_ELEMENT_TYPE, REACT_FRAGEMENT_TYPE } from 'shared/ReactSymbol';

let instanceCounter = 0;

function getChildren(container: Container | Instance) {
  if (container.children) {
    return container.children;
  }
  return null;
}

function getChildrenAsJSX(root: Container) {
  const children = childToJSX(getChildren(root));
  if (Array.isArray(children)) {
    return {
      $$typeof: REACT_ELEMENT_TYPE,
      type: REACT_FRAGEMENT_TYPE,
      key: null,
      ref: null,
      props: { children },
      __mark: 'KaSong'
    };
  }
  return children;
}

function childToJSX(child: any): any {
  // 普通文本
  if (typeof child === 'string' || typeof child === 'number') {
    return child.toString();
  }
  // 本身就是一个数组
  if (Array.isArray(child)) {
    if (child.length === 0) {
      return null;
    }
    if (child.length === 1) {
      return childToJSX(child[0]);
    }
    const children = child.map(childToJSX);
    if (children.every(i => typeof i === 'string' || typeof i === 'number')) {
      return children.join('');
    }
    return children;
  }
  // 子节点是数组，说明是个对象
  if (Array.isArray(child.children)) {
    const instance: Instance = child;
    const children = childToJSX(instance.children);
    const props = instance.props;

    if (children !== null) {
      props.children = children;
    }

    return {
      $$typeof: REACT_ELEMENT_TYPE,
      type: instance.type,
      key: null,
      ref: null,
      props
    };
  }
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
    },
    getChildrenAsJSX() {
      return getChildrenAsJSX(container);
    }
  };
}

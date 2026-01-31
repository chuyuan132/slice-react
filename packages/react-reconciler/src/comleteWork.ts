import { appendInitialChild, createInstance, createTextInstance } from 'hostConfig';
import { FiberNode } from './fiber';
import { FunctionComponent, HostComponent, HostRoot, HostText } from './workTags';
import { NotFlag, Update } from './fiberFlags';
import { updateFiberProps } from 'react-dom/src/syntheticEvent';

/**
 * 递归中的归，从最深层的节点一级级挂载就好
 * 构建离屏的DOM树
 * 打上update标记
 * @param fiber
 */
export function completeWork(fiber: FiberNode) {
  const current = fiber.alternate;
  switch (fiber.tag) {
    case HostComponent:
      if (current !== null && fiber.stateNode !== null) {
        // update,判断属性变化打上标记
        updateFiberProps(fiber.stateNode, fiber.pendingProps);
      } else {
        // 根据宿主环境生成实例
        const instance = createInstance(fiber.type, fiber.pendingProps);
        appendAllChildren(instance, fiber);
        fiber.stateNode = instance;
      }
      bubblePropertity(fiber);
      break;
    case HostText:
      if (current !== null && fiber.stateNode !== null) {
        // update,暂不做处理
        const oldText = current.memoizedProps.content;
        const newText = fiber.pendingProps.content;
        if (oldText !== newText) {
          markUpdate(fiber);
        }
      } else {
        // 根据宿主环境生成实例
        fiber.stateNode = createTextInstance(fiber.pendingProps.content);
      }
      bubblePropertity(fiber);
      break;
    case HostRoot:
      bubblePropertity(fiber);
      break;
    case FunctionComponent:
      bubblePropertity(fiber);
      break;
    default:
      if (__DEV__) {
        console.error('completeWork不支持的类型', fiber);
      }
  }
}

function markUpdate(fiber: FiberNode) {
  fiber.flags |= Update;
}

function appendAllChildren(parent: any, fiber: FiberNode) {
  let node = fiber.child;
  while (node !== null) {
    if (node.tag === HostComponent || node.tag === HostText) {
      // 挂载操作
      appendInitialChild(parent, node.stateNode);
    } else if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }

    if (node === fiber) return;

    while (node.sibling == null) {
      if (node.return == null || node.return == fiber) {
        return;
      }
      node = node.return;
    }
    node = node.sibling;
  }
}

function bubblePropertity(fiber: FiberNode) {
  let subTreeFlags = NotFlag;
  let node = fiber.child;
  while (node !== null) {
    subTreeFlags |= node.subTreeFlags;
    subTreeFlags |= node.flags;
    node = node.sibling;
  }

  fiber.subTreeFlags |= subTreeFlags;
}

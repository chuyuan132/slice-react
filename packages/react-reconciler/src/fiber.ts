import { Key, Props, Ref, Type } from 'shared/ReactTypes';
import { WorkTag } from './workTags';
import { Container } from 'hostConfig';
import { Flag, NotFlag } from './fiberFlags';

export class FiberNode {
  type: Type;
  tag: WorkTag;
  pendingProps: Props;
  key: Key;
  stateNode: any;
  return: FiberNode;
  sibling: FiberNode;
  child: FiberNode;
  index: number;
  ref: Ref;
  memoizedProps: Props;
  updateQueue: unknown;
  alternate: FiberNode | null;
  flags: Flag;
  memoizedState: any;

  constructor(tag: WorkTag, pendingProps: Props, key: Key) {
    // 实例属性
    this.tag = tag;
    this.key = key;
    this.type = null;
    this.stateNode = null;
    this.ref = null;

    // 表示节点之间的关系
    this.return = null;
    this.sibling = null;
    this.child = null;
    this.index = 0;

    // 工作单元
    this.pendingProps = pendingProps;
    this.memoizedProps = null;
    this.updateQueue = null;
    this.alternate = null;
    this.flags = NotFlag;
    this.memoizedState = null;
  }
}

export class FiberRootNode {
  container: Container;
  fiber: FiberNode;
  current: FiberNode;
  finishedWork:FiberNode;

  constructor(container: Container, fiber: FiberNode) {
    this.container = container;
    this.current = fiber;
    this.finishedWork = null;
    fiber.stateNode = this;
  }
}

export function createWorkInProgress(current: FiberNode, pendingProps: Props) {
  let wip = current.alternate;
  if(wip) {
    wip.flags = NotFlag
    wip.pendingProps = pendingProps;
  } else {
    wip = new FiberNode(current.tag, {}, current.key);

    wip.stateNode = current.stateNode;
    wip.alternate = current;
    current.alternate = wip;
  }
  wip.type = current.type;
	wip.updateQueue = current.updateQueue;
	wip.child = current.child;
	wip.memoizedProps = current.memoizedProps;
	wip.memoizedState = current.memoizedState;
	wip.ref = current.ref;
  wip.key = current.key;

  return wip;
}

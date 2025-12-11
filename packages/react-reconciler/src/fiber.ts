import { Props, Key, Type, Ref } from 'shared/ReactTypes'
import { HostRoot, WorkTag } from './ReactWorkTags';
import { Flags, NoFlag } from './fiberFlags';
import { Container } from 'hostConfig';
export class FiberNode {
  tag: WorkTag;
  pendingProps: Props | null;
  key: Key;
  memoizedProps: Props | null;
  stateNode: any;
  type: Type;
  return: FiberNode | null;
  sibling: FiberNode | null;
  child: FiberNode | null;
  index: number;
  ref: Ref;
  alternate: FiberNode  | null;
  flags: Flags
  updateQueue: unknown
  memoizedState: unknown
  constructor(tag: WorkTag, pendingProps: Props, key: Key) {
    // 实例
    this.tag = tag;
    this.key = key;
    this.type = null;
    this.stateNode = null;
    this.ref = null;

    // 形成树状结构
    this.return = null;
    this.sibling = null;
    this.child = null;
    this.index = 0;

    // 形成工作单元
    this.pendingProps = pendingProps;
    this.memoizedProps = null;
    this.memoizedState = null;
    this.alternate = null;
    this.updateQueue = null;

    // 副作用
    this.flags = NoFlag;
  }
}

export class FiberRootNode {
  container: Container
  current: FiberNode | null
  finishedWork: FiberNode | null

  constructor(container: Container, fiberNode: FiberNode) {
    this.container = container;
    this.current = fiberNode;
    this.finishedWork = null;
  }
}

export const createWorkInProgress = (current: FiberNode, pendingProps: Props) => {
  let wip = current.alternate
  if(wip === null) {
    // 首屏渲染
    wip = new FiberNode(current.tag, pendingProps, current.key)
    wip.stateNode = current.stateNode;
    wip.alternate = current;
    current.alternate = wip;
  } else {
    // 更新
    wip.pendingProps = pendingProps;
    wip.flags = NoFlag;
  }
  wip.type = current.type;
  wip.updateQueue = current.updateQueue;
  return wip

}
import { Props, Key, Type, Ref } from 'shared/ReactTypes'
import { WorkTag } from './ReactWorkTags';
import { Flags, NoFlag } from './fiberFlags';

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
  constructor(tag: WorkTag, pendingProps: Props, key: Key) {
    // 实例
    this.tag = tag;
    this.key = key;
    this.type = null;
    this.stateNode = null;

    // 形成树状结构
    this.return = null;
    this.sibling = null;
    this.child = null;
    this.index = 0;

    this.ref = null;

    // 形成工作单元
    this.pendingProps = pendingProps;
    this.memoizedProps = null;

    this.alternate = null;

    // 副作用
    this.flags = NoFlag;
  }
}
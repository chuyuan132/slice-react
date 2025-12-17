import { Key, Props, Ref, Type } from "shared/ReactTypes";
import { WorkTag } from "./workTags";

/**
 * 要实现ReactElement 与 FiberNode的对应
 * tag 与 type 是原值与值的对应
 * props需要分成两个，一个是上次的props，一个是要更新的props
 */
class FiberNode {
  type: Type | null
  tag: WorkTag
  pendingProps: Props;
  key: Key
  stateNode: any
  return: FiberNode | null
  sibling: FiberNode | null
  child: FiberNode | null
  index: number
  ref:Ref
  memoizedProps: Props
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
    this.index = 0

    // 工作单元
    this.pendingProps = pendingProps;
    this.memoizedProps = null;

  }
}
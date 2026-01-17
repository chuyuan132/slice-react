# React 原型项目分析

## 1. 项目整体架构

这是一个基于 Fiber 架构的 React 原型实现，采用了 Monorepo 结构，包含以下核心包：

- **react**: 核心 API 和 JSX 实现
- **react-dom**: DOM 渲染器实现
- **react-reconciler**: Fiber 协调器核心实现
- **shared**: 共享工具函数和类型定义

## 2. 核心数据结构

### 2.1 FiberNode

Fiber 架构的核心数据结构，代表一个工作单元：

```typescript
class FiberNode {
  type: Type;                // 节点类型（组件类型或标签名）
  tag: WorkTag;              // 节点类型标识（HostComponent/HostText等）
  pendingProps: Props;       // 待应用的属性
  key: Key;                  // React 元素的 key
  stateNode: any;            // 真实 DOM 节点或组件实例
  return: FiberNode | null;  // 父 Fiber 节点
  sibling: FiberNode | null; // 兄弟 Fiber 节点
  child: FiberNode | null;   // 子 Fiber 节点
  index: number;             // 子节点索引
  ref: Ref;                  // React ref
  memoizedProps: Props;      // 上一次渲染的属性
  updateQueue: unknown;      // 更新队列
  alternate: FiberNode | null; // 双缓存 Fiber 节点
  flags: Flag;               // 变更标记
  memoizedState: any;        // 组件状态
  subTreeFlags: Flag;        // 子树变更标记
}
```

### 2.2 FiberRootNode

Fiber 树的根节点，连接 React 应用和宿主环境：

```typescript
class FiberRootNode {
  container: Container;      // 宿主环境容器（如 DOM 元素）
  current: FiberNode;        // 当前渲染的 Fiber 树
  finishedWork: FiberNode | null; // 完成协调的 Fiber 树
}
```

## 3. 入口分析：fiberReconciler.ts

### 3.1 createContainer

创建一个 Fiber 根节点和 HostRoot Fiber 节点：

```typescript
export const createContainer = (container: Container) => {
  // 创建 HostRoot 类型的 Fiber 节点
  const hostRootFiber = new FiberNode(HostRoot, {}, null);
  // 创建 Fiber 根节点，连接宿主容器和 HostRoot Fiber
  const root = new FiberRootNode(container, hostRootFiber);
  // 为 HostRoot Fiber 初始化更新队列
  hostRootFiber.updateQueue = createUpdateQueue();
  return root;
};
```

### 3.2 updateContainer

触发一次更新，将 React 元素加入更新队列并开始协调：

```typescript
export const updateContainer = (element: ReactElementType, root: FiberRootNode) => {
  // 获取 HostRoot Fiber
  const hostRootFiber = root.current;
  // 获取更新队列
  const updateQueue = hostRootFiber.updateQueue as UpdateQueue<ReactElementType>;
  // 创建更新对象
  const update = createUpdate<ReactElementType>(element);
  // 将更新加入队列
  enQueueUpdate(updateQueue, update);
  // 开始协调过程
  scheduleUpdateOnFiber(hostRootFiber);
  return element;
};
```

## 4. 协调过程：workLoop.ts

### 4.1 整体流程

协调过程分为两个主要阶段：
1. **Render 阶段**：计算变更，生成新的 Fiber 树
2. **Commit 阶段**：应用变更到宿主环境

### 4.2 协调入口：scheduleUpdateOnFiber

```typescript
export function scheduleUpdateOnFiber(fiber: FiberNode) {
  // 找到对应的 Fiber 根节点
  const root = markUpdateFromFiberToRoot(fiber);
  // 开始渲染根节点
  renterRoot(root);
}
```

### 4.3 Render 阶段：renterRoot

```typescript
function renterRoot(root: FiberRootNode) {
  // 准备新的 Fiber 树（workInProgress）
  prepareFreshStack(root);
  try {
    // 开始协调循环
    workLook();
    // 标记完成的 Fiber 树
    root.finishedWork = root.current.alternate;
    // 进入 Commit 阶段
    commitRoot(root);
  } catch (err) {
    console.error('workLoop失败');
  }
}
```

### 4.4 协调循环：workLook

```typescript
function workLook() {
  // 遍历 workInProgress 树
  while (workInProgress) {
    // 处理当前 Fiber 节点
    preformUnitOfWork(workInProgress);
  }
}
```

### 4.5 处理单个 Fiber 节点：preformUnitOfWork

```typescript
function preformUnitOfWork(fiber: FiberNode) {
  // "递"阶段：创建子 Fiber 节点
  const next = beginWork(fiber);
  // 更新当前节点的属性
  fiber.memoizedProps = fiber.pendingProps;
  if (next !== null) {
    // 有子节点，继续处理子节点
    workInProgress = next;
  } else {
    // 无更多子节点，进入"归"阶段
    completeUnitOfWork(fiber);
  }
}
```

## 5. 递阶段：beginWork.ts

### 5.1 beginWork 主函数

根据 Fiber 节点类型进行不同处理：

```typescript
export function beginWork(fiber: FiberNode) {
  switch (fiber.tag) {
    case HostRoot:       // 根节点
      return updateHostRoot(fiber);
    case HostComponent:  // DOM 元素
      return updateHostComponent(fiber);
    case HostText:       // 文本节点
      return null;
    case FunctionComponent: // 函数组件
      return updateFunctionComponent(fiber);
    default:
      return null;
  }
}
```

### 5.2 HostRoot 处理

```typescript
function updateHostRoot(fiber: FiberNode) {
  // 处理更新队列，计算新状态
  const baseState = fiber.memoizedState;
  const updateQueue = fiber.updateQueue as UpdateQueue<ReactElementType>;
  const pending = updateQueue.share.pending;
  const { memoizedState } = processUpdateQueue(baseState, pending);
  fiber.memoizedState = memoizedState;
  updateQueue.share.pending = null;
  
  // 生成子 Fiber 节点
  const nextChildren = fiber.memoizedState;
  reconclierChildren(fiber, nextChildren);
  return fiber.child;
}
```

### 5.3 HostComponent 处理

```typescript
function updateHostComponent(fiber: FiberNode) {
  // 获取子元素
  const pendingProps = fiber.pendingProps;
  const nextChildren = pendingProps.children;
  // 生成子 Fiber 节点
  reconclierChildren(fiber, nextChildren);
  return fiber.child;
}
```

### 5.4 函数组件处理

```typescript
function updateFunctionComponent(fiber: FiberNode) {
  // 使用 Hooks 渲染组件，获取子元素
  const nextChildren = renderWithHooks(fiber);
  // 生成子 Fiber 节点
  reconclierChildren(fiber, nextChildren);
  return fiber.child;
}
```

### 5.5 子节点协调

```typescript
function reconclierChildren(wip: FiberNode, children: ReactElementType) {
  const current = wip.alternate;
  if (wip.alternate) {
    // 更新阶段：复用现有 Fiber 节点
    wip.child = reconcilerChildFibers(wip, current?.child || null, children);
  } else {
    // 挂载阶段：创建新的 Fiber 节点
    wip.child = mountChildFibers(wip, null, children);
  }
}
```

## 6. 归阶段：completeWork.ts

### 6.1 completeWork 主函数

构建真实 DOM 节点并收集变更标记：

```typescript
export function completeWork(fiber: FiberNode) {
  const current = fiber.alternate;
  switch (fiber.tag) {
    case HostComponent:  // DOM 元素
      if (current !== null && fiber.stateNode !== null) {
        // 更新阶段，暂不处理
      } else {
        // 挂载阶段，创建 DOM 实例
        const instance = createInstance(fiber.type);
        // 挂载所有子 DOM 节点
        appendAllChildren(instance, fiber);
        // 关联 DOM 实例
        fiber.stateNode = instance;
      }
      // 冒泡变更标记
      bubblePropertity(fiber);
      break;
      
    case HostText:       // 文本节点
      if (current !== null && fiber.stateNode !== null) {
        // 更新阶段，暂不处理
      } else {
        // 挂载阶段，创建文本节点
        fiber.stateNode = createTextInstance(fiber.pendingProps.content);
      }
      bubblePropertity(fiber);
      break;
      
    case HostRoot:       // 根节点
      bubblePropertity(fiber);
      break;
      
    case FunctionComponent: // 函数组件
      bubblePropertity(fiber);
      break;
  }
}
```

### 6.2 挂载子节点

```typescript
function appendAllChildren(parent: any, fiber: FiberNode) {
  let node = fiber.child;
  while (node !== null) {
    if (node.tag === HostComponent || node.tag === HostText) {
      // 挂载 DOM 节点
      appendInitialChild(parent, node.stateNode);
    } else if (node.child !== null) {
      // 继续深入子节点
      node = node.child;
      continue;
    }

    if (node === fiber) return;

    // 回溯处理兄弟节点
    while (node.sibling == null) {
      if (node.return == null || node.return == fiber) {
        return;
      }
      node = node.return;
    }
    node = node.sibling;
  }
}
```

## 7. Commit 阶段：commitWork.ts

将协调阶段计算出的变更应用到宿主环境（DOM）：

### 7.1 commitRoot 主函数

```typescript
export function commitRoot(root: FiberRootNode) {
  const finishedWork = root.finishedWork;
  if (finishedWork == null) {
    return;
  }
  
  root.finishedWork = null;
  // 检查是否有变更需要提交
  const rootHasEffect = (finishedWork.flags & MutationMark) !== NotFlag;
  const subTreeHasEffect = (finishedWork.subTreeFlags & MutationMark) !== NotFlag;
  
  if (rootHasEffect || subTreeHasEffect) {
    // beforeMutation 阶段：准备提交
    // mutation 阶段：应用 DOM 变更
    commitMutationEffects(finishedWork);
    // 更新当前 Fiber 树
    root.current = finishedWork;
    // layout 阶段：执行副作用和 ref
  } else {
    // 无变更，直接更新当前 Fiber 树
    root.current = finishedWork;
  }
}
```

### 7.2 处理变更：commitMutationEffects

```typescript
function commitMutationEffects(finishedWork: FiberNode) {
  nextEffect = finishedWork;
  // DFS 遍历处理所有标记的 Fiber 节点
  while (nextEffect !== null) {
    const child = nextEffect.child as any;
    // 深入处理有子树变更的节点
    if ((nextEffect.subTreeFlags & MutationMark) !== NotFlag && child !== null) {
      nextEffect = child;
    } else {
      // 处理当前节点和兄弟节点
      while (nextEffect !== null) {
        commitMutationEffectsOnFiber(nextEffect);
        if (nextEffect.sibling !== null) {
          nextEffect = nextEffect.sibling;
          break;
        }
        // 回溯父节点
        nextEffect = nextEffect.return;
      }
    }
  }
}
```

### 7.3 处理单个节点的变更

```typescript
function commitMutationEffectsOnFiber(finishedWork: FiberNode) {
  const { flags } = finishedWork;
  if ((flags & Placement) !== NotFlag) {
    // 处理新增节点
    commitPlacement(finishedWork);
    finishedWork.flags &= ~Placement;
  }
  if ((flags & Update) !== NotFlag) {
    // 处理更新节点（暂未实现）
  }
  if ((flags & ChildDeletion) !== NotFlag) {
    // 处理删除节点（暂未实现）
  }
}
```

## 8. 更新队列：updateQueue.ts

处理组件状态更新的数据结构：

```typescript
export interface Update<T> {
  action: Action<T>; // 更新动作（可以是值或函数）
}

export interface UpdateQueue<T> {
  share: {
    pending: Update<T> | null; // 待处理的更新
  };
}

// 创建更新
const createUpdate = <T>(action: Action<T>) => ({ action });

// 创建更新队列
const createUpdateQueue = () => ({ share: { pending: null } });

// 入队更新
const enQueueUpdate = <T>(updateQueue: UpdateQueue<T>, update: Update<T>) => {
  updateQueue.share.pending = update;
};

// 处理更新队列
const processUpdateQueue = <T>(baseState: T, pendingUpdate: Update<T> | null) => {
  const result = { memoizedState: baseState };
  if (!pendingUpdate) return result;
  
  // 如果是函数更新，执行函数
  if (pendingUpdate.action instanceof Function) {
    result.memoizedState = pendingUpdate.action(result.memoizedState);
  } else {
    // 否则直接使用新值
    result.memoizedState = pendingUpdate.action;
  }
  return result;
};
```

## 9. 工作流程总结

1. **初始化**：`createContainer` 创建 Fiber 根节点和 HostRoot Fiber
2. **渲染**：`updateContainer` 触发更新，创建更新对象并加入队列
3. **协调开始**：`scheduleUpdateOnFiber` 找到 Fiber 根节点，开始 `renterRoot`
4. **Render 阶段**：
   - **递阶段**：`beginWork` 深度优先遍历创建子 Fiber 节点
   - **归阶段**：`completeWork` 构建 DOM 树，收集变更标记
5. **Commit 阶段**：`commitRoot` 将变更应用到 DOM

## 10. 项目特点与限制

### 10.1 特点
- 实现了完整的 Fiber 架构
- 支持双缓存机制（current 和 workInProgress）
- 实现了 HostComponent、HostText 和 FunctionComponent
- 支持 Hooks 机制

### 10.2 限制
- 目前仅实现了 DOM 渲染器
- 未完全实现更新和删除操作
- 缺少事件系统
- 缺少错误边界处理

## 11. 关键文件索引

- **入口文件**：`packages/react-reconciler/src/fiberReconciler.ts`
- **核心数据结构**：`packages/react-reconciler/src/fiber.ts`
- **协调循环**：`packages/react-reconciler/src/workLoop.ts`
- **递阶段**：`packages/react-reconciler/src/beginWork.ts`
- **归阶段**：`packages/react-reconciler/src/comleteWork.ts`
- **提交阶段**：`packages/react-reconciler/src/commitWork.ts`
- **更新队列**：`packages/react-reconciler/src/updateQueue.ts`
- **节点类型**：`packages/react-reconciler/src/workTags.ts`

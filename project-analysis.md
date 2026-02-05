1. 初始更新触发（setState/useState/初始渲染）→ 进入「render 阶段」（异步可中断）
   a. 执行 `beginWork`：深度遍历 Fiber 树，创建/复用 Fiber 节点，打结构相关标记；
   b. 执行 `completeWork`：从叶子节点向上归并，生成离屏 DOM，打属性更新标记，归并整棵树的变更标记；
   c. render 阶段结束 → 生成「带完整变更标记的 finishedWork（新 Fiber 树）」，准备进入 commit 阶段；

2. 进入「commitRoot 阶段」（同步不可中断，核心处理+调度）
   a. 检测 Passive 标记 → 异步调度副作用执行（通过 Scheduler 注册宏任务：flushPassiveEffects，仅入队不执行）；
   b. 处理 Fiber 所有变更标记：执行 commitMutationEffects（更新真实 DOM、组件卸载、收集卸载副作用）→ （可选）执行 commitLayoutEffects（同步执行 useLayoutEffect、绑定 ref）；
   c. 切换 Fiber 树：root.current = finishedWork（新 Fiber 树成为当前生效树），重置相关状态；
   d. 兜底调度下一轮更新：调用 ensureRootIsScheduled → 检测 commit 同步阶段产生的新更新，调度下一轮 render+commit；

3. 浏览器主线程空闲 → 执行「副作用执行宏任务」（flushPassiveEffects）
   a. 批量执行所有堆积的副作用（卸载副作用清理 → 更新副作用先销毁旧的、再创建新的）；
   b. 副作用执行过程中，若产生新更新（如 useEffect 中 setState/请求数据后更新状态），标记到 root.pendingLanes；
   c. 副作用执行完毕 → 内部调用 ensureRootIsScheduled → 检测执行过程中产生的新更新，调度新一轮 render+commit；

4. 若有新更新 → 重复步骤 1-3，形成**无限且有序的渲染闭环**；若无新更新 → 调度终止，流程暂时结束。

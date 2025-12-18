react编译 -> 运行时 过程揭秘：
1、jsx语法经过babel编译后，会变成 jsx函数的调用，返回一个ReactElement对象结构
2、ReactElement对象结构不满足继续节点之间的关系，react-reconclier协调器运行时，会在ReactElement对象结构和DOM结构之间生成一个新的结构fiber结构
3、定义fiber结构，为什么要用类定义而不是工厂函数定义呢？因为fiber节点在运行时会被频繁创建，使用v8引擎的隐藏类特性和内联缓存机制可以提供创建性能

定义reconciler协调器实现首屏渲染

进度：
1、实现了jsx方法，可以提供jsx方法给bable编译成ReactElement
2、实现首屏渲染：

ReactDom.createRoot().render()原理：
createRoot 对应 底层的 createContainer
renfer 对应 底层的 updateContainer

1、createContainer：
创建fiberRootNode和hostRootFiber，互相建立连接，是属于current树的
2、updateContainer
初始化hostRootFiber的更新队列，update为传入的<App/>
开始调度更新，执行scheduleUpdateOnFiber进入更新流程
3、多种不同类型的更新都会通过scheduleUpdateOnFiber接入更新流程，所以要通过参数fiber往上找到fiberRootNode
4、找到之后，执行renderRoot方法，初始化workInProgress的指向
5、开始执行workLoop
6、beginwork的作用是递子节点，然后与结构发生变化的打上标记

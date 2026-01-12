import { FiberNode } from "./fiber";
import { HostComponent, HostRoot, HostText } from "./workTags";

/**
 * 递归中的归，从最深层的节点一级级挂载就好
 * 构建离屏的DOM树
 * 打上update标记
 * @param fiber
 */
export function comleteWork(fiber: FiberNode) {
  const current = fiber.alternate;
  switch(fiber.tag) {
    case HostComponent:
      if(current && fiber.stateNode) {
        // update,不做处理
      } else {
        // 根据宿主环境生成实例
        const instance = null;
        // 把fiber的child挂载到实例上
        appendAllChildren(instance, fiber)
      }
      break;
    case HostText:
      break;
    case HostRoot:
      break;
    default:
      if(__DEV__) {
        console.error('completeWork不支持的类型',fiber)
      }
  }
}

function appendAllChildren(oarent:any, fiber: FiberNode) {
  const node = fiber.child;
  while(node) {
    if(node.tag === HostComponent || node.tag === HostText) {
      // 挂载操作
    } else {

    }
  }

}
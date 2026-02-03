import { FiberRootNode } from './fiber';

export type Lane = number;
export type Lanes = number;

export const NoLane = 0b00000;
export const SyncLane = 0b00001;

export const lanes = NoLane;

// 合并lanes
export function mergeLanes(laneA: Lane, laneB: Lane) {
  return laneA | laneB;
}

// todo:为后续拓展提供空间
export function requestUpdateLane() {
  return SyncLane;
}

// 获取最高优先级
export function getHighestPriorityLane(lanes: Lanes) {
  return lanes & -lanes;
}

// 移除lane
export function markRootFinished(root: FiberRootNode, lane: Lane) {
  root.pendingLanes &= ~lane;
}

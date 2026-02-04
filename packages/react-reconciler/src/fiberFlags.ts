export const NotFlag = 0b0000000;
export const Placement = 0b0000001;
export const Update = 0b00000010;
export const ChildDeletion = 0b000000100;
export const PassiveEffect = 0b000001000; // 当前fiber有副作用需要处理
export type Flag = number;
export const MutationMark = Placement | Update | ChildDeletion;
export const PassiveMark = ChildDeletion | PassiveEffect; // 这里不等于NotFlag才需要执行副作用

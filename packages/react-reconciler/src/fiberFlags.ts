export const NotFlag = 0b0000000;
export const Placement = 0b0000001;
export const Update = 0b00000010;
export const ChildDeletion = 0b000000100;
export type Flag = number;
export const MutationMark = Placement | Update | ChildDeletion;

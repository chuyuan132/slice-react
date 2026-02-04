export const HookHasEffect = 0b00001; // 这个标记代表这个hook的数据结构是否需要执行副作用，如果存在这个标记，那么对应的fc的fiber一定也有一个passiveEffect标记
export const Passive = 0b00010; // effect的类型

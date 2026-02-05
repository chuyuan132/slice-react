let syncQueue: ((...args: any[]) => void)[] | null = null;
let isFlushingSyncQueue = false;
export function scheduleSyncTask(task: (...args: any[]) => void) {
  if (syncQueue === null) {
    syncQueue = [task];
  } else {
    syncQueue.push(task);
  }
}

export function flushSyncCallbacks() {
  if (!isFlushingSyncQueue && syncQueue !== null) {
    isFlushingSyncQueue = true;
    try {
      syncQueue.forEach(task => task());
    } catch (error) {
      console.error(error);
    } finally {
      isFlushingSyncQueue = false;
      syncQueue = null;
    }
  } else {
    if (__DEV__) {
      console.warn('flushSyncCallbacks: 批量更新任务正在执行中');
    }
  }
}

import { Container } from 'hostConfig';
import {
  unstable_getCurrentPriorityLevel,
  unstable_ImmediatePriority,
  unstable_NormalPriority,
  unstable_runWithPriority,
  unstable_UserBlockingPriority
} from 'scheduler';
import { Props } from 'shared/ReactTypes';

const elementPropsKey = '__props';

interface DOMElement extends Element {
  [elementPropsKey]?: Props;
}

type EventCallback = (e: Event) => void;

interface Paths {
  bubble: EventCallback[];
  capture: EventCallback[];
}

interface SyntheticEvent extends Event {
  _stopPropagation: boolean;
}

const validEventTypeList = ['click'];

function getEventCallbackNameByEventType(eventType: string) {
  return {
    click: ['onClick', 'onClickCapture']
  }[eventType];
}

export function updateFiberProps(node: DOMElement, props: Props) {
  node[elementPropsKey] = props;
}

export function initEvent(element: Container, eventType: string) {
  if (!validEventTypeList.includes(eventType)) {
    throw new Error(`当前不支持${eventType}事件`);
  }
  // 添加事件监听
  element.addEventListener(eventType, event => {
    dispatchEvent(element, eventType, event);
  });
}

function createSyntheticEvent(event: Event) {
  const syntheticEvent = event as unknown as SyntheticEvent;
  syntheticEvent._stopPropagation = false;
  const originStopPropagation = event.stopPropagation;
  syntheticEvent.stopPropagation = () => {
    syntheticEvent._stopPropagation = true;
    if (originStopPropagation) {
      originStopPropagation();
    }
  };
  return syntheticEvent;
}

function dispatchEvent(container: Container, eventType: string, event: Event) {
  // 收集沿途的事件
  const { bubble, capture } = collectPaths(event.target as DOMElement, container, eventType);
  // 创建合成事件
  const se = createSyntheticEvent(event);
  // 触发俘获和冒泡
  triggerEventFlow(capture, se);
  triggerEventFlow(bubble, se);
}
function triggerEventFlow(paths: EventCallback[], event: SyntheticEvent) {
  for (let i = 0; i < paths.length; i++) {
    const callback = paths[i];
    // 触发事件的时候，给对应的优先级，然后运行优先级运行函数
    const priority = eventTypeToSchedulerPriority(event.type);
    unstable_runWithPriority(priority, () => {
      callback.call(null, event);
    });
    unstable_getCurrentPriorityLevel;
    if (event._stopPropagation) {
      break;
    }
  }
}

function collectPaths(targetElement: DOMElement, container: Container, eventType: string) {
  const paths: Paths = {
    bubble: [],
    capture: []
  };
  while (targetElement && targetElement !== container) {
    const callbackNameList = getEventCallbackNameByEventType(eventType);
    callbackNameList?.forEach((i, idx) => {
      const callback = targetElement[elementPropsKey][i];
      if (callback) {
        if (idx === 0) {
          paths.bubble.push(callback);
        } else {
          paths.capture.unshift(callback);
        }
      }
    });
    targetElement = targetElement.parentNode as DOMElement;
  }
  return paths;
}

function eventTypeToSchedulerPriority(eventType: string) {
  switch (eventType) {
    case 'click':
    case 'keydown':
    case 'keyup':
      return unstable_ImmediatePriority;
    case 'scroll':
      return unstable_UserBlockingPriority;
    default:
      return unstable_NormalPriority;
  }
}

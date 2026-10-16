import { Vector2, Vector2i, Vector2u } from '../system/vector2';
import { Vector3, Vector3f } from '../system/vector3';
import type {
  KeyboardKey, KeyboardScancode, MouseButton, MouseWheel,
  JoystickAxis, SensorType,
} from './gen/constants';

interface KeyEvent {
  /** 受键盘布局影响的逻辑键码。 */
  code: KeyboardKey;
  /** 与键盘布局无关的物理扫描码。 */
  scancode: KeyboardScancode;
  /** 事件发生时 Alt 是否按下。 */
  alt: boolean;
  /** 事件发生时 Control 是否按下。 */
  control: boolean;
  /** 事件发生时 Shift 是否按下。 */
  shift: boolean;
  /** 事件发生时系统修饰键（如 Command）是否按下。 */
  system: boolean;
}

/** 窗口事件种类及其附带数据；位置均为客户区像素坐标。 */
export interface EventPayloads {
  /** 用户请求关闭窗口，需要应用自行调用 close()。 */
  Closed: {};
  /** 客户区尺寸变化。 */
  Resized: {
    /** 新客户区像素尺寸。 */
    size: Vector2u;
  };
  /** 失去输入焦点。 */
  FocusLost: {};
  /** 获得输入焦点。 */
  FocusGained: {};
  /** 输入了一个 Unicode 字符。 */
  TextEntered: {
    /** Unicode 码点，不是 UTF-16 代码单元。 */
    unicode: number;
  };
  /** 键盘按键按下。 */
  KeyPressed: KeyEvent;
  /** 键盘按键释放。 */
  KeyReleased: KeyEvent;
  /** 鼠标滚轮滚动。 */
  MouseWheelScrolled: {
    /** 垂直或水平滚轮。 */
    wheel: MouseWheel;
    /** 滚动量，可为小数；正值向上或向左。 */
    delta: number;
    /** 滚动时的客户区像素位置。 */
    position: Vector2i;
  };
  /** 鼠标按钮按下。 */
  MouseButtonPressed: {
    /** 按下的按钮。 */
    button: MouseButton;
    /** 客户区像素位置。 */
    position: Vector2i;
  };
  /** 鼠标按钮释放。 */
  MouseButtonReleased: {
    /** 释放的按钮。 */
    button: MouseButton;
    /** 客户区像素位置。 */
    position: Vector2i;
  };
  /** 鼠标在客户区移动。 */
  MouseMoved: {
    /** 客户区像素位置。 */
    position: Vector2i;
  };
  /** 未经过系统加速的原始鼠标移动。 */
  MouseMovedRaw: {
    /** 设备报告的相对移动量。 */
    delta: Vector2i;
  };
  /** 鼠标进入客户区。 */
  MouseEntered: {};
  /** 鼠标离开客户区。 */
  MouseLeft: {};
  /** 游戏手柄按钮按下。 */
  JoystickButtonPressed: {
    /** 从零开始的手柄编号。 */
    joystickId: number;
    /** 从零开始的按钮编号。 */
    button: number;
  };
  /** 游戏手柄按钮释放。 */
  JoystickButtonReleased: {
    /** 从零开始的手柄编号。 */
    joystickId: number;
    /** 从零开始的按钮编号。 */
    button: number;
  };
  /** 游戏手柄轴移动。 */
  JoystickMoved: {
    /** 从零开始的手柄编号。 */
    joystickId: number;
    /** 发生变化的轴。 */
    axis: JoystickAxis;
    /** 轴位置，范围 -100～100。 */
    position: number;
  };
  /** 游戏手柄接入。 */
  JoystickConnected: {
    /** 接入的手柄编号。 */
    joystickId: number;
  };
  /** 游戏手柄断开。 */
  JoystickDisconnected: {
    /** 断开的手柄编号。 */
    joystickId: number;
  };
  /** 触点开始。 */
  TouchBegan: {
    /** 触点编号。 */
    finger: number;
    /** 客户区像素位置。 */
    position: Vector2i;
  };
  /** 触点移动。 */
  TouchMoved: {
    /** 触点编号。 */
    finger: number;
    /** 客户区像素位置。 */
    position: Vector2i;
  };
  /** 触点结束。 */
  TouchEnded: {
    /** 触点编号。 */
    finger: number;
    /** 客户区像素位置。 */
    position: Vector2i;
  };
  /** 传感器测量值更新。 */
  SensorChanged: {
    /** 传感器类型，决定测量单位。 */
    type: SensorType;
    /** 三轴测量值。 */
    value: Vector3f;
  };
}

/** 支持的窗口事件种类名称。 */
export type EventKind = keyof EventPayloads;
/** 带 kind 判别字段的事件数据联合类型。 */
export type EventData<K extends EventKind = EventKind> = {
  [P in K]: {
    /** 事件种类，用于收窄对应的数据字段。 */
    readonly kind: P;
  } & EventPayloads[P];
}[K];
/** 按事件种类选择性提供的同步处理函数。 */
export type EventHandlers = {
  [K in EventKind]?: (event: EventData<K>) => void;
};
/** 接收任意窗口事件数据的访问函数。 */
export type EventVisitor<T = void> = (event: EventData) => T;

/** SFML's variant: `kind` identifies the subtype; payload fields stay intact. */
export class Event<K extends EventKind = EventKind> {
  /** 事件数据快照，可通过 kind 区分字段类型。 */
  readonly data: EventData<K>;

  /** 创建事件快照，同时复制其中的向量字段。 */
  constructor(data: EventData<K>) {
    const copy = { ...data };
    for (const key of Object.keys(copy)) {
      const value = (copy as Record<string, unknown>)[key];
      if (value instanceof Vector2 || value instanceof Vector3) {
        (copy as Record<string, unknown>)[key] = value instanceof Vector3
          ? new Vector3f(value as Vector3f)
          : value.scalarType === 'u32' ? new Vector2u(value as Vector2u)
            : new Vector2i(value as Vector2i);
      }
    }
    this.data = copy;
  }

  /** 事件种类名称。 */
  get kind(): K {
    return this.data.kind;
  }

  /** 判断事件种类，并在 TypeScript 中收窄事件类型。 */
  is<P extends EventKind>(kind: P): this is Event<K> & Event<P> {
    return (this.kind as EventKind) === kind;
  }

  /** 种类匹配时返回数据，否则返回 undefined。 */
  getIf<P extends EventKind>(kind: P): EventData<P> | undefined {
    return this.is(kind) ? this.data as EventData<P> : undefined;
  }

  /** 同步访问事件数据，返回 visitor 的结果。 */
  visit<T>(visitor: (event: EventData<K>) => T): T {
    return visitor(this.data);
  }
}

type NativeFields<T> = {
  [K in keyof T]: T[K] extends Vector2<'i32' | 'u32'>
    ? [number, number] : T[K] extends Vector3f
      ? [number, number, number] : T[K];
};
export type NativeWindowEvent = {
  [K in EventKind]: NativeFields<EventData<K>>;
}[EventKind];

export function windowEvent(raw: NativeWindowEvent): Event {
  const data = { ...raw } as unknown as EventData;
  if (data.kind === 'Resized') {
    data.size = new Vector2u(...(raw as NativeFields<EventData<'Resized'>>).size);
  }
  if ('position' in data && 'position' in raw && Array.isArray(raw.position)) {
    data.position = new Vector2i(...raw.position as [number, number]);
  }
  if (data.kind === 'MouseMovedRaw' && raw.kind === 'MouseMovedRaw') {
    data.delta = new Vector2i(...raw.delta);
  }
  if (data.kind === 'SensorChanged' && raw.kind === 'SensorChanged') {
    data.value = new Vector3f(...raw.value);
  }
  // Native events are already unique snapshots; avoid a second payload copy.
  return Object.assign(Object.create(Event.prototype), { data }) as Event;
}

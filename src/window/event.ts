import { Vector2, Vector2i, Vector2u } from '../system/vector2';
import { Vector3, Vector3f } from '../system/vector3';
import type {
  KeyboardKey, KeyboardScancode, MouseButton, MouseWheel,
  JoystickAxis, SensorType,
} from './gen/constants';

interface KeyEvent {
  /**
   * A logical key code affected by the keyboard layout.
   * @zh 受键盘布局影响的逻辑键码。
   * @ja キーボード配列の影響を受ける論理キーコード。
   * @ko 키보드 레이아웃의 영향을 받는 논리 키 코드.
   */
  code: KeyboardKey;
  /**
   * A physical scancode independent of the keyboard layout.
   * @zh 与键盘布局无关的物理扫描码。
   * @ja キーボード配列に依存しない物理スキャンコード。
   * @ko 키보드 레이아웃과 무관한 물리 스캔 코드.
   */
  scancode: KeyboardScancode;
  /**
   * Whether Alt was pressed when the event occurred.
   * @zh 事件发生时 Alt 是否按下。
   * @ja イベント発生時に Alt が押されていたかどうか。
   * @ko 이벤트 발생 시 Alt가 눌려 있었는지 여부.
   */
  alt: boolean;
  /**
   * Whether Control was pressed when the event occurred.
   * @zh 事件发生时 Control 是否按下。
   * @ja イベント発生時に Control が押されていたかどうか。
   * @ko 이벤트 발생 시 Control이 눌려 있었는지 여부.
   */
  control: boolean;
  /**
   * Whether Shift was pressed when the event occurred.
   * @zh 事件发生时 Shift 是否按下。
   * @ja イベント発生時に Shift が押されていたかどうか。
   * @ko 이벤트 발생 시 Shift가 눌려 있었는지 여부.
   */
  shift: boolean;
  /**
   * Whether the system modifier key (such as Command) was pressed when the
   * event occurred.
   * @zh 事件发生时系统修饰键（如 Command）是否按下。
   * @ja イベント発生時にシステム修飾キー（Command など）が押されていたかどうか。
   * @ko 이벤트 발생 시 시스템 보조 키(Command 등)가 눌려 있었는지 여부.
   */
  system: boolean;
}

/**
 * Window event kinds and their payloads; all positions are client-area
 * pixel coordinates.
 * @zh 窗口事件种类及其附带数据；位置均为客户区像素坐标。
 * @ja ウィンドウイベントの種類と付随データ。位置はすべてクライアント領域の
 * ピクセル座標。
 * @ko 윈도우 이벤트 종류와 부속 데이터. 위치는 모두 클라이언트 영역 픽셀 좌표이다.
 */
export interface EventPayloads {
  /**
   * The user requested closing the window; the application must call close().
   * @zh 用户请求关闭窗口，需要应用自行调用 close()。
   * @ja ユーザーがウィンドウを閉じるよう要求した。アプリが自ら close() を呼ぶ必要がある。
   * @ko 사용자가 윈도우 닫기를 요청했다. 애플리케이션이 직접 close()를 호출해야 한다.
   */
  Closed: {};
  /**
   * The client area changed size.
   * @zh 客户区尺寸变化。
   * @ja クライアント領域のサイズが変化した。
   * @ko 클라이언트 영역의 크기가 변경되었다.
   */
  Resized: {
    /**
     * The new client-area pixel dimensions.
     * @zh 新客户区像素尺寸。
     * @ja 新しいクライアント領域のピクセル寸法。
     * @ko 새로운 클라이언트 영역 픽셀 크기.
     */
    size: Vector2u;
  };
  /**
   * Input focus was lost.
   * @zh 失去输入焦点。
   * @ja 入力フォーカスを失った。
   * @ko 입력 포커스를 잃었다.
   */
  FocusLost: {};
  /**
   * Input focus was gained.
   * @zh 获得输入焦点。
   * @ja 入力フォーカスを得た。
   * @ko 입력 포커스를 얻었다.
   */
  FocusGained: {};
  /**
   * A Unicode character was entered.
   * @zh 输入了一个 Unicode 字符。
   * @ja Unicode 文字が入力された。
   * @ko Unicode 문자가 입력되었다.
   */
  TextEntered: {
    /**
     * A Unicode code point, not a UTF-16 code unit.
     * @zh Unicode 码点，不是 UTF-16 代码单元。
     * @ja UTF-16 コード単位ではなく、Unicode コードポイント。
     * @ko UTF-16 코드 단위가 아닌 Unicode 코드 포인트.
     */
    unicode: number;
  };
  /**
   * A keyboard key was pressed.
   * @zh 键盘按键按下。
   * @ja キーボードのキーが押された。
   * @ko 키보드 키가 눌렸다.
   */
  KeyPressed: KeyEvent;
  /**
   * A keyboard key was released.
   * @zh 键盘按键释放。
   * @ja キーボードのキーが離された。
   * @ko 키보드 키가 놓였다.
   */
  KeyReleased: KeyEvent;
  /**
   * A mouse wheel was scrolled.
   * @zh 鼠标滚轮滚动。
   * @ja マウスホイールがスクロールされた。
   * @ko 마우스 휠이 스크롤되었다.
   */
  MouseWheelScrolled: {
    /**
     * The vertical or horizontal wheel.
     * @zh 垂直或水平滚轮。
     * @ja 垂直または水平ホイール。
     * @ko 수직 또는 수평 휠.
     */
    wheel: MouseWheel;
    /**
     * Scroll amount, possibly fractional; positive values mean up or left.
     * @zh 滚动量，可为小数；正值向上或向左。
     * @ja スクロール量。小数も可能で、正の値は上または左方向。
     * @ko 스크롤 양. 소수도 가능하며 양수는 위쪽 또는 왼쪽을 뜻한다.
     */
    delta: number;
    /**
     * The client-area pixel position when scrolling occurred.
     * @zh 滚动时的客户区像素位置。
     * @ja スクロール時のクライアント領域内のピクセル位置。
     * @ko 스크롤 발생 시 클라이언트 영역 픽셀 위치.
     */
    position: Vector2i;
  };
  /**
   * A mouse button was pressed.
   * @zh 鼠标按钮按下。
   * @ja マウスボタンが押された。
   * @ko 마우스 버튼이 눌렸다.
   */
  MouseButtonPressed: {
    /**
     * The pressed button.
     * @zh 按下的按钮。
     * @ja 押されたボタン。
     * @ko 눌린 버튼.
     */
    button: MouseButton;
    /**
     * The client-area pixel position.
     * @zh 客户区像素位置。
     * @ja クライアント領域内のピクセル位置。
     * @ko 클라이언트 영역 픽셀 위치.
     */
    position: Vector2i;
  };
  /**
   * A mouse button was released.
   * @zh 鼠标按钮释放。
   * @ja マウスボタンが離された。
   * @ko 마우스 버튼이 놓였다.
   */
  MouseButtonReleased: {
    /**
     * The released button.
     * @zh 释放的按钮。
     * @ja 離されたボタン。
     * @ko 놓인 버튼.
     */
    button: MouseButton;
    /**
     * The client-area pixel position.
     * @zh 客户区像素位置。
     * @ja クライアント領域内のピクセル位置。
     * @ko 클라이언트 영역 픽셀 위치.
     */
    position: Vector2i;
  };
  /**
   * The mouse moved within the client area.
   * @zh 鼠标在客户区移动。
   * @ja マウスがクライアント領域内で移動した。
   * @ko 마우스가 클라이언트 영역 안에서 이동했다.
   */
  MouseMoved: {
    /**
     * The client-area pixel position.
     * @zh 客户区像素位置。
     * @ja クライアント領域内のピクセル位置。
     * @ko 클라이언트 영역 픽셀 위치.
     */
    position: Vector2i;
  };
  /**
   * Raw mouse movement without system acceleration.
   * @zh 未经过系统加速的原始鼠标移动。
   * @ja システムの加速処理を受けていない生のマウス移動。
   * @ko 시스템 가속을 적용하지 않은 원시 마우스 이동.
   */
  MouseMovedRaw: {
    /**
     * The relative movement reported by the device.
     * @zh 设备报告的相对移动量。
     * @ja デバイスが報告した相対移動量。
     * @ko 장치가 보고한 상대 이동량.
     */
    delta: Vector2i;
  };
  /**
   * The mouse entered the client area.
   * @zh 鼠标进入客户区。
   * @ja マウスがクライアント領域に入った。
   * @ko 마우스가 클라이언트 영역에 들어왔다.
   */
  MouseEntered: {};
  /**
   * The mouse left the client area.
   * @zh 鼠标离开客户区。
   * @ja マウスがクライアント領域から出た。
   * @ko 마우스가 클라이언트 영역을 벗어났다.
   */
  MouseLeft: {};
  /**
   * A joystick button was pressed.
   * @zh 游戏手柄按钮按下。
   * @ja ジョイスティックのボタンが押された。
   * @ko 조이스틱 버튼이 눌렸다.
   */
  JoystickButtonPressed: {
    /**
     * The zero-based joystick index.
     * @zh 从零开始的手柄编号。
     * @ja ゼロから始まるジョイスティック番号。
     * @ko 0부터 시작하는 조이스틱 번호.
     */
    joystickId: number;
    /**
     * The zero-based button index.
     * @zh 从零开始的按钮编号。
     * @ja ゼロから始まるボタン番号。
     * @ko 0부터 시작하는 버튼 번호.
     */
    button: number;
  };
  /**
   * A joystick button was released.
   * @zh 游戏手柄按钮释放。
   * @ja ジョイスティックのボタンが離された。
   * @ko 조이스틱 버튼이 놓였다.
   */
  JoystickButtonReleased: {
    /**
     * The zero-based joystick index.
     * @zh 从零开始的手柄编号。
     * @ja ゼロから始まるジョイスティック番号。
     * @ko 0부터 시작하는 조이스틱 번호.
     */
    joystickId: number;
    /**
     * The zero-based button index.
     * @zh 从零开始的按钮编号。
     * @ja ゼロから始まるボタン番号。
     * @ko 0부터 시작하는 버튼 번호.
     */
    button: number;
  };
  /**
   * A joystick axis moved.
   * @zh 游戏手柄轴移动。
   * @ja ジョイスティックの軸が動いた。
   * @ko 조이스틱 축이 움직였다.
   */
  JoystickMoved: {
    /**
     * The zero-based joystick index.
     * @zh 从零开始的手柄编号。
     * @ja ゼロから始まるジョイスティック番号。
     * @ko 0부터 시작하는 조이스틱 번호.
     */
    joystickId: number;
    /**
     * The axis that changed.
     * @zh 发生变化的轴。
     * @ja 変化した軸。
     * @ko 변경된 축.
     */
    axis: JoystickAxis;
    /**
     * The axis position, from -100 to 100.
     * @zh 轴位置，范围 -100～100。
     * @ja 軸の位置。範囲は -100～100。
     * @ko 축 위치. 범위는 -100～100.
     */
    position: number;
  };
  /**
   * A joystick was connected.
   * @zh 游戏手柄接入。
   * @ja ジョイスティックが接続された。
   * @ko 조이스틱이 연결되었다.
   */
  JoystickConnected: {
    /**
     * The index of the connected joystick.
     * @zh 接入的手柄编号。
     * @ja 接続されたジョイスティックの番号。
     * @ko 연결된 조이스틱의 번호.
     */
    joystickId: number;
  };
  /**
   * A joystick was disconnected.
   * @zh 游戏手柄断开。
   * @ja ジョイスティックが切断された。
   * @ko 조이스틱 연결이 끊어졌다.
   */
  JoystickDisconnected: {
    /**
     * The index of the disconnected joystick.
     * @zh 断开的手柄编号。
     * @ja 切断されたジョイスティックの番号。
     * @ko 연결이 끊어진 조이스틱의 번호.
     */
    joystickId: number;
  };
  /**
   * A touch began.
   * @zh 触点开始。
   * @ja タッチが開始した。
   * @ko 터치가 시작되었다.
   */
  TouchBegan: {
    /**
     * The touch index.
     * @zh 触点编号。
     * @ja タッチの番号。
     * @ko 터치 번호.
     */
    finger: number;
    /**
     * The client-area pixel position.
     * @zh 客户区像素位置。
     * @ja クライアント領域内のピクセル位置。
     * @ko 클라이언트 영역 픽셀 위치.
     */
    position: Vector2i;
  };
  /**
   * A touch moved.
   * @zh 触点移动。
   * @ja タッチが移動した。
   * @ko 터치가 이동했다.
   */
  TouchMoved: {
    /**
     * The touch index.
     * @zh 触点编号。
     * @ja タッチの番号。
     * @ko 터치 번호.
     */
    finger: number;
    /**
     * The client-area pixel position.
     * @zh 客户区像素位置。
     * @ja クライアント領域内のピクセル位置。
     * @ko 클라이언트 영역 픽셀 위치.
     */
    position: Vector2i;
  };
  /**
   * A touch ended.
   * @zh 触点结束。
   * @ja タッチが終了した。
   * @ko 터치가 종료되었다.
   */
  TouchEnded: {
    /**
     * The touch index.
     * @zh 触点编号。
     * @ja タッチの番号。
     * @ko 터치 번호.
     */
    finger: number;
    /**
     * The client-area pixel position.
     * @zh 客户区像素位置。
     * @ja クライアント領域内のピクセル位置。
     * @ko 클라이언트 영역 픽셀 위치.
     */
    position: Vector2i;
  };
  /**
   * A sensor measurement was updated.
   * @zh 传感器测量值更新。
   * @ja センサーの測定値が更新された。
   * @ko 센서 측정값이 갱신되었다.
   */
  SensorChanged: {
    /**
     * The sensor type, which determines the measurement unit.
     * @zh 传感器类型，决定测量单位。
     * @ja 測定単位を決定するセンサーの種類。
     * @ko 측정 단위를 결정하는 센서 타입.
     */
    type: SensorType;
    /**
     * The three-axis measurement.
     * @zh 三轴测量值。
     * @ja 3 軸の測定値。
     * @ko 3축 측정값.
     */
    value: Vector3f;
  };
}

/**
 * Names of supported window event kinds.
 * @zh 支持的窗口事件种类名称。
 * @ja 対応するウィンドウイベントの種類名。
 * @ko 지원하는 윈도우 이벤트 종류의 이름.
 */
export type EventKind = keyof EventPayloads;
/**
 * An event-data union discriminated by the kind field.
 * @zh 带 kind 判别字段的事件数据联合类型。
 * @ja kind フィールドで判別するイベントデータの共用体型。
 * @ko kind 필드로 판별하는 이벤트 데이터 유니온 타입.
 */
export type EventData<K extends EventKind = EventKind> = {
  [P in K]: {
    /**
     * The event kind, used to narrow the corresponding data fields.
     * @zh 事件种类，用于收窄对应的数据字段。
     * @ja 対応するデータフィールドの型を絞り込むイベントの種類。
     * @ko 해당 데이터 필드의 타입을 좁히는 데 사용하는 이벤트 종류.
     */
    readonly kind: P;
  } & EventPayloads[P];
}[K];
/**
 * Optional synchronous handlers for each event kind.
 * @zh 按事件种类选择性提供的同步处理函数。
 * @ja イベントの種類ごとに任意で指定する同期ハンドラー。
 * @ko 이벤트 종류별로 선택적으로 제공하는 동기 핸들러.
 */
export type EventHandlers = {
  [K in EventKind]?: (event: EventData<K>) => void;
};
/**
 * A visitor receiving data for any window event.
 * @zh 接收任意窗口事件数据的访问函数。
 * @ja 任意のウィンドウイベントデータを受け取るビジター関数。
 * @ko 모든 윈도우 이벤트 데이터를 받는 방문 함수.
 */
export type EventVisitor<T = void> = (event: EventData) => T;

/**
 * SFML's variant: `kind` identifies the subtype; payload fields stay intact.
 * @zh SFML 的变体：`kind` 标识子类型，载荷字段保持完整。
 * @ja SFML のバリアント。`kind` がサブタイプを識別し、ペイロードフィールドは保たれる。
 * @ko SFML의 변형 타입. `kind`로 하위 타입을 식별하며 페이로드 필드는 그대로 유지된다.
 */
export class Event<K extends EventKind = EventKind> {
  /**
   * An event-data snapshot whose field types can be distinguished by kind.
   * @zh 事件数据快照，可通过 kind 区分字段类型。
   * @ja kind でフィールドの型を区別できるイベントデータのスナップショット。
   * @ko kind로 필드 타입을 구분할 수 있는 이벤트 데이터 스냅샷.
   */
  readonly data: EventData<K>;

  /**
   * Create an event snapshot, copying its vector fields as well.
   * @zh 创建事件快照，同时复制其中的向量字段。
   * @ja ベクトルフィールドもコピーしてイベントのスナップショットを作成する。
   * @ko 벡터 필드도 함께 복사하여 이벤트 스냅샷을 생성한다.
   */
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

  /**
   * The event kind name.
   * @zh 事件种类名称。
   * @ja イベントの種類名。
   * @ko 이벤트 종류의 이름.
   */
  get kind(): K {
    return this.data.kind;
  }

  /**
   * Test the event kind and narrow the event type in TypeScript.
   * @zh 判断事件种类，并在 TypeScript 中收窄事件类型。
   * @ja イベントの種類を判定し、TypeScript でイベントの型を絞り込む。
   * @ko 이벤트 종류를 판별하고 TypeScript에서 이벤트 타입을 좁힌다.
   */
  is<P extends EventKind>(kind: P): this is Event<K> & Event<P> {
    return (this.kind as EventKind) === kind;
  }

  /**
   * Return the data if the kind matches, or undefined otherwise.
   * @zh 种类匹配时返回数据，否则返回 undefined。
   * @ja 種類が一致すればデータを、それ以外は undefined を返す。
   * @ko 종류가 일치하면 데이터를, 그렇지 않으면 undefined를 반환한다.
   */
  getIf<P extends EventKind>(kind: P): EventData<P> | undefined {
    return this.is(kind) ? this.data as EventData<P> : undefined;
  }

  /**
   * Visit event data synchronously and return the result of visitor.
   * @zh 同步访问事件数据，返回 visitor 的结果。
   * @ja イベントデータを同期的に訪問し、visitor の結果を返す。
   * @ko 이벤트 데이터를 동기적으로 방문하고 visitor의 결과를 반환한다.
   */
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

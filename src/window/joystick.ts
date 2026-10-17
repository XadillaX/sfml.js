import { native } from '../internal/native';
import type { JoystickAxis } from './gen/constants';

export {
  JoystickAxis as Axis, JoystickCount as Count,
  JoystickButtonCount as ButtonCount, JoystickAxisCount as AxisCount,
} from './gen/constants';

/**
 * Joystick device identification information.
 * @zh 手柄设备识别信息。
 * @ja ジョイスティックデバイスの識別情報。
 * @ko 조이스틱 장치 식별 정보.
 */
export interface Identification {
  /**
   * The device name.
   * @zh 设备名称。
   * @ja デバイス名。
   * @ko 장치 이름.
   */
  name: string;
  /**
   * The vendor ID.
   * @zh 厂商标识。
   * @ja ベンダー識別子。
   * @ko 제조사 식별자.
   */
  vendorId: number;
  /**
   * The product ID.
   * @zh 产品标识。
   * @ja 製品識別子。
   * @ko 제품 식별자.
   */
  productId: number;
}

/**
 * Return whether the specified joystick is connected; indices start at zero.
 * @zh 返回指定手柄是否连接，编号从零开始。
 * @ja 指定したジョイスティックが接続されているか返す。番号はゼロから始まる。
 * @ko 지정한 조이스틱이 연결되어 있는지 반환한다. 번호는 0부터 시작한다.
 */
export function isConnected(joystick: number): boolean {
  return native.isJoystickConnected(joystick);
}

/**
 * Return the number of buttons on the specified joystick.
 * @zh 返回指定手柄的按钮数量。
 * @ja 指定したジョイスティックのボタン数を返す。
 * @ko 지정한 조이스틱의 버튼 수를 반환한다.
 */
export function getButtonCount(joystick: number): number {
  return native.getJoystickButtonCount(joystick);
}

/**
 * Return whether the joystick provides the specified axis.
 * @zh 返回手柄是否提供指定轴。
 * @ja ジョイスティックが指定した軸を持つかどうかを返す。
 * @ko 조이스틱이 지정한 축을 제공하는지 반환한다.
 */
export function hasAxis(joystick: number, axis: JoystickAxis): boolean {
  return native.joystickHasAxis(joystick, axis);
}

/**
 * Query the pressed state of the specified joystick button; indices start
 * at zero.
 * @zh 查询指定手柄按钮的按下状态，编号从零开始。
 * @ja 指定したジョイスティックのボタンが押されているか確認する。番号はゼロから始まる。
 * @ko 지정한 조이스틱 버튼의 눌림 상태를 조회한다. 번호는 0부터 시작한다.
 */
export function isButtonPressed(joystick: number, button: number): boolean {
  return native.isJoystickButtonPressed(joystick, button);
}

/**
 * Return the specified axis position, from -100 to 100.
 * @zh 返回指定轴的位置，范围 -100～100。
 * @ja 指定した軸の位置を -100～100 の範囲で返す。
 * @ko 지정한 축의 위치를 -100～100 범위로 반환한다.
 */
export function getAxisPosition(joystick: number, axis: JoystickAxis): number {
  return native.getJoystickAxisPosition(joystick, axis);
}

/**
 * Return the specified joystick's name, vendor ID, and product ID.
 * @zh 返回指定手柄的名称、厂商及产品标识。
 * @ja 指定したジョイスティックの名前、ベンダー識別子、製品識別子を返す。
 * @ko 지정한 조이스틱의 이름, 제조사 식별자, 제품 식별자를 반환한다.
 */
export function getIdentification(joystick: number): Identification {
  return native.getJoystickIdentification(joystick);
}

/**
 * Refresh joystick state manually; window event processing also refreshes it.
 * @zh 手动刷新手柄状态；窗口事件处理也会执行刷新。
 * @ja ジョイスティックの状態を手動で更新する。ウィンドウイベント処理でも更新される。
 * @ko 조이스틱 상태를 수동으로 갱신한다. 윈도우 이벤트 처리에서도 갱신된다.
 */
export function update(): void {
  native.updateJoysticks();
}

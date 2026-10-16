import { native } from '../internal/native';
import type { JoystickAxis } from './gen/constants';

export {
  JoystickAxis as Axis, JoystickCount as Count,
  JoystickButtonCount as ButtonCount, JoystickAxisCount as AxisCount,
} from './gen/constants';

/** 手柄设备识别信息。 */
export interface Identification {
  /** 设备名称。 */
  name: string;
  /** 厂商标识。 */
  vendorId: number;
  /** 产品标识。 */
  productId: number;
}

/** 返回指定手柄是否连接，编号从零开始。 */
export function isConnected(joystick: number): boolean {
  return native.isJoystickConnected(joystick);
}

/** 返回指定手柄的按钮数量。 */
export function getButtonCount(joystick: number): number {
  return native.getJoystickButtonCount(joystick);
}

/** 返回手柄是否提供指定轴。 */
export function hasAxis(joystick: number, axis: JoystickAxis): boolean {
  return native.joystickHasAxis(joystick, axis);
}

/** 查询指定手柄按钮的按下状态，编号从零开始。 */
export function isButtonPressed(joystick: number, button: number): boolean {
  return native.isJoystickButtonPressed(joystick, button);
}

/** 返回指定轴的位置，范围 -100～100。 */
export function getAxisPosition(joystick: number, axis: JoystickAxis): number {
  return native.getJoystickAxisPosition(joystick, axis);
}

/** 返回指定手柄的名称、厂商及产品标识。 */
export function getIdentification(joystick: number): Identification {
  return native.getJoystickIdentification(joystick);
}

/** 手动刷新手柄状态；窗口事件处理也会执行刷新。 */
export function update(): void {
  native.updateJoysticks();
}

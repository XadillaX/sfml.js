import { native } from '../internal/native';
import { Vector3f } from '../system/vector3';
import type { SensorType } from './gen/constants';

export { SensorType as Type, SensorCount as Count } from './gen/constants';

/** 返回设备是否提供指定传感器。 */
export function isAvailable(sensor: SensorType): boolean {
  return native.isSensorAvailable(sensor);
}

/** 启用或停用传感器的数据采集。 */
export function setEnabled(sensor: SensorType, enabled: boolean): void {
  native.setSensorEnabled(sensor, enabled);
}

/** 返回三轴测量值：加速度为 m/s²、角速度为度/秒、磁场为 µT、方向为度。 */
export function getValue(sensor: SensorType): Vector3f {
  return new Vector3f(...native.getSensorValue(sensor));
}

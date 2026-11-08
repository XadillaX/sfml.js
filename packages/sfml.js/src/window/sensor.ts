import { native } from '../internal/native';
import { Vector3f } from '../system/vector3';
import type { SensorType } from './gen/constants';

export { SensorType as Type, SensorCount as Count } from './gen/constants';

/**
 * Return whether the device provides the specified sensor.
 * @zh 返回设备是否提供指定传感器。
 * @ja デバイスが指定したセンサーを提供するかどうかを返す。
 * @ko 장치가 지정한 센서를 제공하는지 반환한다.
 */
export function isAvailable(sensor: SensorType): boolean {
  return native.isSensorAvailable(sensor);
}

/**
 * Enable or disable sensor data acquisition.
 * @zh 启用或停用传感器的数据采集。
 * @ja センサーデータの収集を有効または無効にする。
 * @ko 센서 데이터 수집을 활성화하거나 비활성화한다.
 */
export function setEnabled(sensor: SensorType, enabled: boolean): void {
  native.setSensorEnabled(sensor, enabled);
}

/**
 * Return three-axis measurements: acceleration in m/s², angular velocity in
 * degrees/second, magnetic field in µT, and orientation in degrees.
 * @zh 返回三轴测量值：加速度为 m/s²、角速度为度/秒、磁场为 µT、方向为度。
 * @ja 3 軸の測定値を返す。加速度は m/s²、角速度は度/秒、磁場は µT、方向は度。
 * @ko 3축 측정값을 반환한다. 가속도는 m/s², 각속도는 도/초, 자기장은 µT,
 * 방향은 도 단위이다.
 */
export function getValue(sensor: SensorType): Vector3f {
  return new Vector3f(...native.getSensorValue(sensor));
}

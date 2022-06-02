declare module '*/binding.node' {
  interface SensorCodesInterface {
    Accelerometer: 0, Gyroscope: 1, Magnetometer: 2, Gravity: 3,
    UserAcceleration: 4, Orientation: 5,
  }

  export type SensorCode = _RangeOf<0, 5>;
  export type SensorStr = keyof SensorCodesInterface;
  export const sensorType: SensorCodesInterface;
  export function sensorIsAvailable(type: SensorCode): boolean;
  export function sensorSetEnabled(type: SensorCode, enabled: boolean): void;
  export function sensorGetValue(type: SensorCode): Vector3F;
}

import { Vector3F } from './vector3';

export enum Type {
  Accelerometer = 0, Gyroscope = 1, Magnetometer = 2, Gravity = 3,
  UserAcceleration = 4, Orientation = 5
}

export type TypeStr = keyof typeof Type;

export function isAvailable(sensor: Type): boolean;
export function setEnabled(sensor: Type, enabled: boolean): void;
export function getValue(sensor: Type): Vector3F;

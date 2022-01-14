export enum Axis {
  X = 0, Y = 1, Z = 2, R = 3,
  U = 4, V = 5, PovX = 6, PovY = 7
}

export type AxisStr = keyof typeof Axis;
type UnsignedInteger = number;

type Identification = {
  name: string;
  vendorId: number;
  productId: number;
};

export function isConnected(joystickId: UnsignedInteger): boolean;
export function getButtonCount(joystickId: UnsignedInteger): number;
export function hasAxis(joystickId: UnsignedInteger, axis: Axis): boolean;
export function isButtonPressed(joystickId: UnsignedInteger, button: UnsignedInteger): boolean;
export function getAxisPosition(joystickId: UnsignedInteger, axis: Axis): number;
export function getIdentification(joystickId: UnsignedInteger): Identification;
export function update(): void;

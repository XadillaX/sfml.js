export enum Axis {
  X = 0, Y = 1, Z = 2, R = 3,
  U = 4, V = 5, PovX = 6, PovY = 7
}

export type AxisStr = keyof typeof Axis;

type Identification = {
  name: string;
  vendorId: number;
  productId: number;
};

export function isConnected(joystickId: number): boolean;
export function getButtonCount(joystickId: number): number;
export function hasAxis(joystickId: number, axis: Axis): boolean;
export function isButtonPressed(joystickId: number, button: number): boolean;
export function getAxisPosition(joystickId: number, axis: Axis): number;
export function getIdentification(joystickId: number): Identification;
export function update(): void;

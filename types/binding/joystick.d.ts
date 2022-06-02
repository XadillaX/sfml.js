declare module '*/binding.node' {
  interface JoystickCodeInterface {
    X: 0, Y: 1, Z: 2, R: 3,
    U: 4, V: 5, PovX: 6, PovY: 7,
  }

  export type JoystickCode = _RangeOf<0, 7>;
  export type JoystickStr = keyof JoystickCodeInterface;

  export interface JoystickIdentification {
    name: string;
    vendorId: Uint32;
    productId: Uint32;
  }

  export const joystickAxis: JoystickCodeInterface;
  export function joystickIsConnected(id: Uint32): boolean;
  export function joystickGetButtonCount(id: Uint32): Uint32;
  export function joystickHasAxis(id: Uint32, axis: JoystickCode): boolean;
  export function joystickIsButtonPressed(id: Uint32, button: Uint32): boolean;
  export function joystickGetAxisPosition(
    id: Uint32,
    axis: JoystickCode,
  ): Float;
  export function joystickGetIdentification(id: Uint32): JoystickIdentification;
  export function joystickUpdate(): void;
}

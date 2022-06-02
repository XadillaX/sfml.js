declare module '*/binding.node' {
  export type MouseCode = _RangeOf<0, 4>;
  export type MouseStr = 'Left' | 'Right' | 'Middle' | 'XButton1' | 'XButton2';
  export type MouseWheelCode = _RangeOf<0, 1>;
  export type MouseWheelStr = 'VerticalWheel' | 'HorizontalWheel';

  type MouseCodeOrStr = MouseCode | MouseStr;
  export function isMouseButtonPressed(button: MouseCodeOrStr): boolean;
  export function getPosition(): Vector2I;
  export function setPosition(pos: Vector2I): void;
}
